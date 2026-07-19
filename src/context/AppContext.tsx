import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Diagnosis, CropType, UserSettings } from '../types';
import { dbService } from '../services/db';
import { repairDiagnosisConfidence } from '../lib/diagnosisUtils';
import { speechService } from '../services/speech';
import { syncService } from '../services/sync';
import { authService, MIN_PASSWORD_LENGTH } from '../services/auth';
import { resolveUserRole, isAdminRole, type UserRole } from '../config/admin';

interface AppContextType {
  language: 'en' | 'sw';
  setLanguage: (lang: 'en' | 'sw') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isOnline: boolean;
  isSyncing: boolean;
  syncCount: number;
  user: { name: string; email: string; role: UserRole } | null;
  isAdmin: boolean;
  apiKey: string;
  diagnosesHistory: Diagnosis[];
  speechState: 'playing' | 'paused' | 'stopped';
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  speakText: (text: string) => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  stopSpeaking: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string, newPassword: string) => Promise<boolean>;
  updateProfile: (name: string, county: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>, options?: { silent?: boolean }) => Promise<void>;
  voiceSpeed: number;
  selectedVoiceName: string | null;
}

const SESSION_KEY = 'fieldmate_active_user';

type SessionUser = { name: string; email: string; role: UserRole };

function sessionFromAccount(account: { name: string; email: string; role?: UserRole }): SessionUser {
  return {
    name: account.name,
    email: account.email,
    role: account.role ?? resolveUserRole(account.email),
  };
}

