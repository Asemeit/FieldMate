import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { claudeVisionService } from '../services/claude';
import { speechService } from '../services/speech';
import { CropType } from '../types';
import { LeafGuideOverlay } from '../components/LeafGuideOverlay';
import { AnalysisModeBadge } from '../components/AnalysisModeBadge';
import { 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  ArrowRight,
  Sprout,
  Check
} from 'lucide-react';

const CROP_OPTIONS: { type: CropType; labelEn: string; labelSw: string; icon: string }[] = [
  { type: 'Maize', labelEn: 'Maize (Corn)', labelSw: 'Mahindi', icon: '🌽' },
  { type: 'Potato', labelEn: 'Potato', labelSw: 'Viazi Mviringo', icon: '🥔' },
  { type: 'Tomato', labelEn: 'Tomato', labelSw: 'Nyanya', icon: '🍅' },
  { type: 'Wheat', labelEn: 'Wheat', labelSw: 'Ngano', icon: '🌾' },
  { type: 'Beans', labelEn: 'Beans', labelSw: 'Maharagwe', icon: '🌱' },
];

export const DetectPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, apiKey, refreshHistory, stopSpeaking } = useApp();
  
  const [selectedCrop, setSelectedCrop] = useState<CropType | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleStartAnalysis = async () => {
    if (!imageSrc || !selectedCrop) return;

    setIsAnalyzing(true);
    speakAnalysisStatus();

    try {
      // Analyze leaf utilizing either live Claude API or offline high-fidelity simulator
      const diagnosis = await claudeVisionService.analyzeLeafImage(
        imageSrc,
        selectedCrop,
        apiKey
      );

      // Refresh global context history log
      await refreshHistory();
      
      // Stop scanning speech and navigate to Results Page
      stopSpeaking();
      navigate(`/results/${diagnosis.id}`);
    } catch (err) {
      console.error('Failed to run crop leaf analysis:', err);
      setIsAnalyzing(false);
    }
  };

  const speakAnalysisStatus = () => {
    const speech = language === 'sw'
      ? `Inachanganua afya ya jani la ${selectedCrop === 'Maize' ? 'Mahindi' : selectedCrop === 'Potato' ? 'Viazi' : selectedCrop === 'Tomato' ? 'Nyanya' : selectedCrop === 'Wheat' ? 'Ngano' : 'Maharagwe'}. Tafadhali subiri kidogo wakati tunakusanya maelezo.`
      : `Analyzing the health of your ${selectedCrop} leaf. Please wait a moment while we process the diagnostic report.`;
    speechService.speak(speech, language);
  };

  const pageTitle = language === 'sw' ? 'Kagua Ugonjwa' : 'Disease Scanner';
  const selectCropLabel = language === 'sw' ? '1. Chagua Aina ya Mmea' : '1. Select Crop Type';
  const uploadPhotoLabel = language === 'sw' ? '2. Piga au Pakia Picha ya Jani' : '2. Take or Upload Leaf Photo';
  const analyzeBtnText = language === 'sw' ? 'Changanua Afya ya Mmea' : 'Analyze Crop Health';
  const scanningText = language === 'sw' ? 'Inatafuta magonjwa...' : 'Scanning for diseases...';

  return (
    <div className="flex flex-col gap-5 pb-6 animate-fade-in">
      
      {/* Page Title & Voice Assist Trigger */}
      <div className="flex items-center justify-between border-b border-primary-100 pb-3">
        <div>
          <h2 className="text-xl font-extrabold text-primary-800 tracking-tight">
            {pageTitle}
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">
            {language === 'sw' ? 'Tambua magonjwa kwa sekunde chache' : 'Identify disease issues in seconds'}
          </p>
        </div>
        <AnalysisModeBadge mode="ml" language={language} size="sm" />
      </div>

      {isAnalyzing ? (
        /* SCANNING ANIMATED SCANNER SCAN STATE */
        <div className="card-premium py-12 flex flex-col items-center justify-center gap-6 min-h-[380px] bg-gradient-to-b from-white to-primary-50/20">
          <div className="relative w-44 h-44 rounded-3xl overflow-hidden border-4 border-primary-500/30 shadow-premium flex items-center justify-center bg-gray-50">
            {imageSrc && (
              <img 
                src={imageSrc} 
                alt="leaf scanning preview" 
                className="w-full h-full object-cover animate-pulse-gentle opacity-80" 
              />
            )}
            
            {/* Pulsing Glowing Scan Laser Bar */}
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-emerald-400 to-primary-400 shadow-[0_0_15px_#40916c] animate-scan" />
          </div>

          <div className="text-center flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mb-1" />
            <h4 className="font-extrabold text-primary-800 text-base">{scanningText}</h4>
            <p className="text-xs text-gray-500 font-semibold max-w-[80%] leading-relaxed animate-pulse">
              {language === 'sw' 
                ? 'Tunasoma picha kwa kutumia Claude AI kulinganisha dalili za magonjwa...' 
                : 'Claude AI is reviewing leaf patterns to identify active fungal and bacterial pathogens...'
              }
            </p>
          </div>
        </div>
      ) : (
        /* STANDARD DIAGNOSE FLOW FORM */
        <div className="flex flex-col gap-5">
          
          {/* Step 1: Crop Selection Grid */}
          <div className="card-premium p-5 shadow-sm border-primary-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3.5">
              {selectCropLabel}
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CROP_OPTIONS.map((crop) => {
                const isSelected = selectedCrop === crop.type;
                const cropLabel = language === 'sw' ? crop.labelSw : crop.labelEn;
                
                return (
                  <button
                    key={crop.type}
                    onClick={() => setSelectedCrop(crop.type)}
                    className={`p-3 rounded-2xl flex items-center gap-2 border text-left transition-all duration-200 active:scale-95 cursor-pointer relative overflow-hidden select-none ${
                      isSelected 
                        ? 'bg-primary-50 border-primary-500 text-primary-850 font-bold ring-2 ring-primary-500/20' 
                        : 'bg-white hover:bg-primary-50/20 border-gray-200 text-gray-700'
                    }`}
                  >
                    <span className="text-xl">{crop.icon}</span>
                    <span className="text-xs truncate font-semibold leading-tight">{cropLabel}</span>
                    
                    {isSelected && (
                      <div className="absolute right-1 bottom-1 w-4 h-4 bg-primary-600 text-white rounded-full flex items-center justify-center">
                        <Check size={10} className="stroke-[3px]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Leaf Upload Image Section */}
          <div className="card-premium p-5 shadow-sm border-primary-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
              {uploadPhotoLabel}
            </h3>

            {/* Hidden HTML input fields */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            <input 
              type="file" 
              ref={cameraInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
            />

            {imageSrc ? (
              /* Image Upload Preview Panel */
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-primary-100 shadow-sm bg-gray-900/20">
                  <img 
                    src={imageSrc} 
                    alt="crop diagnostic preview" 
                    className="w-full h-full object-cover" 
                  />
                  <LeafGuideOverlay language={language} />
                  {/* Delete Image Overlay Trigger */}
                  <button 
                    onClick={() => setImageSrc(null)}
                    className="absolute top-3 right-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow transition-colors active:scale-95"
                  >
                    ✕ {language === 'sw' ? 'Ondoa' : 'Remove'}
                  </button>
                </div>

                {/* Retake buttons */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button 
                    onClick={triggerCameraClick}
                    className="btn-secondary py-3 text-sm flex items-center justify-center gap-2 border border-primary-200 text-primary-700"
                  >
                    <Camera size={16} />
                    <span>{language === 'sw' ? 'Piga Upya' : 'Retake Photo'}</span>
                  </button>
                  <button 
                    onClick={triggerUploadClick}
                    className="btn-secondary py-3 text-sm flex items-center justify-center gap-2 border border-primary-200 text-primary-700"
                  >
                    <Upload size={16} />
                    <span>{language === 'sw' ? 'Weka Nyingine' : 'Choose Other'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Initial Capture Call-To-Action Box */
              <div className="flex flex-col gap-4">
                {/* Camera area with leaf positioning guide */}
                <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-primary-800 to-primary-950 border-2 border-primary-600/30">
                  <LeafGuideOverlay language={language} />
                  <button
                    type="button"
                    onClick={triggerCameraClick}
                    className="absolute inset-0 w-full h-full flex flex-col items-center justify-end pb-8 gap-2 text-white/90 hover:bg-black/10 transition-colors cursor-pointer"
                  >
                    <Camera size={32} className="stroke-[2px] opacity-80" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {language === 'sw' ? 'Gusa kufungua kamera' : 'Tap to open camera'}
                    </span>
                  </button>
                </div>

                {/* Inline Divider */}
                <div className="flex items-center justify-center gap-3 py-1">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">{language === 'sw' ? 'AU' : 'OR'}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Secondary Gallery Upload Trigger */}
                <button
                  type="button"
                  onClick={triggerUploadClick}
                  className="w-full py-4.5 bg-white border-2 border-dashed border-primary-200 text-primary-700 rounded-3xl flex items-center justify-center gap-2.5 hover:bg-primary-50/30 hover:border-primary-400 active:scale-[0.98] transition-all select-none cursor-pointer font-semibold text-sm"
                >
                  <ImageIcon size={18} className="text-primary-600" />
                  <span>{language === 'sw' ? 'Pakia kutoka Kifaa' : 'Upload from Device Gallery'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Step 3: Trigger Final Analyze Button */}
          <button
            type="button"
            onClick={handleStartAnalysis}
            disabled={!imageSrc || !selectedCrop}
            className={`btn-primary py-4.5 w-full flex items-center justify-center gap-2 cursor-pointer ${
              (!imageSrc || !selectedCrop) ? 'opacity-55 cursor-not-allowed active:scale-100 bg-gray-400' : 'bg-primary-700 hover:bg-primary-600'
            }`}
          >
            <Sprout size={20} className={imageSrc && selectedCrop ? 'animate-bounce' : ''} />
            <span className="font-bold">{analyzeBtnText}</span>
            <ArrowRight size={18} className="stroke-[2.5px]" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DetectPage;
