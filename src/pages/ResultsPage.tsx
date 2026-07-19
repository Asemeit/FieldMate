import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { dbService } from '../services/db';
import { speechService } from '../services/speech';
import { getDisplayConfidence, repairDiagnosisConfidence } from '../lib/diagnosisUtils';
import { Diagnosis } from '../types';
import { VoicePlayer } from '../components/VoicePlayer';
import { AnalysisModeBadge } from '../components/AnalysisModeBadge';
import { exportDiagnosisPdf } from '../services/pdfExport';
import { 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Clock, 
  FileDown,
} from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, showToast } = useApp();
  
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch individual diagnosis record from IndexedDB
  useEffect(() => {
    const loadDiagnosis = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const record = await dbService.getDiagnosis(id);
        if (record) {
          const fixed = repairDiagnosisConfidence(record);
          if (fixed.confidence !== record.confidence) {
            await dbService.saveDiagnosis(fixed);
          }
          setDiagnosis(fixed);
        }
      } catch (err) {
        console.error('Failed to load crop leaf diagnosis:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDiagnosis();
  }, [id]);

  // Stop speech when leaving results (stable — no dependency on context callbacks)
  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  const handleBackToScanner = () => {
    navigate('/detect');
  };

  const handleBackToHistory = () => {
    navigate('/history');
  };

  const handleExportPdf = async () => {
    if (!diagnosis) return;
    setIsExporting(true);
    try {
      await exportDiagnosisPdf(diagnosis, language);
      showToast(
        language === 'sw' ? 'PDF imepakuliwa kikamilifu' : 'PDF report downloaded successfully',
        'success'
      );
    } catch (err) {
      console.error('PDF export failed:', err);
      showToast(
        language === 'sw' ? 'Imeshindwa kutengeneza PDF' : 'Failed to generate PDF report',
        'error'
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-500 font-bold">Loading diagnosis results...</span>
      </div>
    );
  }

  if (!diagnosis) {
    return (
      <div className="card-premium p-6 text-center flex flex-col items-center gap-4">
        <AlertTriangle size={32} className="text-red-500 animate-bounce" />
        <h4 className="font-extrabold text-sm text-primary-850">Diagnosis Not Found</h4>
        <p className="text-xs text-gray-500 font-semibold max-w-[80%] leading-relaxed">
          The requested disease profile may have been deleted or is not stored in this browser session.
        </p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="btn-primary py-2.5 px-6 text-xs text-white"
        >
          Return to Home Dashboard
        </button>
      </div>
    );
  }

  // Language selectors
  const rec = diagnosis.recommendation;
  const isSw = language === 'sw';
  
  const diseaseName = isSw ? rec.swahili.diseaseName : rec.diseaseName;
  const severityLabel = isSw ? rec.swahili.severity : rec.severity;
  const symptomsList = isSw ? rec.swahili.symptoms : rec.symptoms;
  const causesList = isSw ? rec.swahili.causes : rec.causes;
  const treatmentsList = isSw ? rec.swahili.treatment : rec.treatment;
  const preventionsList = isSw ? rec.swahili.prevention : rec.prevention;
  const analysisMode = diagnosis.analysisMode ?? 'demo';
  const displayConfidence = getDisplayConfidence(diagnosis);

  const confidenceLabel =
    displayConfidence >= 90
      ? isSw
        ? 'Uhakika Mkubwa'
        : 'Very Reliable'
      : displayConfidence >= 70
        ? isSw
          ? 'Uhakika wa Juu'
          : 'High Match'
        : displayConfidence >= 40
          ? isSw
            ? 'Uhakika wa Kati'
            : 'Moderate Match'
          : isSw
            ? 'Uhakika wa Chini'
            : 'Low Match';

  const buildTtsReadout = () => {
    if (isSw) {
      return `Matokeo ya uchunguzi wa mmea. FieldMate imetambua ugonjwa wa ${rec.swahili.diseaseName} kwenye jani lako la ${diagnosis.cropType === 'Maize' ? 'Mahindi' : diagnosis.cropType === 'Potato' ? 'Viazi' : diagnosis.cropType === 'Tomato' ? 'Nyanya' : diagnosis.cropType === 'Wheat' ? 'Ngano' : 'Maharagwe'} kwa asilimia ${displayConfidence} ya uhakika. Kiwango cha hatari ni ${rec.swahili.severity}. Dalili kuu ni pamoja na: ${rec.swahili.symptoms.join('. ')}. Usimamizi na matibabu yaliyopendekezwa: ${rec.swahili.treatment.join('. ')}. Ili kuzuia ugonjwa huu katika msimu ujao: ${rec.swahili.prevention.join('. ')}`;
    }
    return `Crop diagnosis results. FieldMate identified ${rec.diseaseName} in your ${diagnosis.cropType} leaf, with ${displayConfidence} percent confidence. The severity level is ${rec.severity}. Main symptoms include: ${rec.symptoms.join('. ')}. Recommended treatments are: ${rec.treatment.join('. ')}. To prevent this in the future: ${rec.prevention.join('. ')}`;
  };

  return (
    <div className="flex flex-col gap-5 pb-6 animate-fade-in">
      
      {/* Top Back Nav Buttons */}
      <div className="flex items-center justify-between">
        <button 
          onClick={handleBackToScanner}
          className="flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-800 transition-colors uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft size={16} className="stroke-[2.5px]" />
          <span>{isSw ? 'Kagua Upya' : 'Diagnose Other'}</span>
        </button>
        
        <button 
          onClick={handleBackToHistory}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors uppercase tracking-wider cursor-pointer"
        >
          <Clock size={14} />
          <span>{isSw ? 'Kumbukumbu' : 'View History'}</span>
        </button>
      </div>

      {/* Demo vs Live AI badge */}
      <div className="flex flex-col gap-2">
        <AnalysisModeBadge mode={analysisMode} language={language} />
        {analysisMode === 'demo' && (
          <p className="text-[11px] text-amber-800/90 font-medium leading-relaxed bg-amber-50/80 border border-amber-100 rounded-xl px-3 py-2">
            {isSw
              ? 'Hali ya onyesho inatumia hifadhidata ya ndani (Wheat/Beans hazina modeli ya ML bado).'
              : 'Demo mode uses the built-in database (Wheat/Beans are not in the ML model yet).'}
          </p>
        )}
        {analysisMode === 'ml' && (
          <p className="text-[11px] text-violet-800/90 font-medium leading-relaxed bg-violet-50/80 border border-violet-100 rounded-xl px-3 py-2">
            {isSw
              ? 'Modeli ya TensorFlow.js (PlantVillage) ilichambua picha hii ndani ya kifaa chako.'
              : 'TensorFlow.js model trained on PlantVillage analyzed this photo on your device.'}
          </p>
        )}
      </div>

      {/* Main leaf Image Preview with overlay confidence graph */}
      <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border border-primary-100 shadow-premium bg-gray-100">
        <img 
          src={diagnosis.imageUrl} 
          alt="diagnosed crop leaf" 
          className="w-full h-full object-cover" 
        />
        
        {/* Floating Confidence Badge */}
        <div className="absolute bottom-4 left-4 bg-white border border-primary-100 rounded-2xl p-3 shadow-md flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-black text-sm">
            {displayConfidence}%
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block leading-none">AI Confidence</span>
            <span className="text-xs text-primary-800 font-extrabold block mt-0.5 leading-none">
              {confidenceLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Soundwave Voice Advisory Hub */}
      <VoicePlayer textToRead={buildTtsReadout()} />

      <button
        type="button"
        onClick={handleExportPdf}
        disabled={isExporting}
        className="w-full py-3.5 bg-white border-2 border-primary-200 text-primary-800 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary-50 active:scale-[0.98] transition-all disabled:opacity-60"
      >
        <FileDown size={18} />
        <span>
          {isExporting
            ? isSw
              ? 'Inatengeneza PDF...'
              : 'Generating PDF...'
            : isSw
            ? 'Pakua Ripoti ya PDF'
            : 'Download PDF Report'}
        </span>
      </button>

      {/* Disease Primary Metadata Profile Card */}
      <div className="card-premium p-6 shadow-sm border-primary-100">
        <div className="flex items-start justify-between gap-3 border-b border-primary-50/70 pb-4 mb-4">
          <div>
            <span className="text-[10px] bg-primary-100 text-primary-700 px-2.5 py-1 rounded-lg font-bold uppercase tracking-widest leading-none">
              {diagnosis.cropType} Leaf
            </span>
            <h3 className="text-xl font-extrabold text-primary-800 tracking-tight mt-1.5">
              {diseaseName}
            </h3>
          </div>

          {/* Severity tag */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-extrabold uppercase tracking-wide shadow-sm ${
            rec.severity === 'High' 
              ? 'bg-red-50 border-red-200 text-red-700' 
              : rec.severity === 'Medium'
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <ShieldAlert size={14} className={rec.severity === 'High' ? 'text-red-500 animate-pulse' : ''} />
            <span>{severityLabel}</span>
          </div>
        </div>

        {/* Dynamic educational advisory bullet sections */}
        <div className="flex flex-col gap-5 text-left">
          
          {/* Symptoms list */}
          <div>
            <h4 className="font-extrabold text-xs text-primary-800 uppercase tracking-widest mb-2">
              {isSw ? 'Dalili za Ugonjwa' : 'Disease Symptoms'}
            </h4>
            <ul className="flex flex-col gap-2">
              {symptomsList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-gray-600 leading-relaxed font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Causes */}
          <div>
            <h4 className="font-extrabold text-xs text-primary-800 uppercase tracking-widest mb-2 border-t border-primary-50/50 pt-3">
              {isSw ? 'Vyanzo / Sababu' : 'Environmental Causes'}
            </h4>
            <ul className="flex flex-col gap-2">
              {causesList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-gray-600 leading-relaxed font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Treatments */}
          <div className="bg-primary-50/50 border border-primary-100/50 rounded-2xl p-4 mt-1">
            <h4 className="font-extrabold text-xs text-primary-850 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 text-emerald-800">
              <CheckCircle size={16} className="text-primary-600" />
              <span>{isSw ? 'Usimamizi na Matibabu' : 'Immediate Treatment'}</span>
            </h4>
            <ul className="flex flex-col gap-2.5">
              {treatmentsList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs md:text-sm text-gray-700 leading-relaxed font-semibold">
                  <span className="text-primary-600 font-extrabold shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prevention guidelines */}
          <div>
            <h4 className="font-extrabold text-xs text-primary-800 uppercase tracking-widest mb-2 border-t border-primary-50/50 pt-3">
              {isSw ? 'Kinga ya Baadaye' : 'Future Prevention'}
            </h4>
            <ul className="flex flex-col gap-2">
              {preventionsList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-gray-600 leading-relaxed font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
