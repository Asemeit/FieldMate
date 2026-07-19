import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CropType, Diagnosis } from '../types';
import { 
  History, 
  Search, 
  Filter, 
  ChevronRight, 
  Trash2,
  CloudLightning,
  RefreshCw,
  CheckCircle,
  Sprout
} from 'lucide-react';
import { dbService } from '../services/db';
import { getDisplayConfidence } from '../lib/diagnosisUtils';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, diagnosesHistory, refreshHistory, showToast } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<CropType | 'All'>('All');

  useEffect(() => {
    refreshHistory();
  }, []);

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Avoid triggering route redirection
    
    const confirmDelete = window.confirm(
      language === 'sw' 
        ? 'Je, una uhakika unataka kufuta uchunguzi huu?' 
        : 'Are you sure you want to delete this diagnosis record?'
    );
    
    if (confirmDelete) {
      try {
        await dbService.deleteDiagnosis(id);
        await refreshHistory();
        showToast(
          language === 'sw' ? 'Uchunguzi umefutwa' : 'Diagnosis deleted successfully', 
          'success'
        );
      } catch (err) {
        console.error('Failed to delete diagnosis:', err);
      }
    }
  };

  const isSw = language === 'sw';
  const pageTitle = isSw ? 'Kumbukumbu ya Shamba' : 'Field Diagnosis History';
  const subTitle = isSw ? 'Tazama rekodi zako zote zilizochanganuliwa hapa' : 'View and filter all historical leaf diagnoses saved locally';
  const searchPlaceholder = isSw ? 'Tafuta ugonjwa...' : 'Search by disease...';
  const noHistoryText = isSw ? 'Hujafanya uchunguzi wowote bado.' : 'No diagnoses captured yet.';
  const filterAll = isSw ? 'Zote' : 'All Crops';

  // Apply filters and searches
  const filteredHistory = diagnosesHistory.filter((item) => {
    const diseaseMatches = (isSw ? item.recommendation.swahili.diseaseName : item.diseaseName)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
      
    const cropMatches = selectedFilter === 'All' || item.cropType === selectedFilter;
    
    return diseaseMatches && cropMatches;
  });

  return (
    <div className="flex flex-col gap-5 pb-6 animate-fade-in">
      
      {/* Title */}
      <div className="flex items-center gap-2.5 border-b border-primary-100 pb-3">
        <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
          <History size={20} className="stroke-[2px]" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-primary-800 tracking-tight">{pageTitle}</h2>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">{subTitle}</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3">
        {/* Text Search Input */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs md:text-sm font-medium shadow-sm"
          />
        </div>

        {/* Horizontal Crop Filter Ribbon */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedFilter('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer select-none border transition-all ${
              selectedFilter === 'All'
                ? 'bg-primary-700 border-primary-700 text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-primary-50/20'
            }`}
          >
            {filterAll}
          </button>
          
          {(['Maize', 'Potato', 'Tomato', 'Wheat', 'Beans'] as CropType[]).map((crop) => {
            const label = isSw
              ? (crop === 'Maize' ? 'Mahindi' : crop === 'Potato' ? 'Viazi' : crop === 'Tomato' ? 'Nyanya' : crop === 'Wheat' ? 'Ngano' : 'Maharagwe')
              : crop;
            const isSelected = selectedFilter === crop;

            return (
              <button
                key={crop}
                onClick={() => setSelectedFilter(crop)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer select-none border transition-all ${
                  isSelected
                    ? 'bg-primary-700 border-primary-700 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-primary-50/20'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* History Items Lists */}
      {filteredHistory.length === 0 ? (
        <div className="card-premium p-8 text-center border-dashed border-2 border-primary-200 bg-white/40 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center animate-pulse">
            <Sprout size={22} />
          </div>
          <p className="text-xs text-gray-500 font-semibold max-w-[80%] mx-auto leading-relaxed">
            {noHistoryText}
          </p>
          <button 
            onClick={() => navigate('/detect')}
            className="px-5 py-2.5 bg-primary-700 hover:bg-primary-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
          >
            {isSw ? 'Changanua Sasa' : 'Start Diagnosis'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredHistory.map((item) => {
            const recordName = isSw ? item.recommendation.swahili.diseaseName : item.diseaseName;
            
            return (
              <div
                key={item.id}
                onClick={() => navigate(`/results/${item.id}`)}
                className="card-premium border-primary-100 p-3.5 bg-white flex items-center justify-between gap-3 hover:scale-[1.01] transition-transform cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={item.imageUrl}
                    alt="diagnosed crop leaf"
                    className="w-12 h-12 rounded-xl object-cover border border-primary-100/50 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-sm text-primary-800 leading-tight truncate">
                      {recordName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-primary-100 text-primary-700 rounded-md shrink-0">
                        {item.cropType}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium truncate">
                        {new Date(item.timestamp).toLocaleDateString(
                          isSw ? 'sw-TZ' : 'en-US',
                          { month: 'short', day: 'numeric', year: 'numeric' }
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-primary-600 shrink-0">
                    {getDisplayConfidence(item)}%
                  </span>
                  {/* Local Sync indicators */}
                  <div>
                    {item.syncStatus === 'pending' ? (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 border border-amber-100 text-amber-600" title="Offline - Unsynced">
                        <RefreshCw size={12} className="animate-spin" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600" title="Cloud Synced">
                        <CheckCircle size={12} className="stroke-[2.5px]" />
                      </div>
                    )}
                  </div>

                  {/* Deletion Trigger */}
                  <button
                    onClick={(e) => handleDeleteItem(e, item.id)}
                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 size={14} />
                  </button>
                  
                  <ChevronRight size={16} className="text-gray-300 stroke-[2.5px] shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
