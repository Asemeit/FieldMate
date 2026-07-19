import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Camera, ChevronRight, CheckCircle2, Award, Zap, Download } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const headingText = language === 'sw' ? 'Msaidizi Wako wa Kilimo na Magonjwa ya Mazao' : 'Your Professional Crop Disease Advisory Companion';
  const subheadingText = language === 'sw' ? 'Tambua magonjwa ya mimea haraka, pata ushauri wa wataalamu hata bila mtandao.' : 'Identify plant diseases instantly and access expert agricultural guides, fully functional even when offline.';
  const startButtonText = language === 'sw' ? 'Anza Sasa' : 'Get Started';
  const installButtonText = language === 'sw' ? 'Sakinisha FieldMate' : 'Install FieldMate PWA';

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-primary-800 via-primary-900 to-emerald-950 text-white relative min-h-full">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary-400/20 rounded-full" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-primary-300/15 rounded-full" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-between px-4 pt-16 pb-4">
        <div className="my-auto py-6 flex flex-col items-center text-center w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 rounded-full border border-white/20 text-[11px] font-bold tracking-wider uppercase mb-6">
            <Award size={12} className="text-primary-300" />
            <span>{language === 'sw' ? 'Kichujio cha Sauti' : 'Web Speech & Offline Enabled'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-white mb-4">
            {headingText}
          </h1>

          <p className="text-sm text-primary-100/90 leading-relaxed max-w-sm mb-8">
            {subheadingText}
          </p>

          <div className="relative z-20 w-full flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-primary-400 hover:bg-primary-300 active:bg-primary-500 text-primary-950 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all select-none text-base cursor-pointer"
            >
              <span>{startButtonText}</span>
              <ChevronRight size={18} className="stroke-[2.5px]" />
            </button>

            {isInstallable && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-4 bg-white/15 hover:bg-white/20 border border-white/25 text-white font-semibold rounded-2xl flex items-center justify-center gap-2.5 transition-all select-none text-base cursor-pointer"
              >
                <Download size={18} className="stroke-[2.5px]" />
                <span>{installButtonText}</span>
              </button>
            )}
          </div>
        </div>

        <div className="w-full grid grid-cols-3 gap-3 bg-white/10 border border-white/15 rounded-3xl p-4 mb-3">
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-primary-400/25 text-primary-300 flex items-center justify-center mb-2">
              <Camera size={18} />
            </div>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">
              {language === 'sw' ? 'Changanua' : 'Scan Leaf'}
            </span>
          </div>
          <div className="flex flex-col items-center text-center border-x border-white/15">
            <div className="w-10 h-10 rounded-xl bg-primary-400/25 text-primary-300 flex items-center justify-center mb-2">
              <Zap size={18} />
            </div>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">
              {language === 'sw' ? 'Bila Mtandao' : '100% Offline'}
            </span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-primary-400/25 text-primary-300 flex items-center justify-center mb-2">
              <CheckCircle2 size={18} />
            </div>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">
              {language === 'sw' ? 'Sauti Mbili' : 'Voice Guides'}
            </span>
          </div>
        </div>

        <footer className="w-full text-center py-2 text-[10px] text-primary-200/70 font-medium flex flex-col gap-2">
          <div className="flex items-center justify-center gap-4">
            <Link to="/about" className="hover:text-white underline-offset-2 hover:underline">
              {language === 'sw' ? 'Kuhusu' : 'About'}
            </Link>
            <span className="text-primary-300/40">·</span>
            <Link to="/support" className="hover:text-white underline-offset-2 hover:underline">
              {language === 'sw' ? 'Msaada' : 'Support'}
            </Link>
          </div>
          <span>© 2026 FieldMate Agriculture advisory platform.</span>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
