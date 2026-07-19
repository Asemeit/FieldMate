import { Diagnosis, WeatherData, UserSettings, StoredUser } from '../types';

const DB_NAME = 'FieldMateDB';
const DB_VERSION = 2;

class IndexedDBService {
  private db: IDBDatabase | null = null;

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event);
        reject(new Error('Failed to open IndexedDB database.'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Diagnosis Store: captures offline diagnoses, crop leaf photos, sync markers
        if (!db.objectStoreNames.contains('diagnoses')) {
          const diagnosesStore = db.createObjectStore('diagnoses', { keyPath: 'id' });
          diagnosesStore.createIndex('timestamp', 'timestamp', { unique: false });
          diagnosesStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // Weather Store: caches meteorological telemetry to display offline
        if (!db.objectStoreNames.contains('weather')) {
          db.createObjectStore('weather', { keyPath: 'location' });
        }

        // Settings Store: saves user preferences and optional API keys
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Users Store: registered farmer accounts (v2)
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'email' });
          usersStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        console.log('IndexedDB Schema initialized/upgraded successfully.');
      };
    });
  }

  // --- DIAGNOSES CRUD ---

  public async saveDiagnosis(diagnosis: Diagnosis): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('diagnoses', 'readwrite');
      const store = transaction.objectStore('diagnoses');
      const request = store.put(diagnosis);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save diagnosis locally.'));
    });
  }

  public async getDiagnosis(id: string): Promise<Diagnosis | undefined> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('diagnoses', 'readonly');
      const store = transaction.objectStore('diagnoses');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to load diagnosis: ${id}`));
    });
  }

  public async getAllDiagnoses(): Promise<Diagnosis[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('diagnoses', 'readonly');
      const store = transaction.objectStore('diagnoses');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // Most recent diagnoses first
      const results: Diagnosis[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(new Error('Failed to fetch historical diagnoses.'));
    });
  }

  public async getPendingDiagnoses(): Promise<Diagnosis[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('diagnoses', 'readonly');
      const store = transaction.objectStore('diagnoses');
      const index = store.index('syncStatus');
      const request = index.getAll(IDBKeyRange.only('pending'));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to fetch pending unsynced diagnoses.'));
    });
  }

  public async deleteDiagnosis(id: string): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('diagnoses', 'readwrite');
      const store = transaction.objectStore('diagnoses');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete diagnosis.'));
    });
  }

  public async clearAllDiagnoses(): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('diagnoses', 'readwrite');
      const store = transaction.objectStore('diagnoses');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear diagnosis history.'));
    });
  }

  // --- WEATHER CRUD ---

  public async saveWeather(weather: WeatherData): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('weather', 'readwrite');
      const store = transaction.objectStore('weather');
      const request = store.put(weather);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to cache weather data.'));
    });
  }

  public async getCachedWeather(location: string): Promise<WeatherData | undefined> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('weather', 'readonly');
      const store = transaction.objectStore('weather');
      const request = store.get(location);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to load cached weather data.'));
    });
  }

  // --- USERS CRUD ---

  public async saveUser(user: StoredUser): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('users', 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.put(user);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save user account.'));
    });
  }

  public async getUserByEmail(email: string): Promise<StoredUser | undefined> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('users', 'readonly');
      const store = transaction.objectStore('users');
      const request = store.get(email.toLowerCase());

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to load user account.'));
    });
  }

  public async getAllUsers(): Promise<StoredUser[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('users', 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to list user accounts.'));
    });
  }

  public async deleteUser(email: string): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('users', 'readwrite');
      const store = transaction.objectStore('users');
      const normalized = email.toLowerCase();
      const request =
        email === normalized
          ? store.delete(normalized)
          : store.delete(email);

      request.onsuccess = () => {
        if (email !== normalized) {
          const second = store.delete(normalized);
          second.onsuccess = () => resolve();
          second.onerror = () => resolve();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(new Error('Failed to delete user account.'));
    });
  }

  // --- SETTINGS CRUD ---

  public async saveSetting(key: string, value: any): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('settings', 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to save settings: ${key}`));
    });
  }

  public async getSetting<T>(key: string): Promise<T | undefined> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('settings', 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? (request.result.value as T) : undefined);
      };
      request.onerror = () => reject(new Error(`Failed to read settings: ${key}`));
    });
  }
}

export const dbService = new IndexedDBService();
export default dbService;
