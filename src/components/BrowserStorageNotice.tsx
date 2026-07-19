import React from 'react';
import { useApp } from '../context/AppContext';
import { isRecommendedBrowser, storageBrowserLabel } from '../services/dataBackup';
import { AlertTriangle, Globe } from 'lucide-react';

export const BrowserStorageNotice: React.FC = () => {
  const { language } = useApp();
  const isSw = language === 'sw';
  const ok = isRecommendedBrowser();

  if (ok) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="text-xs text-amber-950 leading-relaxed">
        <p className="font-bold mb-1">
          {isSw ? 'Hifadhidata tofauti' : 'Separate storage detected'}
        </p>
        <p>
          {isSw
            ? `Unatumia ${storageBrowserLabel()}. Data hii HAISHIRIKI na Chrome. Kwa mradi mmoja, tumia Chrome pekee: http://localhost:5173`
            : `You are using ${storageBrowserLabel()}. This data does NOT sync with Chrome. For one unified database, use Chrome only at http://localhost:5173`}
        </p>
        <p className="mt-2 flex items-center gap-1 font-semibold text-amber-800">
          <Globe size={14} />
          {isSw ? 'Usifungue programu ndani ya VS Code Preview.' : 'Do not open the app inside VS Code Preview.'}
        </p>
      </div>
    </div>
  );
};

export default BrowserStorageNotice;
