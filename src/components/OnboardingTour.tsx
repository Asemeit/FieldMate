import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';

const STORAGE_KEY = 'fieldmate_onboarding_v1';
const START_EVENT = 'fieldmate-start-tour';

type TourStep = {
  id: string;
  target?: string;
  route?: string;
  titleEn: string;
  titleSw: string;
  bodyEn: string;
  bodySw: string;
};

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    route: '/dashboard',
    titleEn: 'Welcome to FieldMate',
    titleSw: 'Karibu FieldMate',
    bodyEn: 'Your crop health advisor for Uasin Gishu. This quick tour shows you the main features in under a minute.',
    bodySw: 'Mshauri wako wa afya ya mazao katika Uasin Gishu. Safari hii fupi itakuonyesha vipengele muhimu kwa chini ya dakika moja.',
  },
  {
    id: 'diagnose',
    target: 'diagnose',
    titleEn: 'Scan a Leaf',
    titleSw: 'Changanua Jani',
    bodyEn: 'Tap the camera button to photograph a crop leaf. FieldMate identifies diseases and gives treatment advice.',
    bodySw: 'Gusa kitufe cha kamera kupiga picha ya jani. FieldMate hutambua magonjwa na kutoa ushauri wa matibabu.',
  },
  {
    id: 'weather',
    target: 'weather',
    titleEn: 'Farm Weather',
    titleSw: 'Hali ya Hewa ya Shamba',
    bodyEn: 'Check temperature, humidity, and disease risk for Eldoret — updated when you are online.',
    bodySw: 'Angalia joto, unyevu, na hatari ya magonjwa Eldoret — inasasishwa ukiwa mtandaoni.',
  },
  {
    id: 'history',
    target: 'history',
    titleEn: 'Scan History',
    titleSw: 'Historia ya Uchunguzi',
    bodyEn: 'Every diagnosis is saved on your device. Review past scans anytime, even offline.',
    bodySw: 'Kila uchunguzi huhifadhiwa kwenye kifaa chako. Tazama uchunguzi wa zamani wakati wowote, hata bila mtandao.',
  },
  {
    id: 'settings',
    target: 'settings',
    titleEn: 'Settings & Voice',
    titleSw: 'Mipangilio na Sauti',
    bodyEn: 'Switch between English and Kiswahili, adjust voice speed, and update your farmer profile.',
    bodySw: 'Badilisha lugha, rekebisha kasi ya sauti, na sasisha wasifu wako wa mkulima.',
  },
  {
    id: 'voice',
    target: 'voice-play',
    route: '/dashboard',
    titleEn: 'Listen to Advice',
    titleSw: 'Sikiliza Ushauri',
    bodyEn: 'On Home, tap the play button to hear your dashboard summary read aloud — great for farmers who prefer audio.',
    bodySw: 'Kwenye Nyumbani, gusa kitufe cha kucheza kusikiliza muhtasari wa dashibodi — vizuri kwa wakulima wanaopendelea sauti.',
  },
];

type Rect = { top: number; left: number; width: number; height: number };

function getTargetRect(selector: string): Rect | null {
  const el = document.querySelector(`[data-tour="${selector}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export const OnboardingTour: React.FC = () => {
  const { language, user } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isSw = language === 'sw';

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const finish = useCallback(() => {
    setActive(false);
    setStepIndex(0);
    try {
      localStorage.setItem(STORAGE_KEY, 'done');
    } catch {
      /* ignore */
    }
  }, []);

  const start = useCallback(() => {
    setStepIndex(0);
    setActive(true);
    navigate('/dashboard');
  }, [navigate]);

  useEffect(() => {
    const onStart = () => start();
    window.addEventListener(START_EVENT, onStart);
    return () => window.removeEventListener(START_EVENT, onStart);
  }, [start]);

  useEffect(() => {
    if (!user || active) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'done') return;
    } catch {
      return;
    }
    if (location.pathname === '/dashboard') {
      const timer = window.setTimeout(() => setActive(true), 600);
      return () => window.clearTimeout(timer);
    }
  }, [user, location.pathname, active]);

  useEffect(() => {
    if (!active || !step?.route) return;
    if (location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [active, step, location.pathname, navigate]);

  const measureTarget = useCallback(() => {
    if (!active || !step?.target) {
      setTargetRect(null);
      return;
    }
    const rect = getTargetRect(step.target);
    setTargetRect(rect);
  }, [active, step]);

  useLayoutEffect(() => {
    measureTarget();
    const t1 = window.setTimeout(measureTarget, 120);
    const t2 = window.setTimeout(measureTarget, 400);
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [measureTarget, stepIndex, location.pathname]);

  if (!active || !user || !step) return null;

  const pad = 8;
  const highlight = targetRect
    ? {
        top: targetRect.top - pad,
        left: targetRect.left - pad,
        width: targetRect.width + pad * 2,
        height: targetRect.height + pad * 2,
      }
    : null;

  const tooltipStyle: React.CSSProperties = highlight
    ? {
        position: 'fixed',
        left: Math.max(12, Math.min(highlight.left, window.innerWidth - 320 - 12)),
        top: highlight.top + highlight.height + 12 > window.innerHeight - 200
          ? Math.max(12, highlight.top - 180)
          : highlight.top + highlight.height + 12,
        width: Math.min(320, window.innerWidth - 24),
        zIndex: 260,
      }
    : {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: Math.min(340, window.innerWidth - 32),
        zIndex: 260,
      };

  const goNext = () => {
    if (isLast) finish();
    else setStepIndex((i) => i + 1);
  };

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  return (
    <div className="fixed inset-0 z-[250]" role="dialog" aria-modal="true" aria-label={isSw ? 'Mwongozo wa programu' : 'App guide'}>
      {!highlight && <div className="absolute inset-0 bg-black/55" onClick={finish} />}

      {highlight && (
        <div
          className="fixed rounded-2xl ring-4 ring-primary-300 pointer-events-none z-[255]"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
          }}
        />
      )}

      <div
        className="bg-white rounded-3xl shadow-2xl border border-primary-100 p-5 animate-fade-in"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-primary-700">
            <Sparkles size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {isSw ? 'Mwongozo' : 'Quick Guide'} · {stepIndex + 1}/{STEPS.length}
            </span>
          </div>
          <button
            type="button"
            onClick={finish}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            aria-label={isSw ? 'Funga' : 'Close'}
          >
            <X size={16} />
          </button>
        </div>

        <h3 className="text-lg font-extrabold text-primary-800 leading-tight">
          {isSw ? step.titleSw : step.titleEn}
        </h3>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          {isSw ? step.bodySw : step.bodyEn}
        </p>

        <div className="flex items-center justify-between gap-2 mt-5">
          <button
            type="button"
            onClick={finish}
            className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-2 py-2"
          >
            {isSw ? 'Ruka' : 'Skip'}
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700"
              >
                <ChevronLeft size={14} />
                {isSw ? 'Nyuma' : 'Back'}
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-primary-700 text-white text-xs font-bold"
            >
              {isLast ? (isSw ? 'Anza' : 'Get Started') : isSw ? 'Ifuatayo' : 'Next'}
              {!isLast && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function startOnboardingTour(): void {
  window.dispatchEvent(new Event(START_EVENT));
}

export default OnboardingTour;
