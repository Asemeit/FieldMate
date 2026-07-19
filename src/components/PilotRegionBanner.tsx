import React from 'react';
import { MapPin } from 'lucide-react';
import { PILOT_REGION } from '../config/pilotRegion';

interface PilotRegionBannerProps {
  language: 'en' | 'sw';
  compact?: boolean;
}

export const PilotRegionBanner: React.FC<PilotRegionBannerProps> = ({ language, compact = false }) => {
  const isSw = language === 'sw';

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0">
        <MapPin size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600">
          {isSw ? 'Eneo la Mradi' : 'Pilot Region'}
        </p>
        <p className="text-sm font-extrabold text-primary-800 leading-tight mt-0.5">
          {isSw ? PILOT_REGION.labelSw : PILOT_REGION.labelEn}
        </p>
        {!compact && (
          <p className="text-[11px] text-gray-600 font-medium leading-relaxed mt-1">
            {isSw ? PILOT_REGION.descriptionSw : PILOT_REGION.descriptionEn}
          </p>
        )}
      </div>
    </div>
  );
};

export default PilotRegionBanner;
