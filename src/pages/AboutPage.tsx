import React from 'react';
import { useApp } from '../context/AppContext';
import { PILOT_REGION } from '../config/pilotRegion';
import { Camera, Leaf, Brain, Globe, Shield } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { language } = useApp();
  const isSw = language === 'sw';

  return (
    <div className="flex flex-col gap-4 pb-8">
      <h1 className="text-lg font-extrabold text-primary-800 dark:text-primary-50">
        {isSw ? 'Kuhusu FieldMate' : 'About FieldMate'}
      </h1>

      <div className="card-premium p-5 border-primary-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-700 text-white flex items-center justify-center">
            <Camera size={22} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-primary-800 dark:text-primary-50">FieldMate</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {isSw ? 'Mshauri wa Magonjwa ya Mazao' : 'Crop Disease Advisor'}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {isSw
            ? 'FieldMate ni programu ya wavuti inayosaidia wakulima wadogo kutambua magonjwa ya majani ya mazao kwa kutumia akili bandia na kupata ushauri wa matibabu — hata bila mtandao.'
            : 'FieldMate is an AI-enabled Progressive Web App that helps smallholder farmers identify crop leaf diseases, receive treatment advice, and monitor farm weather — even when offline.'}
        </p>
      </div>

      <div className="card-premium p-5 border-primary-100">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Leaf size={16} className="text-primary-600" />
          {isSw ? 'Eneo la Mradi' : 'Pilot Region'}
        </h3>
        <p className="text-sm font-semibold text-primary-800 dark:text-primary-100">{isSw ? PILOT_REGION.labelSw : PILOT_REGION.labelEn}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
          {isSw ? PILOT_REGION.descriptionSw : PILOT_REGION.descriptionEn}
        </p>
      </div>

      <div className="card-premium p-5 border-primary-100">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Brain size={16} className="text-primary-600" />
          {isSw ? 'Teknolojia' : 'Technology'}
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
          <li>{isSw ? '• Utambuzi wa magonjwa kwa TensorFlow.js (MobileNet)' : '• Disease detection with TensorFlow.js (MobileNet)'}</li>
          <li>{isSw ? '• Hifadhidata ya kifaa (IndexedDB) — data yako haondoki kwenye simu' : '• On-device storage (IndexedDB) — your data stays on this phone'}</li>
          <li>{isSw ? '• Sauti kwa Kiingereza na Kiswahili' : '• Voice guidance in English and Kiswahili'}</li>
          <li>{isSw ? '• Tahadhari za hali ya hewa kwa Eldoret' : '• Weather-based disease risk alerts for Eldoret'}</li>
        </ul>
      </div>

      <div className="card-premium p-5 border-primary-100">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Globe size={16} className="text-primary-600" />
          {isSw ? 'Malengo' : 'Purpose'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {isSw
            ? 'FieldMate inaunga mkono SDG 2 (Njaa Sifuri) kwa kupunguza hasara za mazao kutokana na magonjwa yanayotambuliwa late na kutoa ushauri unaofikiwa kwa wakulima.'
            : 'FieldMate supports SDG 2 (Zero Hunger) by reducing preventable crop losses through early disease detection and accessible advisory services for farmers.'}
        </p>
      </div>

      <div className="card-premium p-5 border-primary-100">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Shield size={16} className="text-primary-600" />
          {isSw ? 'Faragha' : 'Privacy'}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {isSw
            ? 'Akaunti na uchunguzi huhifadhiwa kwenye kivinjari na kifaa hiki pekee. Tumia Chrome kwenye http://localhost:5173 ili data iwe thabiti.'
            : 'Accounts and scans are stored only in this browser on this device. Use Chrome at http://localhost:5173 for consistent data.'}
        </p>
      </div>

      <p className="text-center text-[10px] text-gray-400">© 2026 FieldMate · v1.0 Pilot</p>
    </div>
  );
};

export default AboutPage;
