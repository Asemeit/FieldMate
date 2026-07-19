export type CropType = 'Maize' | 'Potato' | 'Tomato' | 'Wheat' | 'Beans';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface DiseaseRecommendation {
  diseaseName: string;
  confidence: number;
  severity: RiskLevel;
  symptoms: string[];
  causes: string[];
  treatment: string[];
  prevention: string[];
  swahili: {
    diseaseName: string;
    severity: string;
    symptoms: string[];
    causes: string[];
    treatment: string[];
    prevention: string[];
  };
}

export type AnalysisMode = 'ml' | 'live-ai' | 'demo';

export interface StoredUser {
  email: string;
  name: string;
  passwordHash: string;
  county: string;
  createdAt: number;
  role?: 'farmer' | 'admin';
}

export interface Diagnosis {
  id: string;
  cropType: CropType;
  diseaseName: string;
  confidence: number;
  imageUrl: string; // Base64 or local Object URL
  recommendation: DiseaseRecommendation;
  timestamp: number;
  syncStatus: 'synced' | 'pending';
  analysisMode?: AnalysisMode;
}

export type WeatherDataSource = 'live' | 'cached' | 'offline';

export interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  riskLevel: RiskLevel;
  riskAlerts: string[];
  timestamp: number;
  dataSource?: WeatherDataSource;
}

export interface UserSettings {
  language: 'en' | 'sw'; // English or Swahili
  theme: 'light' | 'dark';
  voiceSpeed: number; // Playback rate (0.5 to 2)
  voicePitch: number;
  offlinePruneDays: number;
  notificationsEnabled: boolean;
  anthropicApiKey?: string;
  selectedVoiceName?: string | null;
}
