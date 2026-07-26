import { CropType, DiseaseRecommendation, Diagnosis } from '../types';
import { dbService } from './db';
import { mlClassifierService } from './mlClassifier';
import { normalizeConfidence } from '../lib/diagnosisUtils';
import { diseaseCatalogService } from './diseaseCatalog';


class ClaudeVisionService {
  private syncStatusForSave(): 'synced' | 'pending' {
    return navigator.onLine ? 'synced' : 'pending';
  }

  /**
   * Main entry: TensorFlow.js ML first, then Claude Vision API, then demo simulation.
   */
  public async analyzeLeafImage(
    base64Image: string,
    cropType: CropType,
    apiKey?: string
  ): Promise<Diagnosis> {
    if (mlClassifierService.supportsCrop(cropType)) {
      try {
        const mlResult = await mlClassifierService.predict(base64Image, cropType);
        if (mlResult) {
          return this.buildDiagnosisFromML(base64Image, cropType, mlResult);
        }
      } catch (error) {
        console.warn('On-device ML analysis failed, trying fallback...', error);
      }
    }

    if (apiKey && apiKey.trim() !== '') {
      try {
        return await this.runClaudeAnalysis(base64Image, cropType, apiKey);
      } catch (error) {
        console.warn('Claude Vision API failed. Falling back to demo mode...', error);
      }
    }

    console.log(`Running advisory simulation for ${cropType}...`);
    return this.runMockAdvisorySimulation(base64Image, cropType);
  }

