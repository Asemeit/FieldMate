import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useCropWeather, formatWeatherAge } from '../hooks/useCropWeather';
import { speechService } from '../services/speech';
import { Diagnosis } from '../types';
import { getDisplayConfidence } from '../lib/diagnosisUtils';
import { PilotRegionBanner } from '../components/PilotRegionBanner';
import { 
  Camera, 
  CloudSun, 
  Sprout, 
  TrendingUp, 
  AlertTriangle, 
  Play,
  ArrowRight,
  ShieldCheck,
  Activity,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, language, diagnosesHistory, speechState, stopSpeaking } = useApp();
  const { weather, isLoading: isLoadingWeather, isRefreshing, refresh } = useCropWeather();

  const weatherSourceLabel =
    weather?.dataSource === 'live'
      ? language === 'sw'
        ? 'Moja kwa moja'
        : 'Live'
      : weather?.dataSource === 'cached'
        ? language === 'sw'
          ? 'Imehifadhiwa'
          : 'Saved'
        : weather?.dataSource === 'offline'
          ? language === 'sw'
            ? 'Nje ya mtandao'
            : 'Offline'
          : null;

  const handleDiagnoseRedirect = () => {
    navigate('/detect');
  };

  // Dynamic language strings
  const greetText = language === 'sw' ? 'Habari' : 'Hello';
  const welcomeSub = language === 'sw' ? 'Karibu kwenye FieldMate! Kagua afya ya mazao yako leo.' : 'Welcome to FieldMate! Inspect the health of your crops today.';
  const quickActionsHeader = language === 'sw' ? 'Njia za Haraka' : 'Quick Actions';
  const weatherHeader = language === 'sw' ? 'Hali ya Hewa — Eldoret' : 'Farm Weather — Eldoret';
  const recentDiagnosesHeader = language === 'sw' ? 'Uchunguzi wa Hivi Karibuni' : 'Recent Diagnoses';
  const viewAllText = language === 'sw' ? 'Tazama Zote' : 'View All';
  const startScanningPrompt = language === 'sw' ? 'Chukua picha ya kwanza ya jani ili kuanza uchunguzi!' : 'Take your first leaf photo to identify diseases!';
  
  const speakDashboardText = () => {
    if (speechState === 'playing') {
      stopSpeaking();
      return;
    }
    
    let speechContent = '';
    if (language === 'sw') {
      speechContent = `Habari ${user?.name || 'Mkulima'}. ${welcomeSub} `;
      if (weather) {
        speechContent += `Hali ya hewa kwa sasa ni nyuzijoto ${Math.round(weather.temperature)} na unyevu wa asilimia ${weather.humidity}. Hatari ya magonjwa ni ya kiwango cha ${weather.riskLevel === 'High' ? 'Juu' : weather.riskLevel === 'Medium' ? 'Kati' : 'Chini'}. `;
        if (weather.riskAlerts.length > 0) {
          speechContent += `Tahadhari: ${weather.riskAlerts[0]}`;
        }
      }
    } else {
      speechContent = `Hello ${user?.name || 'Farmer'}. ${welcomeSub} `;
      if (weather) {
        speechContent += `Your farm temperature is ${Math.round(weather.temperature)} degrees Celsius with ${weather.humidity} percent humidity. The crop disease risk level is currently ${weather.riskLevel}. `;
        if (weather.riskAlerts.length > 0) {
          speechContent += `Alert: ${weather.riskAlerts[0]}`;
        }
      }
    }
    speechService.speak(speechContent, language);
  };

  // Extract recent diagnoses (max 3 items)
  const recentDiagnoses = diagnosesHistory.slice(0, 3);

  return (
    <div className="flex flex-col gap-5 pb-6 animate-fade-in">
      
      {/* Welcome Banner Panel */}
      <div className="card-premium bg-gradient-to-br from-primary-700 to-primary-800 text-white border-none p-6 shadow-premium">
        {/* Decorative Leaf Accent */}
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
          <Sprout size={140} />
        </div>

        <div className="flex items-start justify-between relative z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">
              {greetText}, {user?.name || (language === 'sw' ? 'Mkulima' : 'Farmer')}!
            </h2>
            <p className="text-xs text-primary-100/90 font-medium leading-relaxed max-w-[85%] mt-1">
              {welcomeSub}
            </p>
          </div>
          
          {/* Play/Stop Audio Dashboard Briefing Button */}
          <button 
            data-tour="voice-play"
            onClick={speakDashboardText}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all active:scale-95 cursor-pointer select-none ${
              speechState === 'playing'
                ? 'bg-amber-500 border-amber-400 text-white animate-pulse'
                : 'bg-white/10 border-white/20 hover:bg-white/15 text-white'
            }`}
            title="Read summary out loud"
          >
            <Play size={16} className={speechState === 'playing' ? 'hidden' : 'fill-current stroke-[2.5px]'} />
            {speechState === 'playing' && <span className="font-extrabold text-xs">■</span>}
          </button>
        </div>

        <div className="flex items-center gap-1.5 mt-5 bg-white/10 border border-white/10 rounded-2xl p-2 px-3 text-[10px] sm:text-xs font-bold w-fit relative z-10 leading-none">
          <ShieldCheck size={14} className="text-primary-300" />
          <span>{language === 'sw' ? 'Usawazishaji Nje ya Mtandao: Imewashwa' : 'Offline Database Sync: Active'}</span>
        </div>
      </div>

      <PilotRegionBanner language={language} compact />

      {/* Main Feature Quick Action Buttons */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
          {quickActionsHeader}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Primary Diagnose Target Trigger */}
          <button
            onClick={handleDiagnoseRedirect}
            className="card-premium border-primary-200/60 bg-gradient-to-br from-primary-50/50 to-white p-5 flex flex-col items-start gap-4 transition-all hover:scale-[1.02] cursor-pointer text-left w-full group shadow-sm active:scale-98"
          >
            <div className="w-11 h-11 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-600/20 group-hover:rotate-12 transition-transform duration-300">
              <Camera size={20} className="stroke-[2.5px]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-primary-800 leading-tight">
                {language === 'sw' ? 'Kagua Mmea' : 'Diagnose Plant'}
              </h4>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5 leading-snug">
                {language === 'sw' ? 'Piga picha ya jani kujua ugonjwa' : 'Scan leaf photo with AI advisor'}
              </p>
            </div>
          </button>

          {/* Weather Risks Navigation */}
          <Link
            to="/weather"
            className="card-premium border-primary-200/60 bg-gradient-to-br from-primary-50/50 to-white p-5 flex flex-col items-start gap-4 transition-all hover:scale-[1.02] cursor-pointer text-left group shadow-sm active:scale-98"
          >
            <div className="w-11 h-11 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:rotate-6 transition-transform duration-300">
              <CloudSun size={20} className="stroke-[2.5px]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-primary-800 leading-tight">
                {language === 'sw' ? 'Hali ya Shamba' : 'Weather Risk'}
              </h4>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5 leading-snug">
                {language === 'sw' ? 'Angalia hatari ya magonjwa shambani' : 'Check climate risk forecasts'}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Real-time Weather Summary & Calculated Crop Risks */}
      <div className="card-premium p-5 shadow-sm border-primary-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-primary-800 tracking-tight flex items-center gap-1.5">
            <CloudSun size={18} className="text-primary-600" />
            <span>{weatherHeader}</span>
          </h3>
          <div className="flex items-center gap-2">
            {weatherSourceLabel && (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                  weather?.dataSource === 'live'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {weatherSourceLabel}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="w-7 h-7 rounded-lg border border-primary-100 text-primary-600 flex items-center justify-center hover:bg-primary-50 disabled:opacity-50 cursor-pointer"
              title={language === 'sw' ? 'Onyesha upya' : 'Refresh weather'}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {weather && (
          <p className="text-[10px] text-gray-400 font-medium mb-3">
            {weather.dataSource === 'live'
              ? language === 'sw'
                ? 'Imesasishwa sasa hivi kutoka Open-Meteo'
                : 'Updated just now from Open-Meteo'
              : language === 'sw'
                ? `Imehifadhiwa ${formatWeatherAge(weather.timestamp, language)} — bonyeza ↻ kujaribu tena`
                : `Saved ${formatWeatherAge(weather.timestamp, language)} — tap ↻ to retry`}
          </p>
        )}

        {isLoadingWeather && !weather ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400 font-bold">
              {language === 'sw' ? 'Inapakia hali ya hewa ya Eldoret...' : 'Loading weather for Eldoret...'}
            </span>
          </div>
        ) : weather ? (
          <div className="flex flex-col gap-4">
            
            {/* Met telemetry blocks */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-primary-50/60 rounded-2xl p-3 border border-primary-100/50 text-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Temp</span>
                <span className="text-lg font-extrabold text-primary-800 block mt-1">
                  {Math.round(weather.temperature)}°C
                </span>
              </div>
              <div className="bg-primary-50/60 rounded-2xl p-3 border border-primary-100/50 text-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Humidity</span>
                <span className="text-lg font-extrabold text-primary-800 block mt-1">
                  {weather.humidity}%
                </span>
              </div>
              <div className="bg-primary-50/60 rounded-2xl p-3 border border-primary-100/50 text-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Rainfall</span>
                <span className="text-lg font-extrabold text-primary-800 block mt-1">
                  {weather.rainfall}mm
                </span>
              </div>
            </div>

            {/* Calculated Fungal/Bacterial Disease Outbreak Risk */}
            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
              weather.riskLevel === 'High' 
                ? 'bg-red-50 border-red-200 text-red-950' 
                : weather.riskLevel === 'Medium'
                ? 'bg-amber-50 border-amber-200 text-amber-950'
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}>
              <div className="mt-0.5">
                {weather.riskLevel === 'Low' ? (
                  <ShieldCheck size={20} className="text-emerald-600" />
                ) : (
                  <AlertTriangle size={20} className={weather.riskLevel === 'High' ? 'text-red-600 animate-bounce' : 'text-amber-600'} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs uppercase tracking-wider">
                    {language === 'sw' ? 'Kiwango cha Hatari ya Magonjwa:' : 'Fungal Outbreak Risk:'}
                  </span>
                  <span className="font-black text-xs uppercase underline">
                    {language === 'sw' 
                      ? (weather.riskLevel === 'High' ? 'JUU' : weather.riskLevel === 'Medium' ? 'KATI' : 'CHINI')
                      : weather.riskLevel
                    }
                  </span>
                </div>
                <p className="text-[11px] font-medium leading-relaxed mt-1.5">
                  {weather.riskAlerts[0]}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 font-semibold text-center py-4">
            Failed to load weather report.
          </p>
        )}
      </div>

      {/* Historical Diagnoses Aggregator */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
            <Activity size={16} className="text-primary-600" />
            <span>{recentDiagnosesHeader}</span>
          </h3>
          {diagnosesHistory.length > 3 && (
            <Link 
              to="/history" 
              className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center gap-0.5 tracking-tight group"
            >
              <span>{viewAllText}</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform stroke-[2.5px]" />
            </Link>
          )}
        </div>

        {recentDiagnoses.length === 0 ? (
          /* Empty diagnoses placeholder */
          <div className="card-premium p-6 text-center border-dashed border-2 border-primary-200 bg-white/40 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center animate-pulse">
              <Sprout size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold max-w-[80%] mx-auto leading-relaxed">
                {startScanningPrompt}
              </p>
            </div>
            <button
              onClick={handleDiagnoseRedirect}
              className="px-5 py-2.5 bg-primary-700 hover:bg-primary-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
            >
              {language === 'sw' ? 'Kagua Mmea' : 'Start Diagnosis'}
            </button>
          </div>
        ) : (
          /* Small historical listings */
          <div className="flex flex-col gap-3">
            {recentDiagnoses.map((diag) => (
              <div 
                key={diag.id}
                onClick={() => navigate(`/results/${diag.id}`)}
                className="card-premium border-primary-100 p-3.5 bg-white flex items-center justify-between gap-3 hover:scale-[1.01] transition-transform cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={diag.imageUrl} 
                    alt="crop diagnostic leaf" 
                    className="w-12 h-12 rounded-xl object-cover border border-primary-100/50" 
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-primary-800 leading-tight">
                      {language === 'sw' ? diag.recommendation.swahili.diseaseName : diag.diseaseName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-primary-100 text-primary-700 rounded-md">
                        {diag.cropType}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(diag.timestamp).toLocaleDateString(
                          language === 'sw' ? 'sw-TZ' : 'en-US',
                          { month: 'short', day: 'numeric' }
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="text-right">
                    <span className="text-xs font-black text-primary-600 block">
                      {getDisplayConfidence(diag)}%
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">
                      {language === 'sw' ? 'Uhakika' : 'Confidence'}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 stroke-[2.5px]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
