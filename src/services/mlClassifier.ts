import * as tf from '@tensorflow/tfjs';
import { CropType, DiseaseRecommendation } from '../types';
import { normalizeConfidence } from '../lib/diagnosisUtils';

const MODEL_URL = '/models/plant-disease/model.json';
const LABELS_URL = '/models/plant-disease/class_indices.json';
const INPUT_SIZE = 224;

/** PlantVillage class label → FieldMate disease name */
const CLASS_TO_DISEASE: Record<string, string> = {
  'Corn_(maize)___Common_rust_': 'Common Rust',
  'Corn_(maize)___Northern_Leaf_Blight': 'Northern Corn Leaf Blight',
  'Potato___Early_blight': 'Early Blight',
  'Potato___Late_blight': 'Late Blight',
  'Tomato___Early_blight': 'Early Blight',
  'Tomato___Late_blight': 'Late Blight',
};

const CROP_PREFIX: Partial<Record<CropType, string>> = {
  Maize: 'Corn_(maize)___',
  Potato: 'Potato___',
  Tomato: 'Tomato___',
};

export interface MLPrediction {
  classLabel: string;
  confidence: number;
  diseaseName: string;
  isHealthy: boolean;
}

class MLClassifierService {
  private model: tf.LayersModel | null = null;
  private classIndices: Record<string, string> | null = null;
  private loadPromise: Promise<boolean> | null = null;

  public supportsCrop(cropType: CropType): boolean {
    return cropType in CROP_PREFIX;
  }

  public async ensureLoaded(): Promise<boolean> {
    if (this.model && this.classIndices) return true;
    if (!this.loadPromise) {
      this.loadPromise = this.loadModel();
    }
    return this.loadPromise;
  }

  private async loadModel(): Promise<boolean> {
    try {
      const [model, labelsResponse] = await Promise.all([
        tf.loadLayersModel(MODEL_URL),
        fetch(LABELS_URL),
      ]);
      if (!labelsResponse.ok) throw new Error('Failed to load class labels');
      this.model = model;
      this.classIndices = await labelsResponse.json();
      return true;
    } catch (error) {
      console.warn('ML model failed to load:', error);
      this.model = null;
      this.classIndices = null;
      return false;
    }
  }

  public async predict(
    base64Image: string,
    cropType: CropType
  ): Promise<MLPrediction | null> {
    if (!this.supportsCrop(cropType)) return null;

    const ready = await this.ensureLoaded();
    if (!ready || !this.model || !this.classIndices) return null;

    const prefix = CROP_PREFIX[cropType]!;
    const cropIndices = Object.entries(this.classIndices)
      .filter(([, label]) => label.startsWith(prefix))
      .map(([idx]) => Number(idx));

    if (cropIndices.length === 0) return null;

    const tensor = await this.preprocessImage(base64Image);
    const predictions = this.model.predict(tensor) as tf.Tensor;
    const probs = Array.from(await predictions.data());
    tensor.dispose();
    predictions.dispose();

    let bestIdx = cropIndices[0];
    let bestProb = Number(probs[bestIdx]) || 0;
    let cropSum = 0;
    for (const idx of cropIndices) {
      const p = Number(probs[idx]) || 0;
      cropSum += p;
      if (p > bestProb) {
        bestProb = p;
        bestIdx = idx;
      }
    }

    // Renormalize within this crop's classes so confidence is meaningful
    const normalizedProb = cropSum > 0 ? bestProb / cropSum : 1 / cropIndices.length;
    const confidencePercent = normalizeConfidence(normalizedProb * 100, 75);

    const classLabel = this.classIndices[String(bestIdx)];
    const isHealthy = classLabel.toLowerCase().includes('healthy');
    const diseaseName = isHealthy
      ? 'Healthy Leaf'
      : CLASS_TO_DISEASE[classLabel] || this.fallbackDiseaseName(classLabel);

    return {
      classLabel,
      confidence: confidencePercent,
      diseaseName,
      isHealthy,
    };
  }

  private fallbackDiseaseName(classLabel: string): string {
    const part = classLabel.split('___')[1] || classLabel;
    return part.replace(/_/g, ' ').trim();
  }

  private async preprocessImage(base64Image: string): Promise<tf.Tensor4D> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const tensor = tf.browser
            .fromPixels(img)
            .resizeNearestNeighbor([INPUT_SIZE, INPUT_SIZE])
            .toFloat()
            .div(255)
            .expandDims(0) as tf.Tensor4D;
          resolve(tensor);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to decode image for ML'));
      img.src = base64Image;
    });
  }

  public findRecommendation(
    cropType: CropType,
    diseaseName: string,
    database: Record<CropType, DiseaseRecommendation[]>
  ): DiseaseRecommendation | null {
    const diseases = database[cropType];
    const match = diseases.find(
      (d) => d.diseaseName.toLowerCase() === diseaseName.toLowerCase()
    );
    if (match) return { ...match };
    return diseases[0] ? { ...diseases[0] } : null;
  }

  public buildHealthyRecommendation(cropType: CropType): DiseaseRecommendation {
    return {
      diseaseName: 'Healthy Leaf',
      confidence: 90,
      severity: 'Low',
      symptoms: [`No significant disease symptoms detected on this ${cropType} leaf.`],
      causes: ['Leaf appears healthy under current visual analysis.'],
      treatment: ['No chemical treatment required at this time.'],
      prevention: [
        'Continue routine scouting and maintain good field hygiene.',
        'Monitor weather conditions for disease risk changes.',
      ],
      swahili: {
        diseaseName: 'Jani Bora',
        severity: 'Chini',
        symptoms: [`Hakuna dalili kubwa za ugonjwa zilizogunduliwa kwenye jani hili la ${cropType}.`],
        causes: ['Jani linaonekana bora kulingana na uchambuzi wa picha.'],
        treatment: ['Hakuna matibabu ya dawa yanayohitajika kwa sasa.'],
        prevention: [
          'Endelea ukaguzi wa kawaida wa shamba.',
          'Fuatilia hali ya hewa kwa hatari ya magonjwa.',
        ],
      },
    };
  }
}

export const mlClassifierService = new MLClassifierService();
export default mlClassifierService;