  private async buildDiagnosisFromML(
    base64Image: string,
    cropType: CropType,
    mlResult: { diseaseName: string; confidence: number; isHealthy: boolean }
  ): Promise<Diagnosis> {
    let recommendation: DiseaseRecommendation;

    if (mlResult.isHealthy) {
      recommendation = mlClassifierService.buildHealthyRecommendation(cropType);
      recommendation.confidence = normalizeConfidence(mlResult.confidence, 85);
    } else {
      const catalog = await diseaseCatalogService.getCatalog();
      const matched = mlClassifierService.findRecommendation(
        cropType,
        mlResult.diseaseName,
        catalog
      );
      const mlConfidence = normalizeConfidence(mlResult.confidence, 75);
      recommendation = matched
        ? { ...matched, confidence: mlConfidence, diseaseName: mlResult.diseaseName }
        : {
            ...(catalog[cropType][0] || catalog.Maize[0]),
            diseaseName: mlResult.diseaseName,
            confidence: mlConfidence,
          };
    }

    const confidence = normalizeConfidence(recommendation.confidence, 75);
    const diagnosis: Diagnosis = {
      id: `diag_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      cropType,
      diseaseName: recommendation.diseaseName,
      confidence,
      imageUrl: base64Image,
      recommendation: { ...recommendation, confidence },
      timestamp: Date.now(),
      syncStatus: this.syncStatusForSave(),
      analysisMode: 'ml',
    };

    await dbService.saveDiagnosis(diagnosis);
    return diagnosis;
  }

  private async runClaudeAnalysis(
    base64Image: string,
    cropType: CropType,
    apiKey: string
  ): Promise<Diagnosis> {
      // Clean base64 header if present
      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
      const mediaType = base64Image.match(/^data:(image\/(png|jpeg|webp|gif));base64,/)?.[1] || "image/jpeg";

      const prompt = `Analyze this crop leaf photo. The selected crop is ${cropType}. 
Identify the disease affecting the leaf. Choose from the standard diseases for this crop:
- Maize: Common Rust, Northern Corn Leaf Blight
- Potato: Late Blight, Early Blight
- Tomato: Late Blight, Early Blight
- Wheat: Leaf Rust
- Beans: Anthracnose

If the leaf is healthy, return "Healthy Leaf" as the diseaseName.
Otherwise, identify the disease and provide highly practical treatment and prevention strategies.

You MUST respond ONLY with a valid JSON block containing no formatting except standard JSON. Do not include markdown wraps or backticks in the response. Use this exact schema:
{
  "diseaseName": "Late Blight",
  "confidence": 95,
  "severity": "High",
  "symptoms": [
    "Dark, water-soaked spots on leaf tips.",
    "Delicate white powdery mold on leaf underside."
  ],
  "causes": [
    "High humidity above 90% and mild temperatures.",
    "Overhead irrigation keeping leaves wet."
  ],
  "treatment": [
    "Apply metalaxyl fungicide immediately.",
    "Prune and destroy infected stems."
  ],
  "prevention": [
    "Use certified disease-free tubers.",
    "Practice drip irrigation."
  ],
  "swahili": {
    "diseaseName": "Baka Chelewa la Viazi",
    "severity": "Juu",
    "symptoms": [
      "Madoa meusi na yaliyolowa maji kwenye majani.",
      "Ukungu mweupe chini ya jani."
    ],
    "causes": [
      "Unyevu mwingi na baridi kiasi.",
      "Kumwagilia maji juu ya majani."
    ],
    "treatment": [
      "Nyunyizia metalaxyl haraka.",
      "Kata matawi yaliyoathirika."
    ],
    "prevention": [
      "Tumia mbegu zilizothibitishwa.",
      "Mwagilia mizizi kwa drip."
    ]
  }
}`;

      // Execute front-end HTTP request direct to Anthropic API
      // Since it's client-side, we bypass CORS restrictions or handle them directly.
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307', // Very cost-effective and lightning-fast for frontend PWAs
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: cleanBase64
                  }
                },
                {
                  type: 'text',
                  text: prompt
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API request failed: ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json();
      const textResponse = responseData.content[0].text;
      
      // Clean and parse JSON
      const jsonStart = textResponse.indexOf('{');
      const jsonEnd = textResponse.lastIndexOf('}') + 1;
      const cleanJson = textResponse.substring(jsonStart, jsonEnd);
      
      const parsedAdvisory = JSON.parse(cleanJson) as Omit<DiseaseRecommendation, "confidence">;

      const diagnosis: Diagnosis = {
        id: `diag_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        cropType,
        diseaseName: parsedAdvisory.diseaseName,
        confidence: (parsedAdvisory as any).confidence || Math.floor(Math.random() * 15) + 80,
        imageUrl: base64Image,
        recommendation: {
          diseaseName: parsedAdvisory.diseaseName,
          confidence: (parsedAdvisory as any).confidence || 90,
          severity: parsedAdvisory.severity,
          symptoms: parsedAdvisory.symptoms,
          causes: parsedAdvisory.causes,
          treatment: parsedAdvisory.treatment,
          prevention: parsedAdvisory.prevention,
          swahili: parsedAdvisory.swahili
        },
        timestamp: Date.now(),
        syncStatus: this.syncStatusForSave(),
        analysisMode: 'live-ai',
      };

      await dbService.saveDiagnosis(diagnosis);

      return diagnosis;
  }

  /**
   * Generates extremely high-fidelity mock diagnosis results in both languages when offline or when no API key is specified.
   */
  private async runMockAdvisorySimulation(base64Image: string, cropType: CropType): Promise<Diagnosis> {
    return new Promise((resolve) => {
      // Simulate scanning process latency for 2.5 seconds to create scanning effect WOW factor
      setTimeout(async () => {
        const catalog = await diseaseCatalogService.getCatalog();
        const diseases = catalog[cropType];
        
        // Select random disease or fallback to first
        const selectedDisease = diseases[Math.floor(Math.random() * diseases.length)] || diseases[0];

        const mockDiagnosis: Diagnosis = {
          id: `diag_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          cropType,
          diseaseName: selectedDisease.diseaseName,
          confidence: selectedDisease.confidence,
          imageUrl: base64Image,
          recommendation: selectedDisease,
          timestamp: Date.now(),
          syncStatus: this.syncStatusForSave(),
          analysisMode: 'demo',
        };

        // Cache locally in IndexedDB
        await dbService.saveDiagnosis(mockDiagnosis).catch(err => 
          console.error('Failed to cache mock diagnosis:', err)
        );

        resolve(mockDiagnosis);
      }, 2500);
    });
  }
}

export const claudeVisionService = new ClaudeVisionService();
export default claudeVisionService;
