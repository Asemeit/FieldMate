import React from 'react';
import { useApp } from '../context/AppContext';
import { speechService } from '../services/speech';
import { SpeechBrowserNotice } from './SpeechBrowserNotice';
import { useSpeechSupport } from '../hooks/useSpeechSupport';
import { Play, Pause, Square, Volume2 } from 'lucide-react';

interface VoicePlayerProps {
  textToRead: string;
  className?: string;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({ textToRead, className = '' }) => {
  const { 
    language, 
    speechState, 
    pauseSpeaking, 
    resumeSpeaking, 
    stopSpeaking 
  } = useApp();
  const speechSupport = useSpeechSupport();

  const handlePlayToggle = () => {
    speechService.prime();
    if (speechState === 'stopped') {
      if (!speechSupport.apiAvailable) return;
      speechService.speak(textToRead, language);
    } else if (speechState === 'playing') {
      pauseSpeaking();
    } else if (speechState === 'paused') {
      resumeSpeaking();
    }
  };

  const labelPlay = language === 'sw' ? 'Soma Ushauri' : 'Read Advisory';
  const labelPause = language === 'sw' ? 'Nyamaza kwanza' : 'Pause Voice';
  const labelResume = language === 'sw' ? 'Endelea Kusoma' : 'Resume Voice';
  const labelStop = language === 'sw' ? 'Zima Sauti' : 'Stop Audio';

  return (
    <div className={`card-glass border-primary-200/50 bg-gradient-to-br from-primary-50/90 to-white/90 p-5 ${className}`}>
      {!speechSupport.apiAvailable && (
        <div className="mb-4">
          <SpeechBrowserNotice compact />
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            speechState === 'playing' 
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 animate-pulse-gentle' 
              : 'bg-primary-100 text-primary-700'
          }`}>
            <Volume2 size={24} className={speechState === 'playing' ? 'animate-bounce' : ''} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-primary-800 leading-tight">
              {speechState === 'playing' 
                ? (language === 'sw' ? 'Inasoma ushauri...' : 'Speaking advisory...') 
                : speechState === 'paused'
                ? (language === 'sw' ? 'Sauti imesimamishwa' : 'Voice is paused')
                : (language === 'sw' ? 'Maelezo ya Sauti' : 'Voice Guidance System')
              }
            </h4>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              {language === 'sw' 
                ? 'Gusa kisoma sauti kupata maelekezo' 
                : 'Tap to listen to crop disease steps'
              }
            </p>
          </div>
        </div>

        {/* Dynamic Voice Control Action Hub */}
        <div className="flex items-center gap-2">
          {/* Main Play/Pause/Resume Button */}
          <button
            onClick={handlePlayToggle}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow ${
              speechState === 'playing'
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
            title={speechState === 'playing' ? labelPause : speechState === 'paused' ? labelResume : labelPlay}
            aria-label="Toggle playback"
          >
            {speechState === 'playing' ? <Pause size={20} className="stroke-[2.5px]" /> : <Play size={20} className="fill-current stroke-[2.5px]" />}
          </button>

          {/* Stop Button */}
          {speechState !== 'stopped' && (
            <button
              onClick={stopSpeaking}
              className="w-12 h-12 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-all active:scale-95 shadow-sm border border-red-200/50"
              title={labelStop}
              aria-label="Stop playback"
            >
              <Square size={18} className="fill-current stroke-[2px]" />
            </button>
          )}
        </div>
      </div>

      {/* Visual audio wave equalizer animation when playing */}
      {speechState === 'playing' && (
        <div className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-primary-100/50 h-6">
          <div className="w-1.5 bg-primary-500 rounded-full h-3 animate-[pulse_0.6s_infinite_ease-in-out_delay-100]" style={{ animationDelay: '0.1s' }} />
          <div className="w-1.5 bg-primary-600 rounded-full h-5 animate-[pulse_0.6s_infinite_ease-in-out_delay-200]" style={{ animationDelay: '0.3s' }} />
          <div className="w-1.5 bg-primary-700 rounded-full h-4 animate-[pulse_0.6s_infinite_ease-in-out_delay-300]" style={{ animationDelay: '0.5s' }} />
          <div className="w-1.5 bg-primary-600 rounded-full h-5 animate-[pulse_0.6s_infinite_ease-in-out_delay-400]" style={{ animationDelay: '0.2s' }} />
          <div className="w-1.5 bg-primary-500 rounded-full h-2 animate-[pulse_0.6s_infinite_ease-in-out_delay-500]" style={{ animationDelay: '0.4s' }} />
        </div>
      )}
    </div>
  );
};

export default VoicePlayer;
