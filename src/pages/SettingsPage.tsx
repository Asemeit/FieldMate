import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { speechService } from '../services/speech';
import { dbService } from '../services/db';
import { startOnboardingTour } from '../components/OnboardingTour';
import { PilotRegionBanner } from '../components/PilotRegionBanner';
import { SpeechBrowserNotice } from '../components/SpeechBrowserNotice';
import { BrowserStorageNotice } from '../components/BrowserStorageNotice';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Volume2, 
  Trash2,
  Play,
  Database,
  User,
  BookOpen,
  Sparkles,
  Info,
  LifeBuoy,
  Sun,
  Moon,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const { 
    language, 
    setLanguage,
    theme,
    setTheme,
    user,
    isAdmin,
    updateProfile,
    updateSettings, 
    refreshHistory,
    showToast,
    voiceSpeed,
    selectedVoiceName,
    speechState,
    stopSpeaking
  } = useApp();

  const isSw = language === 'sw';

  const [speed, setSpeed] = useState(voiceSpeed);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [chosenVoice, setChosenVoice] = useState<string>(selectedVoiceName || '');
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileCounty, setProfileCounty] = useState('Uasin Gishu');

  useEffect(() => {
    if (user?.name) setProfileName(user.name);
  }, [user?.name]);

  useEffect(() => {
    if (user?.email) {
      dbService.getUserByEmail(user.email).then((account) => {
        if (account?.county) setProfileCounty(account.county);
      });
    }
  }, [user?.email]);

  useEffect(() => {
    if (selectedVoiceName) setChosenVoice(selectedVoiceName);
  }, [selectedVoiceName]);

  useEffect(() => {
    const loadSystemVoices = () => {
      setVoices(speechService.getVoices());
    };
    loadSystemVoices();
    return speechService.subscribeVoices(loadSystemVoices);
  }, []);

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSpeed(value);
    updateSettings({ voiceSpeed: value }, { silent: true });
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setChosenVoice(value);
    updateSettings({ selectedVoiceName: value || null }, { silent: true });
  };

  const handleTestVoice = () => {
    if (speechState === 'playing') {
      stopSpeaking();
      return;
    }
    speechService.setVoiceName(null);
    speechService.prime();
    const testText = language === 'sw' ? 'Habari. Sauti inafanya kazi.' : 'Hello. Voice is working.';
    speechService.speak(testText, language);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(profileName, profileCounty);
  };

  const handleClearHistory = async () => {
    const confirmClear = window.confirm(
      language === 'sw'
        ? 'Futa kumbukumbu zote za uchunguzi?'
        : 'Delete all scan history on this device?'
    );

    if (confirmClear) {
      try {
        await dbService.clearAllDiagnoses();
        await refreshHistory();
        showToast(
          language === 'sw' ? 'Kumbukumbu zimefutwa' : 'History cleared',
          'success'
        );
      } catch (err) {
        console.error('Failed to clear IndexedDB diagnoses:', err);
      }
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-6 min-h-full animate-fade-in">
      <div className="flex items-center gap-2.5 border-b border-primary-100 pb-3">
        <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
          <SettingsIcon size={20} className="stroke-[2px]" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-primary-800 tracking-tight">
            {isSw ? 'Mipangilio' : 'Settings'}
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {isSw ? 'Lugha, sauti, na wasifu wako' : 'Language, voice, and your profile'}
          </p>
        </div>
      </div>

      <PilotRegionBanner language={language} compact />

      <BrowserStorageNotice />

      {isAdmin && (
        <Link
          to="/admin"
          className="card-premium p-5 border-primary-200 dark:border-primary-600 bg-gradient-to-r from-primary-50 to-emerald-50 dark:from-primary-900 dark:to-primary-800 flex items-center justify-between gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-primary-700 text-white flex items-center justify-center shrink-0">
              <Shield size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-primary-800 dark:text-primary-50">
                {isSw ? 'Paneli ya Msimamizi' : 'Administrator Panel'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                {isSw ? 'Akaunti, usajili, na hifadhi ya data' : 'Accounts, enrolment, and data backup'}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-primary-600 shrink-0" />
        </Link>
      )}

      {user && (
        <div className="card-premium p-5 shadow-sm border-primary-100">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <User size={16} className="text-primary-600" />
            <span>{isSw ? 'Wasifu Wangu' : 'My Profile'}</span>
          </h3>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
                {isSw ? 'Jina' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
                {isSw ? 'Kaunti' : 'County'}
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={60}
                value={profileCounty}
                onChange={(e) => setProfileCounty(e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold"
              />
            </div>
            <p className="text-[10px] text-gray-400">{user.email}</p>
            <button type="submit" className="btn-primary py-3 w-full text-xs font-bold rounded-xl cursor-pointer">
              {isSw ? 'Sasisha Wasifu' : 'Update Profile'}
            </button>
          </form>
        </div>
      )}

      <div className="card-premium p-5 shadow-sm border-primary-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Globe size={16} className="text-primary-600" />
          <span>{isSw ? 'Lugha ya Mfumo' : 'System Language'}</span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLanguage('en')}
            className={`py-3.5 px-4 rounded-2xl border text-sm font-semibold transition-all active:scale-95 cursor-pointer ${
              language === 'en'
                ? 'bg-primary-700 border-primary-700 text-white shadow'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-primary-50/20'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('sw')}
            className={`py-3.5 px-4 rounded-2xl border text-sm font-semibold transition-all active:scale-95 cursor-pointer ${
              language === 'sw'
                ? 'bg-primary-700 border-primary-700 text-white shadow'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-primary-50/20'
            }`}
          >
            Kiswahili
          </button>
        </div>
      </div>

      <div className="card-premium p-5 shadow-sm border-primary-100">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Sun size={16} className="text-primary-600" />
          <span>{isSw ? 'Mandhari' : 'Appearance'}</span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`py-3.5 px-4 rounded-2xl border text-sm font-semibold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
              theme === 'light'
                ? 'bg-primary-700 border-primary-700 text-white shadow'
                : 'bg-white dark:bg-primary-900 border-gray-200 dark:border-primary-600 text-gray-700 dark:text-gray-200 hover:bg-primary-50/20 dark:hover:bg-primary-800'
            }`}
          >
            <Sun size={16} />
            {isSw ? 'Mwanga' : 'Light'}
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`py-3.5 px-4 rounded-2xl border text-sm font-semibold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
              theme === 'dark'
                ? 'bg-primary-700 border-primary-700 text-white shadow'
                : 'bg-white dark:bg-primary-900 border-gray-200 dark:border-primary-600 text-gray-700 dark:text-gray-200 hover:bg-primary-50/20 dark:hover:bg-primary-800'
            }`}
          >
            <Moon size={16} />
            {isSw ? 'Giza' : 'Dark'}
          </button>
        </div>
      </div>

      <div className="card-premium p-5 shadow-sm border-primary-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Volume2 size={16} className="text-primary-600" />
          <span>{isSw ? 'Mipangilio ya Sauti' : 'Voice Guidance'}</span>
        </h3>

        <div className="flex flex-col gap-4">
          <SpeechBrowserNotice />

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
              {isSw ? 'Aina ya Sauti' : 'Voice'}
            </label>
            <select
              value={chosenVoice}
              onChange={handleVoiceChange}
              className="w-full px-3 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold"
            >
              {voices.length === 0 ? (
                <option value="">{isSw ? 'Gusa Jaribu Sauti kupakia sauti' : 'Tap Test Audio to load voices'}</option>
              ) : (
                <>
                  <option value="">{isSw ? 'Chagua kiotomatiki (Inapendekezwa)' : 'Auto (Recommended)'}</option>
                  {voices.map((v) => (
                    <option key={`${v.name}-${v.lang}`} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </>
              )}
            </select>
            <p className="text-[10px] text-gray-400 font-medium">
              {isSw
                ? 'Tumia Chrome au Edge kwenye localhost:5173. Ikiwa Chrome haitamki, programu itatumia sauti ya mtandaoni.'
                : 'Use Chrome or Edge at localhost:5173. If Chrome speech is broken, online voice is used automatically.'}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                {isSw ? 'Kasi ya Kusoma' : 'Reading Speed'}
              </label>
              <span className="text-xs font-extrabold text-primary-700">{speed}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={handleSpeedChange}
              className="w-full accent-primary-600"
            />
          </div>

          <button
            type="button"
            onClick={handleTestVoice}
            className={`w-full py-3.5 border-2 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs active:scale-95 transition-all cursor-pointer ${
              speechState === 'playing'
                ? 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
                : 'bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100/50'
            }`}
          >
            <Play size={14} className={speechState === 'playing' ? 'hidden' : 'fill-current'} />
            {speechState === 'playing' && <span className="font-extrabold text-[10px]">■</span>}
            <span>{isSw ? 'Jaribu Sauti' : 'Test Audio Playback'}</span>
          </button>
        </div>
      </div>

      <div className="card-premium p-5 shadow-sm border-primary-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <BookOpen size={16} className="text-primary-600" />
          <span>{isSw ? 'Mwongozo wa Programu' : 'App Guide'}</span>
        </h3>
        <p className="text-[11px] text-gray-500 font-medium mb-4 leading-relaxed">
          {isSw
            ? 'Jifunze jinsi ya kutumia FieldMate — uchunguzi, hali ya hewa, historia, na sauti.'
            : 'Learn how to use FieldMate — scanning, weather, history, and voice guidance.'}
        </p>
        <button
          type="button"
          onClick={startOnboardingTour}
          className="w-full py-3.5 bg-primary-50 hover:bg-primary-100 text-primary-800 border border-primary-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-colors cursor-pointer"
        >
          <Sparkles size={14} />
          <span>{isSw ? 'Anza Mwongozo wa Haraka' : 'Take Quick App Tour'}</span>
        </button>
      </div>

      <div className="card-premium p-5 shadow-sm border-primary-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Info size={16} className="text-primary-600" />
          <span>{isSw ? 'Kuhusu na Msaada' : 'About & Support'}</span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/about"
            className="py-3.5 px-3 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-2xl text-xs font-bold text-primary-800 flex flex-col items-center gap-2 active:scale-95 transition-colors"
          >
            <Info size={18} />
            <span>{isSw ? 'Kuhusu FieldMate' : 'About FieldMate'}</span>
          </Link>
          <Link
            to="/support"
            className="py-3.5 px-3 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-2xl text-xs font-bold text-primary-800 flex flex-col items-center gap-2 active:scale-95 transition-colors"
          >
            <LifeBuoy size={18} />
            <span>{isSw ? 'Msaada' : 'Contact Support'}</span>
          </Link>
        </div>
      </div>

      <div className="card-premium p-5 shadow-sm border-primary-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Database size={16} className="text-primary-600" />
          <span>{isSw ? 'Data Yako' : 'Your Data'}</span>
        </h3>

        <p className="text-[11px] text-gray-500 font-medium mb-4 leading-relaxed">
          {isSw
            ? 'Uchunguzi wako huhifadhiwa kwenye kifaa hiki. Unaweza kufuta historia wakati wowote.'
            : 'Your scans are saved on this device. You can clear history at any time.'}
        </p>

        <button
          onClick={handleClearHistory}
          className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-colors cursor-pointer"
        >
          <Trash2 size={14} />
          <span>{isSw ? 'Futa Historia ya Uchunguzi' : 'Clear Scan History'}</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
