import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { speechService } from '../services/speech';
import { useCropWeather, formatWeatherAge } from '../hooks/useCropWeather';
import { PilotRegionBanner } from '../components/PilotRegionBanner';
import { 
  CloudSun, 
  Thermometer, 
  Droplets, 
  CloudRain, 
  Wind, 
  AlertTriangle, 
  ShieldCheck, 
  Play,
  RefreshCw
} from 'lucide-react';

export const WeatherPage: React.FC = () => {
  const { language, speechState, stopSpeaking } = useApp();
  const { weather, isLoading, isRefreshing, refresh } = useCropWeather();

  useEffect(() => {
    return () => speechService.stop();
  }, []);

  const speakWeatherForecast = () => {
    if (!weather) return;
    if (speechState === 'playing') {
      stopSpeaking();
      return;
    }

    let report = '';
    if (language === 'sw') {
      report = `Uchambuzi wa hali ya hewa katika eneo la ${weather.location}. Joto ni nyuzijoto ${Math.round(weather.temperature)}. Unyevu wa hewa ni asilimia ${weather.humidity}. Kasi ya upepo ni kilomita ${weather.windSpeed} kwa saa, na kiwango cha mvua ni milimita ${weather.rainfall}. Tahadhari za kilimo: ${weather.riskAlerts.join('. ')}`;
    } else {
      report = `Weather analysis for ${weather.location}. Temperature is ${Math.round(weather.temperature)} degrees Celsius. Relative humidity is ${weather.humidity} percent. Wind speed is ${weather.windSpeed} kilometers per hour, with ${weather.rainfall} millimeters of rainfall. Crop safety advisories are: ${weather.riskAlerts.join('. ')}`;
    }
    speechService.speak(report, language);
  };

  const isSw = language === 'sw';
  const pageTitle = isSw ? 'Hali ya Hewa' : 'Weather';
  const subTitle = isSw
    ? 'Eldoret, Uasin Gishu — hatari ya magonjwa kwa mazao'
    : 'Eldoret, Uasin Gishu — crop disease risk from climate';
  const tempLabel = isSw ? 'Joto' : 'Temperature';
  const humidityLabel = isSw ? 'Unyevu' : 'Humidity';
  const rainLabel = isSw ? 'Mvua' : 'Rainfall';
  const windLabel = isSw ? 'Upepo' : 'Wind';
  const advisorHeader = isSw ? 'Tahadhari Shambani' : 'Field Advisories';
  const riskTitle = isSw ? 'Hatari ya Kuvu:' : 'Fungal Risk:';
  const weatherSourceLabel =
    weather?.dataSource === 'live'
      ? isSw ? 'Moja kwa moja' : 'Live'
      : weather?.dataSource === 'cached'
        ? isSw ? 'Imehifadhiwa' : 'Saved'
        : weather?.dataSource === 'offline'
          ? isSw ? 'Makadirio' : 'Estimate'
          : null;

  return (
    <div className="flex flex-col gap-5 pb-6 animate-fade-in">
      
      <div className="flex items-start justify-between border-b border-primary-100 pb-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold text-primary-800 tracking-tight">
            {pageTitle}
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {subTitle}
          </p>
          {weather && (
            <p className="text-[10px] text-gray-400 mt-1">
              {weather.dataSource === 'live'
                ? isSw ? 'Imesasishwa sasa hivi' : 'Updated just now'
                : isSw
                  ? `Imehifadhiwa ${formatWeatherAge(weather.timestamp, language)}`
                  : `Saved ${formatWeatherAge(weather.timestamp, language)}`}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
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
            className="w-9 h-9 rounded-xl border border-primary-100 text-primary-600 flex items-center justify-center hover:bg-primary-50 disabled:opacity-50 cursor-pointer"
            title={isSw ? 'Onyesha upya' : 'Refresh'}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          {weather && (
            <button 
              onClick={speakWeatherForecast}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
                speechState === 'playing'
                  ? 'bg-amber-500 border-amber-400 text-white animate-pulse'
                  : 'bg-primary-50 border-primary-100 text-primary-700 hover:bg-primary-100/60'
              }`}
              title="Read forecast aloud"
            >
              <Play size={16} className={speechState === 'playing' ? 'hidden' : 'fill-current stroke-[2.5px]'} />
              {speechState === 'playing' && <span className="font-extrabold text-xs">■</span>}
            </button>
          )}
        </div>
      </div>

      <PilotRegionBanner language={language} compact />

      {isLoading && !weather ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-9 h-9 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-bold">
            {isSw ? 'Inapakia hali ya hewa...' : 'Loading weather...'}
          </span>
        </div>
      ) : weather ? (
        <div className="flex flex-col gap-5">
          
          <div className="grid grid-cols-2 gap-4">
            
            <div className="card-premium p-5 shadow-sm border-primary-100 bg-white flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                <Thermometer size={20} className="stroke-[2.5px]" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block leading-none">{tempLabel}</span>
                <span className="text-xl font-black text-primary-850 block mt-2 leading-none">
                  {weather.temperature}°C
                </span>
              </div>
            </div>

            <div className="card-premium p-5 shadow-sm border-primary-100 bg-white flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Droplets size={20} className="stroke-[2.5px]" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block leading-none">{humidityLabel}</span>
                <span className="text-xl font-black text-primary-850 block mt-2 leading-none">
                  {weather.humidity}%
                </span>
              </div>
            </div>

            <div className="card-premium p-5 shadow-sm border-primary-100 bg-white flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                <CloudRain size={20} className="stroke-[2.5px]" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block leading-none">{rainLabel}</span>
                <span className="text-xl font-black text-primary-850 block mt-2 leading-none">
                  {weather.rainfall} mm
                </span>
              </div>
            </div>

            <div className="card-premium p-5 shadow-sm border-primary-100 bg-white flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                <Wind size={20} className="stroke-[2.5px]" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block leading-none">{windLabel}</span>
                <span className="text-xl font-black text-primary-850 block mt-2 leading-none">
                  {weather.windSpeed} km/h
                </span>
              </div>
            </div>
          </div>

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
                <AlertTriangle size={20} className={weather.riskLevel === 'High' ? 'text-red-600' : 'text-amber-600'} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs uppercase tracking-wider">{riskTitle}</span>
                <span className="font-black text-xs uppercase underline">{weather.riskLevel}</span>
              </div>
              <p className="text-[11px] font-medium leading-relaxed mt-1.5">
                {weather.riskAlerts[0]}
              </p>
            </div>
          </div>

          {weather.riskAlerts.length > 1 && (
            <div className="card-premium p-4 shadow-sm border-primary-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CloudSun size={16} className="text-primary-600" />
                <span>{advisorHeader}</span>
              </h3>
              <ul className="flex flex-col gap-2">
                {weather.riskAlerts.slice(1).map((alert, idx) => (
                  <li key={idx} className="text-[11px] text-gray-600 font-medium leading-relaxed flex gap-2">
                    <span className="text-primary-400 font-bold">•</span>
                    {alert}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400 font-semibold text-center py-8">
          {isSw ? 'Imeshindwa kupakia hali ya hewa.' : 'Could not load weather.'}
        </p>
      )}
    </div>
  );
};

export default WeatherPage;