function persistSession(userSession: SessionUser | null) {
  if (userSession) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<'en' | 'sw'>('en');
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncCount, setSyncCount] = useState<number>(0);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [apiKey, setApiKeyState] = useState<string>('');
  const [diagnosesHistory, setDiagnosesHistory] = useState<Diagnosis[]>([]);
  const [speechState, setSpeechState] = useState<'playing' | 'paused' | 'stopped'>('stopped');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [voiceSpeed, setVoiceSpeed] = useState<number>(0.9);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);

  // Trigger transient alerts
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };
  
  const hideToast = () => setToast(null);

  const applyTheme = useCallback((nextTheme: 'light' | 'dark') => {
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    try {
      localStorage.setItem('fieldmate_theme', nextTheme);
    } catch {
      // ignore
    }
  }, []);

  // Speech controllers — stable refs so ResultsPage cleanup does not cancel playback mid-sentence
  const speakText = useCallback((text: string) => {
    speechService.speak(text, language);
  }, [language]);

  const pauseSpeaking = useCallback(() => {
    speechService.pause();
  }, []);

  const resumeSpeaking = useCallback(() => {
    speechService.resume();
  }, []);

  const stopSpeaking = useCallback(() => {
    speechService.stop();
  }, []);

  // Load initial settings, user state, and local history from IndexedDB on startup
  useEffect(() => {
    const loadAppData = async () => {
      try {
        await authService.initializeAuth();

        // Load settings
        const storedLanguage = await dbService.getSetting<'en' | 'sw'>('language');
        if (storedLanguage) setLanguageState(storedLanguage);

        const storedTheme = await dbService.getSetting<'light' | 'dark'>('theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setThemeState(storedTheme);
          applyTheme(storedTheme);
        }

        const storedApiKey = await dbService.getSetting<string>('anthropicApiKey');
        if (storedApiKey) {
          setApiKeyState(storedApiKey);
          syncService.setApiKey(storedApiKey);
        }

        const storedSpeed = await dbService.getSetting<number>('voiceSpeed');
        if (storedSpeed) {
          setVoiceSpeed(storedSpeed);
          speechService.setRate(storedSpeed);
        }

        const storedVoice = await dbService.getSetting<string>('selectedVoiceName');
        // Saved voice names from other sessions often cause silent TTS failure on Windows
        if (storedVoice?.trim()) {
          const voices = speechService.getVoices();
          const exists = voices.some((v) => v.name === storedVoice.trim());
          if (exists) {
            speechService.setVoiceName(storedVoice.trim());
            setSelectedVoiceName(storedVoice.trim());
          } else {
            await dbService.saveSetting('selectedVoiceName', null);
            speechService.setVoiceName(null);
            setSelectedVoiceName(null);
          }
        }

        // Load active user session simulation
        const activeUser = await dbService.getSetting<{ name: string; email: string; role?: UserRole }>('activeUser');
        if (activeUser?.email) {
          const stored = await dbService.getUserByEmail(activeUser.email);
          const session = sessionFromAccount(stored ?? activeUser);
          flushSync(() => setUser(session));
          persistSession(session);
        }

        // Load diagnostic records
        const history = await dbService.getAllDiagnoses();
        const repairedHistory = history.map((item) => {
          const fixed = repairDiagnosisConfidence(item);
          if (fixed.confidence !== item.confidence) {
            dbService.saveDiagnosis(fixed).catch(() => undefined);
          }
          return fixed;
        });
        setDiagnosesHistory(repairedHistory);
      } catch (err) {
        console.error('Error restoring application data from local database:', err);
      }
    };

    loadAppData();
  }, [applyTheme]);

  // Keep document class in sync with theme state
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Speech playback state
  useEffect(() => {
    const handleSpeechState = (state: 'playing' | 'paused' | 'stopped') => {
      setSpeechState(state);
    };
    const handleSpeechError = (message: string) => {
      showToast(message, 'error');
    };
    speechService.addPlayStateListener(handleSpeechState);
    speechService.addErrorListener(handleSpeechError);
    return () => {
      speechService.removePlayStateListener(handleSpeechState);
      speechService.removeErrorListener(handleSpeechError);
    };
  }, []);

  // Prime TTS voices on first user tap (required on Chrome/Windows)
  useEffect(() => {
    const prime = () => speechService.prime();
    window.addEventListener('pointerdown', prime, { once: true, passive: true });
    return () => window.removeEventListener('pointerdown', prime);
  }, []);

  // Clear invalid saved voice once voices are available
  useEffect(() => {
    const validateVoice = () => {
      if (!selectedVoiceName) return;
      const voices = speechService.getVoices();
      if (voices.length > 0 && !voices.some((v) => v.name === selectedVoiceName)) {
        setSelectedVoiceName(null);
        speechService.setVoiceName(null);
        dbService.saveSetting('selectedVoiceName', null).catch(() => undefined);
      }
    };
    validateVoice();
    return speechService.subscribeVoices(validateVoice);
  }, [selectedVoiceName]);

  // Monitor network online/offline transitions
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast(language === 'sw' ? 'Umeunganishwa kwenye mtandao! Inasawazisha...' : 'You are back online! Syncing records...', 'success');
      syncService.triggerSync().then((synced) => {
        if (synced > 0) {
          showToast(
            language === 'sw' 
              ? `Usawazishaji umekamilika! Ripoti ${synced} zimetumwa.` 
              : `Sync complete! ${synced} historical diagnoses processed.`, 
            'success'
          );
          refreshHistory();
        }
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast(language === 'sw' ? 'Hali ya nje ya mtandao iko wazi. Data itahifadhiwa ndani ya kifaa.' : 'Offline mode active. Diagnoses will cache locally.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleSyncStatus = (status: 'syncing' | 'idle', count?: number) => {
      setIsSyncing(status === 'syncing');
      if (count) setSyncCount(count);
    };

    syncService.addSyncListener(handleSyncStatus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      syncService.removeSyncListener(handleSyncStatus);
    };
  }, [language]);

  // Load and refresh diagnostic records
  const refreshHistory = async () => {
    const history = await dbService.getAllDiagnoses();
    const repairedHistory = history.map((item) => {
      const fixed = repairDiagnosisConfidence(item);
      if (fixed.confidence !== item.confidence) {
        dbService.saveDiagnosis(fixed).catch(() => undefined);
      }
      return fixed;
    });
    setDiagnosesHistory(repairedHistory);
  };

  // Language toggling
  const setLanguage = async (lang: 'en' | 'sw') => {
    setLanguageState(lang);
    await dbService.saveSetting('language', lang);
    showToast(lang === 'sw' ? 'Lugha imebadilishwa kuwa Kiswahili' : 'Language switched to English', 'success');
  };

  const setTheme = async (nextTheme: 'light' | 'dark') => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);
    await dbService.saveSetting('theme', nextTheme);
    showToast(
      nextTheme === 'dark'
        ? language === 'sw'
          ? 'Mandhari ya giza imewashwa'
          : 'Dark theme enabled'
        : language === 'sw'
          ? 'Mandhari ya mwanga imewashwa'
          : 'Light theme enabled',
      'success'
    );
  };

  // Auth Operations — validates against IndexedDB users store
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await authService.initializeAuth();
      const account = await authService.loginUser(email, password);
      const userSession = sessionFromAccount(account);
      flushSync(() => setUser(userSession));
      persistSession(userSession);
      await dbService.saveSetting('activeUser', userSession);
      showToast(language === 'sw' ? `Karibu, ${account.name}!` : `Welcome back, ${account.name}!`, 'success');
      return true;
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'WRONG_PASSWORD') {
        showToast(
          language === 'sw'
            ? 'Nenosiri si sahihi. Tumia "Umesahau?" kubadilisha nenosiri.'
            : 'Wrong password. Tap Forgot? on the login page to set a new one.',
          'error'
        );
      } else if (code === 'USER_NOT_FOUND') {
        showToast(
          language === 'sw'
            ? 'Hakuna akaunti kwenye kifaa hiki. Jisajili, au tumia "Umesahau?" kuweka nenosiri.'
            : 'No account on this device. Register, or use Forgot? to set your password.',
          'error'
        );
      } else if (code === 'INVALID_CREDENTIALS') {
        showToast(
          language === 'sw' ? 'Barua pepe au nenosiri si sahihi.' : 'Enter a valid email and password (8+ characters).',
          'error'
        );
      } else {
        showToast(language === 'sw' ? 'Imeshindwa kuingia. Jaribu tena.' : 'Login failed. Please try again.', 'error');
      }
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      await authService.initializeAuth();
      const account = await authService.registerUser(name, email, password);
      const userSession = sessionFromAccount(account);
      flushSync(() => setUser(userSession));
      persistSession(userSession);
      await dbService.saveSetting('activeUser', userSession);
      showToast(language === 'sw' ? 'Akaunti imefunguliwa kikamilifu!' : 'Account registered successfully!', 'success');
      return true;
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'EMAIL_EXISTS') {
        showToast(
          language === 'sw' ? 'Barua pepe tayari imesajiliwa. Ingia badala yake.' : 'This email is already registered. Please log in.',
          'error'
        );
      } else if (code === 'INVALID_INPUT') {
        showToast(
          language === 'sw'
            ? `Jaza taarifa zote. Nenosiri lazima liwe na angalau herufi ${MIN_PASSWORD_LENGTH}.`
            : `Fill all fields. Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
          'error'
        );
      } else {
        showToast(language === 'sw' ? 'Usajili umeshindwa. Jaribu tena.' : 'Registration failed. Please try again.', 'error');
      }
      return false;
    }
  };

  const resetPassword = async (email: string, newPassword: string): Promise<boolean> => {
    try {
      await authService.initializeAuth();
      await authService.resetPassword(email, newPassword);
      showToast(
        language === 'sw' ? 'Nenosiri limebadilishwa. Ingia sasa.' : 'Password updated. You can log in now.',
        'success'
      );
      return true;
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'USER_NOT_FOUND') {
        showToast(
          language === 'sw' ? 'Weka barua pepe sahihi na nenosiri jipya (herufi 8+).' : 'Enter a valid email and new password (8+ characters).',
          'error'
        );
      } else if (code === 'INVALID_INPUT') {
        showToast(
          language === 'sw'
            ? `Nenosiri lazima liwe na angalau herufi ${MIN_PASSWORD_LENGTH}.`
            : `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
          'error'
        );
      } else {
        showToast(language === 'sw' ? 'Imeshindwa kubadilisha nenosiri.' : 'Could not reset password.', 'error');
      }
      return false;
    }
  };

  const logout = async () => {
    flushSync(() => setUser(null));
    persistSession(null);
    await dbService.saveSetting('activeUser', null);
    showToast(language === 'sw' ? 'Umetoka kwenye mfumo.' : 'Logged out successfully.', 'info');
  };

  const updateProfile = async (name: string, county: string): Promise<boolean> => {
    if (!user?.email) return false;
    try {
      const updated = await authService.updateProfile(user.email, { name, county });
      const userSession = sessionFromAccount(updated);
      flushSync(() => setUser(userSession));
      persistSession(userSession);
      await dbService.saveSetting('activeUser', userSession);
      showToast(language === 'sw' ? 'Wasifu umesasishwa' : 'Profile updated successfully', 'success');
      return true;
    } catch {
      showToast(language === 'sw' ? 'Imeshindwa kusasisha wasifu' : 'Could not update profile', 'error');
      return false;
    }
  };

  // Settings updating
  const updateSettings = async (settings: Partial<UserSettings>, options?: { silent?: boolean }) => {
    if (settings.language !== undefined) {
      setLanguageState(settings.language);
      await dbService.saveSetting('language', settings.language);
    }
    if (settings.theme !== undefined) {
      setThemeState(settings.theme);
      applyTheme(settings.theme);
      await dbService.saveSetting('theme', settings.theme);
    }
    if (settings.anthropicApiKey !== undefined) {
      setApiKeyState(settings.anthropicApiKey);
      await dbService.saveSetting('anthropicApiKey', settings.anthropicApiKey);
      syncService.setApiKey(settings.anthropicApiKey);
    }
    if (settings.voiceSpeed !== undefined) {
      setVoiceSpeed(settings.voiceSpeed);
      await dbService.saveSetting('voiceSpeed', settings.voiceSpeed);
      speechService.setRate(settings.voiceSpeed);
    }
    if (settings.selectedVoiceName !== undefined) {
      const voice = settings.selectedVoiceName || null;
      setSelectedVoiceName(voice);
      await dbService.saveSetting('selectedVoiceName', voice);
      speechService.setVoiceName(voice);
    }

    if (!options?.silent) {
      showToast(language === 'sw' ? 'Mipangilio imehifadhiwa' : 'Settings updated successfully', 'success');
    }
  };

  // Clear toast notifications after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        isOnline,
        isSyncing,
        syncCount,
        user,
        isAdmin: isAdminRole(user?.role),
        apiKey,
        diagnosesHistory,
        speechState,
        toast,
        showToast,
        hideToast,
        speakText,
        pauseSpeaking,
        resumeSpeaking,
        stopSpeaking,
        login,
        register,
        resetPassword,
        updateProfile,
        logout,
        refreshHistory,
        updateSettings,
        voiceSpeed,
        selectedVoiceName,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
