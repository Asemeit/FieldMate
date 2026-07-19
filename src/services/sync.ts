import { dbService } from './db';
import { claudeVisionService } from './claude';
import { normalizeConfidence } from '../lib/diagnosisUtils';

type SyncCallback = (status: 'syncing' | 'idle', count?: number) => void;

class OfflineSyncService {
  private isSyncing = false;
  private listeners: SyncCallback[] = [];
  private apiKey: string | undefined;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.triggerSync());
      
      // Attempt sync on load if online
      if (navigator.onLine) {
        setTimeout(() => this.triggerSync(), 3000);
      }
    }
  }

  public setApiKey(key?: string) {
    this.apiKey = key;
  }

  public addSyncListener(listener: SyncCallback) {
    this.listeners.push(listener);
  }

  public removeSyncListener(listener: SyncCallback) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notify(status: 'syncing' | 'idle', count?: number) {
    this.listeners.forEach(listener => listener(status, count));
  }

  /**
   * Scan IndexedDB for pending records and sync them to the cloud if we are online.
   */
  public async triggerSync(): Promise<number> {
    if (this.isSyncing) return 0;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('Sync triggered, but device is offline.');
      return 0;
    }

    try {
      const pendingList = await dbService.getPendingDiagnoses();
      if (pendingList.length === 0) {
        return 0;
      }

      console.log(`Found ${pendingList.length} pending diagnoses to sync!`);
      this.isSyncing = true;
      this.notify('syncing', pendingList.length);

      // Read API Key from settings if not set in memory
      if (!this.apiKey) {
        this.apiKey = await dbService.getSetting<string>('anthropicApiKey') || undefined;
      }

      let successCount = 0;

      for (const diag of pendingList) {
        try {
          // Send image to Claude Vision API using the stored API key
          const freshDiagnosis = await claudeVisionService.analyzeLeafImage(
            diag.imageUrl,
            diag.cropType,
            this.apiKey
          );

          if (freshDiagnosis.id !== diag.id) {
            await dbService.deleteDiagnosis(freshDiagnosis.id);
          }

          const confidence = normalizeConfidence(freshDiagnosis.confidence, 75);

          diag.diseaseName = freshDiagnosis.diseaseName;
          diag.confidence = confidence;
          diag.recommendation = { ...freshDiagnosis.recommendation, confidence };
          diag.analysisMode = freshDiagnosis.analysisMode;
          diag.syncStatus = 'synced';

          await dbService.saveDiagnosis(diag);
          successCount++;
        } catch (err) {
          console.error(`Failed to sync individual diagnosis ${diag.id}:`, err);
          // Keep in pending state so we can retry on next online event
        }
      }

      console.log(`Successfully synced ${successCount} out of ${pendingList.length} diagnoses.`);
      return successCount;
    } catch (err) {
      console.error('Error during background synchronization process:', err);
      return 0;
    } finally {
      this.isSyncing = false;
      this.notify('idle');
    }
  }
}

export const syncService = new OfflineSyncService();
export default syncService;
