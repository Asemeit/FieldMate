import React from 'react';
import { useApp } from '../context/AppContext';
import { useSpeechSupport } from '../hooks/useSpeechSupport';

interface SpeechBrowserNoticeProps {
  compact?: boolean;
}

/** Optional hint when voices have not loaded yet — never blocks playback. */
export const SpeechBrowserNotice: React.FC<SpeechBrowserNoticeProps> = ({ compact = false }) => {
  const { language } = useApp();
  const diagnostics = useSpeechSupport();
  const isSw = language === 'sw';

  if (!diagnostics.apiAvailable || diagnostics.voiceCount > 0) return null;

  const hint = isSw ? diagnostics.hintSw : diagnostics.hintEn;
  if (!hint) return null;

  if (compact) {
    return (
      <div className="rounded-xl border border-primary-100 bg-primary-50/80 px-3 py-2 text-[11px] text-primary-800 font-medium leading-relaxed">
        {hint}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary-100 bg-primary-50/80 px-3 py-2 text-[11px] text-primary-800 font-medium leading-relaxed">
      {hint}
    </div>
  );
};

export default SpeechBrowserNotice;
