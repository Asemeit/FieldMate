import React from 'react';

interface LeafGuideOverlayProps {
  language: 'en' | 'sw';
  compact?: boolean;
}

/** Dashed leaf-shaped guide to help farmers center crop photos */
export const LeafGuideOverlay: React.FC<LeafGuideOverlayProps> = ({ language, compact = false }) => {
  const isSw = language === 'sw';
  const hint = isSw ? 'Weka jani ndani ya muundo huu' : 'Center the leaf inside this guide';

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-10">
      <svg
        viewBox="0 0 200 280"
        className={compact ? 'w-32 h-44 opacity-90' : 'w-44 h-60 sm:w-52 sm:h-72 opacity-90'}
        aria-hidden="true"
      >
        <path
          d="M100 20 C40 60 20 130 35 200 C50 250 75 265 100 270 C125 265 150 250 165 200 C180 130 160 60 100 20 Z"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeDasharray="10 8"
          className="drop-shadow-[0_0_6px_rgba(0,0,0,0.5)]"
        />
        <line
          x1="100"
          y1="20"
          x2="100"
          y2="265"
          stroke="white"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          opacity="0.7"
        />
      </svg>
      <p
        className={`mt-2 text-center font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] ${
          compact ? 'text-[9px] px-2' : 'text-[10px] px-4'
        }`}
      >
        {hint}
      </p>
    </div>
  );
};

export default LeafGuideOverlay;
