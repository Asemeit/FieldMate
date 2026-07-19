import React from 'react';
import { AnalysisMode } from '../types';
import { Bot, FlaskConical, Cpu } from 'lucide-react';

interface AnalysisModeBadgeProps {
  mode: AnalysisMode | undefined;
  language: 'en' | 'sw';
  size?: 'sm' | 'md';
}

export const AnalysisModeBadge: React.FC<AnalysisModeBadgeProps> = ({
  mode,
  language,
  size = 'md',
}) => {
  const isSw = language === 'sw';

  const config =
    mode === 'ml'
      ? {
          label: isSw ? 'Uchambuzi wa ML (TensorFlow)' : 'ML Model (TensorFlow.js)',
          hint: isSw
            ? 'Modeli ya TensorFlow ilichambua picha yako ndani ya kifaa'
            : 'TensorFlow.js on-device model analyzed your photo',
          className: 'bg-violet-50 border-violet-200 text-violet-800',
          Icon: Cpu,
        }
      : mode === 'live-ai'
        ? {
            label: isSw ? 'Uchambuzi wa AI wa Moja kwa Moja' : 'Live AI Analysis',
            hint: isSw ? 'Claude Vision ilichambua picha yako' : 'Claude Vision analyzed your photo',
            className: 'bg-emerald-50 border-emerald-200 text-emerald-800',
            Icon: Bot,
          }
        : {
            label: isSw ? 'Hali ya Onyesho (Demo)' : 'Demo Mode',
            hint: isSw ? 'Ushauri kutoka kwa hifadhidata ya ndani' : 'Advisory from built-in crop disease database',
            className: 'bg-amber-50 border-amber-200 text-amber-900',
            Icon: FlaskConical,
          };

  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs';
  const Icon = config.Icon;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border font-bold uppercase tracking-wide ${sizeClasses} ${config.className}`}
      title={config.hint}
    >
      <Icon size={size === 'sm' ? 12 : 14} />
      <span>{config.label}</span>
    </div>
  );
};

export default AnalysisModeBadge;
