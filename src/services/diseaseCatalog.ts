import { CropType, DiseaseRecommendation } from '../types';
import { DISEASE_DATABASE } from '../data/diseaseDatabase';
import { dbService } from './db';

const CATALOG_KEY = 'diseaseCatalog';

export type DiseaseCatalog = Record<CropType, DiseaseRecommendation[]>;

const CROPS: CropType[] = ['Maize', 'Potato', 'Tomato', 'Wheat', 'Beans'];

function cloneCatalog(source: DiseaseCatalog): DiseaseCatalog {
  return JSON.parse(JSON.stringify(source)) as DiseaseCatalog;
}

function emptyCatalog(): DiseaseCatalog {
  return {
    Maize: [],
    Potato: [],
    Tomato: [],
    Wheat: [],
    Beans: [],
  };
}

function normalizeCatalog(raw: unknown): DiseaseCatalog {
  const base = emptyCatalog();
  if (!raw || typeof raw !== 'object') return cloneCatalog(DISEASE_DATABASE);

  const input = raw as Partial<Record<CropType, DiseaseRecommendation[]>>;
  for (const crop of CROPS) {
    const list = input[crop];
    base[crop] = Array.isArray(list) ? list : cloneCatalog(DISEASE_DATABASE)[crop];
  }
  return base;
}

class DiseaseCatalogService {
  public getDefaultCatalog(): DiseaseCatalog {
    return cloneCatalog(DISEASE_DATABASE);
  }

  public async getCatalog(): Promise<DiseaseCatalog> {
    const saved = await dbService.getSetting<DiseaseCatalog>(CATALOG_KEY);
    if (!saved) return this.getDefaultCatalog();
    return normalizeCatalog(saved);
  }

  public async saveCatalog(catalog: DiseaseCatalog): Promise<void> {
    await dbService.saveSetting(CATALOG_KEY, normalizeCatalog(catalog));
  }

  public async updateDisease(
    cropType: CropType,
    diseaseName: string,
    updates: Partial<DiseaseRecommendation>
  ): Promise<DiseaseCatalog> {
    const catalog = await this.getCatalog();
    const index = catalog[cropType].findIndex(
      (d) => d.diseaseName.toLowerCase() === diseaseName.toLowerCase()
    );
    if (index < 0) throw new Error('DISEASE_NOT_FOUND');

    catalog[cropType][index] = {
      ...catalog[cropType][index],
      ...updates,
      swahili: {
        ...catalog[cropType][index].swahili,
        ...(updates.swahili ?? {}),
      },
    };
    await this.saveCatalog(catalog);
    return catalog;
  }

  public async addDisease(cropType: CropType, disease: DiseaseRecommendation): Promise<DiseaseCatalog> {
    const catalog = await this.getCatalog();
    const exists = catalog[cropType].some(
      (d) => d.diseaseName.toLowerCase() === disease.diseaseName.toLowerCase()
    );
    if (exists) throw new Error('DISEASE_EXISTS');

    catalog[cropType] = [...catalog[cropType], disease];
    await this.saveCatalog(catalog);
    return catalog;
  }

  public async deleteDisease(cropType: CropType, diseaseName: string): Promise<DiseaseCatalog> {
    const catalog = await this.getCatalog();
    const next = catalog[cropType].filter(
      (d) => d.diseaseName.toLowerCase() !== diseaseName.toLowerCase()
    );
    if (next.length === catalog[cropType].length) throw new Error('DISEASE_NOT_FOUND');
    if (next.length === 0) throw new Error('LAST_DISEASE');

    catalog[cropType] = next;
    await this.saveCatalog(catalog);
    return catalog;
  }

  public async resetToDefaults(): Promise<DiseaseCatalog> {
    const catalog = this.getDefaultCatalog();
    await this.saveCatalog(catalog);
    return catalog;
  }
}

export const diseaseCatalogService = new DiseaseCatalogService();
export { CROPS as DISEASE_CROPS };
export default diseaseCatalogService;
