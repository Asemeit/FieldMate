import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authService } from '../services/auth';
import { seedPilotFarmers } from '../services/seedUsers';
import {
  buildFieldMateBackup,
  downloadFieldMateBackup,
  importFieldMateBackup,
} from '../services/dataBackup';
import {
  diseaseCatalogService,
  DISEASE_CROPS,
  type DiseaseCatalog,
} from '../services/diseaseCatalog';
import { exportAdminReportPdf, type AdminReportSummary } from '../services/pdfExport';
import { PILOT_REGION } from '../config/pilotRegion';
import type { CropType, DiseaseRecommendation, RiskLevel, StoredUser } from '../types';
import {
  Shield,
  Users,
  Database,
  Download,
  Upload,
  Key,
  Lock,
  FileBarChart,
  ChevronRight,
  UserPlus,
  Pencil,
  Trash2,
  Bug,
  BarChart3,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'diseases' | 'reports';

const emptyDiseaseForm = (_crop: CropType): DiseaseRecommendation => ({
  diseaseName: '',
  confidence: 85,
  severity: 'Medium',
  symptoms: [''],
  causes: [''],
  treatment: [''],
  prevention: [''],
  swahili: {
    diseaseName: '',
    severity: 'Kati',
    symptoms: [''],
    causes: [''],
    treatment: [''],
    prevention: [''],
  },
});

function bumpCount(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

function maxBar(map: Record<string, number>): number {
  return Math.max(1, ...Object.values(map), 1);
}

export const AdminPage: React.FC = () => {
  const {
    language,
    user,
    apiKey,
    updateSettings,
    refreshHistory,
    showToast,
    diagnosesHistory,
  } = useApp();

  const isSw = language === 'sw';
  const [tab, setTab] = useState<AdminTab>('overview');
  const [registeredUsers, setRegisteredUsers] = useState(0);
  const [accounts, setAccounts] = useState<StoredUser[]>([]);
  const [inputKey, setInputKey] = useState(apiKey);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [editingUser, setEditingUser] = useState<StoredUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editCounty, setEditCounty] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  const [catalog, setCatalog] = useState<DiseaseCatalog | null>(null);
  const [cropFilter, setCropFilter] = useState<CropType>('Maize');
  const [editingDisease, setEditingDisease] = useState<{
    crop: CropType;
    originalName: string | null;
    draft: DiseaseRecommendation;
  } | null>(null);
  const [savingDisease, setSavingDisease] = useState(false);

  const refreshStats = async () => {
    const [count, list] = await Promise.all([authService.getUserCount(), authService.listUsers()]);
    setRegisteredUsers(count);
    setAccounts(list);
  };

  const refreshCatalog = async () => {
    setCatalog(await diseaseCatalogService.getCatalog());
  };

  useEffect(() => {
    void refreshStats();
    void refreshCatalog();
  }, []);

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  const farmerCount = accounts.filter((a) => a.role !== 'admin').length;
  const adminCount = accounts.filter((a) => a.role === 'admin').length;

  const reportSummary: AdminReportSummary = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const byCrop: Record<string, number> = {};
    const byDisease: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byMode: Record<string, number> = {};
    let last7Days = 0;
    let last30Days = 0;

    for (const diag of diagnosesHistory) {
      bumpCount(byCrop, diag.cropType);
      bumpCount(byDisease, diag.diseaseName || 'Unknown');
      bumpCount(bySeverity, diag.recommendation?.severity || 'Unknown');
      bumpCount(byMode, diag.analysisMode || 'unknown');
      const age = now - diag.timestamp;
      if (age <= 7 * day) last7Days += 1;
      if (age <= 30 * day) last30Days += 1;
    }

    return {
      totalScans: diagnosesHistory.length,
      farmerCount,
      adminCount,
      byCrop,
      byDisease,
      bySeverity,
      byMode,
      last7Days,
      last30Days,
      generatedAt: now,
    };
  }, [diagnosesHistory, farmerCount, adminCount]);

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({ anthropicApiKey: inputKey });
    showToast(isSw ? 'Ufunguo umehifadhiwa' : 'API key saved', 'success');
  };

  const handleRegisterPilotFarmers = async () => {
    const confirmRegister = window.confirm(
      isSw
        ? 'Sajili wakulima 50 waliojiunga na mradi wa Uasin Gishu kwenye kifaa hiki?'
        : 'Register the 50 farmers enrolled in the Uasin Gishu pilot programme on this device?'
    );
    if (!confirmRegister) return;

    setIsSeeding(true);
    try {
      const result = await seedPilotFarmers(50);
      await refreshStats();
      showToast(
        isSw
          ? `Usajili umekamilika. ${result.created} mpya, ${result.skipped} zilikuwepo. Jumla: ${result.total} akaunti.`
          : `Enrolment complete. ${result.created} new, ${result.skipped} already registered. Total: ${result.total} accounts.`,
        'success'
      );
    } catch (err) {
      console.error('Pilot farmer registration failed:', err);
      showToast(isSw ? 'Imeshindwa kusajili wakulima.' : 'Failed to register farmers.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const backup = await buildFieldMateBackup();
      downloadFieldMateBackup(backup);
      showToast(
        isSw
          ? `Imesafirishwa akaunti ${backup.users.length} (+ historia)`
          : `Exported ${backup.users.length} accounts (+ history)`,
        'success'
      );
    } catch (err) {
      console.error('Export backup failed:', err);
      showToast(isSw ? 'Imeshindwa kusafirisha data' : 'Failed to export backup', 'error');
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const result = await importFieldMateBackup(parsed);
      await refreshStats();
      await refreshHistory();
      const total = await authService.getUserCount();
      showToast(
        isSw
          ? `Imeunganishwa! ${result.usersAdded} mpya, ${result.usersSkipped} zilikuwepo. Jumla: ${total} akaunti.`
          : `Merged! ${result.usersAdded} new users, ${result.usersSkipped} already existed. Total: ${total} accounts.`,
        'success'
      );
    } catch (err) {
      console.error('Import backup failed:', err);
      showToast(
        isSw ? 'Faili si sahihi au imeharibika' : 'Invalid or corrupted backup file',
        'error'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const openEditUser = (account: StoredUser) => {
    setEditingUser(account);
    setEditName(account.name);
    setEditCounty(account.county);
    setEditPassword('');
  };

  const handleSaveUser = async () => {
    if (!editingUser || !user) return;
    setSavingUser(true);
    try {
      await authService.adminUpdateUser(editingUser.email, {
        name: editName,
        county: editCounty,
      });
      if (editPassword.trim().length >= 8) {
        await authService.adminSetPassword(editingUser.email, editPassword.trim());
      }
      await refreshStats();
      setEditingUser(null);
      showToast(isSw ? 'Akaunti imesasishwa' : 'Account updated', 'success');
    } catch {
      showToast(isSw ? 'Imeshindwa kusasisha akaunti' : 'Failed to update account', 'error');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (account: StoredUser) => {
    if (!user) return;
    const ok = window.confirm(
      isSw
        ? `Futa akaunti ya ${account.name} (${account.email})?`
        : `Delete account for ${account.name} (${account.email})?`
    );
    if (!ok) return;

    try {
      await authService.adminDeleteUser(account.email, user.email);
      await refreshStats();
      showToast(isSw ? 'Akaunti imefutwa' : 'Account deleted', 'success');
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'CANNOT_DELETE_SELF') {
        showToast(isSw ? 'Huwezi kujifuta mwenyewe' : 'You cannot delete your own account', 'error');
      } else if (code === 'CANNOT_DELETE_ADMIN') {
        showToast(isSw ? 'Huwezi kufuta msimamizi' : 'Cannot delete an administrator', 'error');
      } else {
        showToast(isSw ? 'Imeshindwa kufuta akaunti' : 'Failed to delete account', 'error');
      }
    }
  };

  const openEditDisease = (crop: CropType, disease: DiseaseRecommendation) => {
    setEditingDisease({
      crop,
      originalName: disease.diseaseName,
      draft: JSON.parse(JSON.stringify(disease)) as DiseaseRecommendation,
    });
  };

  const openAddDisease = () => {
    setEditingDisease({
      crop: cropFilter,
      originalName: null,
      draft: emptyDiseaseForm(cropFilter),
    });
  };

  const handleSaveDisease = async () => {
    if (!editingDisease) return;
    const { crop, originalName, draft } = editingDisease;
    if (!draft.diseaseName.trim()) {
      showToast(isSw ? 'Weka jina la ugonjwa' : 'Enter a disease name', 'error');
      return;
    }

    const cleaned: DiseaseRecommendation = {
      ...draft,
      diseaseName: draft.diseaseName.trim(),
      symptoms: draft.symptoms.map((s) => s.trim()).filter(Boolean),
      causes: draft.causes.map((s) => s.trim()).filter(Boolean),
      treatment: draft.treatment.map((s) => s.trim()).filter(Boolean),
      prevention: draft.prevention.map((s) => s.trim()).filter(Boolean),
      swahili: {
        ...draft.swahili,
        diseaseName: draft.swahili.diseaseName.trim() || draft.diseaseName.trim(),
        symptoms: draft.swahili.symptoms.map((s) => s.trim()).filter(Boolean),
        causes: draft.swahili.causes.map((s) => s.trim()).filter(Boolean),
        treatment: draft.swahili.treatment.map((s) => s.trim()).filter(Boolean),
        prevention: draft.swahili.prevention.map((s) => s.trim()).filter(Boolean),
      },
    };

    setSavingDisease(true);
    try {
      if (originalName) {
        await diseaseCatalogService.updateDisease(crop, originalName, cleaned);
      } else {
        await diseaseCatalogService.addDisease(crop, cleaned);
      }
      await refreshCatalog();
      setEditingDisease(null);
      showToast(isSw ? 'Ugonjwa umehifadhiwa' : 'Disease saved', 'success');
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'DISEASE_EXISTS') {
        showToast(isSw ? 'Ugonjwa huu tayari upo' : 'Disease already exists', 'error');
      } else {
        showToast(isSw ? 'Imeshindwa kuhifadhi ugonjwa' : 'Failed to save disease', 'error');
      }
    } finally {
      setSavingDisease(false);
    }
  };

  const handleDeleteDisease = async (crop: CropType, diseaseName: string) => {
    const ok = window.confirm(
      isSw ? `Futa ugonjwa "${diseaseName}"?` : `Delete disease "${diseaseName}"?`
    );
    if (!ok) return;
    try {
      await diseaseCatalogService.deleteDisease(crop, diseaseName);
      await refreshCatalog();
      showToast(isSw ? 'Ugonjwa umefutwa' : 'Disease deleted', 'success');
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'LAST_DISEASE') {
        showToast(
          isSw ? 'Lazima kibaki angalau ugonjwa mmoja kwa zao' : 'Keep at least one disease per crop',
          'error'
        );
      } else {
        showToast(isSw ? 'Imeshindwa kufuta' : 'Failed to delete', 'error');
      }
    }
  };

  const handleResetDiseases = async () => {
    const ok = window.confirm(
      isSw
        ? 'Rejesha orodha ya magonjwa kwa chaguo-msingi?'
        : 'Reset disease catalog to built-in defaults?'
    );
    if (!ok) return;
    await diseaseCatalogService.resetToDefaults();
    await refreshCatalog();
    showToast(isSw ? 'Orodha imerejeshwa' : 'Catalog reset to defaults', 'success');
  };

  const handleExportReport = async () => {
    try {
      await exportAdminReportPdf(reportSummary, language);
      showToast(isSw ? 'Ripoti ya PDF imepakuliwa' : 'Report PDF downloaded', 'success');
    } catch {
      showToast(isSw ? 'Imeshindwa kutoa ripoti' : 'Failed to export report', 'error');
    }
  };

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: isSw ? 'Muhtasari' : 'Overview', icon: <Shield size={14} /> },
    { id: 'users', label: isSw ? 'Watumiaji' : 'Users', icon: <Users size={14} /> },
    { id: 'diseases', label: isSw ? 'Magonjwa' : 'Diseases', icon: <Bug size={14} /> },
    { id: 'reports', label: isSw ? 'Ripoti' : 'Reports', icon: <BarChart3 size={14} /> },
  ];

  const renderStatBars = (data: Record<string, number>, colorClass: string) => {
    const peak = maxBar(data);
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      return (
        <p className="text-xs text-gray-400 font-medium">
          {isSw ? 'Hakuna data bado' : 'No data yet'}
        </p>
      );
    }
    return (
      <div className="space-y-2">
        {entries.map(([label, value]) => (
          <div key={label}>
            <div className="flex justify-between text-[10px] font-bold text-gray-600 dark:text-gray-300 mb-1">
              <span className="truncate pr-2">{label}</span>
              <span>{value}</span>
            </div>
            <div className="h-2 rounded-full bg-primary-50 dark:bg-primary-900 overflow-hidden">
              <div
                className={`h-full rounded-full ${colorClass}`}
                style={{ width: `${Math.max(8, (value / peak) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 pb-6 animate-fade-in">
      <div className="card-premium p-5 border-primary-200 dark:border-primary-600 bg-gradient-to-br from-primary-700 to-primary-900 text-white">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <Shield size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-200">
              {isSw ? 'Usimamizi wa Mradi' : 'Project Administration'}
            </p>
            <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
              {isSw ? 'Paneli ya Msimamizi' : 'Administrator Panel'}
            </h2>
            <p className="text-xs text-primary-100/90 mt-2 leading-relaxed">
              {isSw
                ? `Umeingia kama msimamizi — ${user?.name}. Simamia watumiaji, magonjwa na ripoti za ${PILOT_REGION.county}.`
                : `Signed in as administrator — ${user?.name}. Manage users, diseases, and ${PILOT_REGION.county} reports.`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`py-2.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              tab === item.id
                ? 'bg-primary-700 text-white'
                : 'bg-white dark:bg-primary-800 text-primary-800 dark:text-primary-100 border border-primary-100 dark:border-primary-600'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="card-premium p-4 border-primary-100">
              <Users size={18} className="text-primary-600 mb-2" />
              <p className="text-2xl font-extrabold text-primary-800 dark:text-primary-50">
                {registeredUsers}
              </p>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {isSw ? 'Akaunti zote' : 'Total accounts'}
              </p>
            </div>
            <div className="card-premium p-4 border-primary-100">
              <FileBarChart size={18} className="text-primary-600 mb-2" />
              <p className="text-2xl font-extrabold text-primary-800 dark:text-primary-50">
                {diagnosesHistory.length}
              </p>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {isSw ? 'Uchunguzi' : 'Scans saved'}
              </p>
            </div>
          </div>

          <div className="card-premium p-5 border-primary-100">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Database size={16} className="text-primary-600" />
              {isSw ? 'Usajili na Hifadhi' : 'Enrolment & Backup'}
            </h3>

            {farmerCount < 50 && (
              <>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-3 leading-relaxed">
                  {isSw
                    ? 'Sajili wakulima waliojiunga na mradi wa Uasin Gishu kwenye kifaa hiki.'
                    : 'Register farmers who joined the Uasin Gishu pilot on this device.'}
                </p>
                <button
                  type="button"
                  onClick={handleRegisterPilotFarmers}
                  disabled={isSeeding}
                  className="w-full py-3.5 px-4 mb-3 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900 dark:hover:bg-primary-800 text-primary-800 dark:text-primary-100 border border-primary-200 dark:border-primary-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <UserPlus size={14} />
                  <span>
                    {isSeeding
                      ? isSw
                        ? 'Inasajili wakulima...'
                        : 'Registering farmers...'
                      : isSw
                        ? 'Sajili Wakulima wa Mradi (50)'
                        : 'Register Pilot Farmers (50)'}
                  </span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleExportBackup}
              className="w-full py-3 px-4 mb-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>{isSw ? 'Safirisha Backup (JSON)' : 'Export Backup (JSON)'}</span>
            </button>

            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportBackup}
            />
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={isImporting}
              className="w-full py-3 px-4 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950 dark:hover:bg-violet-900 text-violet-800 dark:text-violet-200 border border-violet-200 dark:border-violet-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload size={14} />
              <span>
                {isImporting
                  ? isSw
                    ? 'Inaunganisha...'
                    : 'Merging...'
                  : isSw
                    ? 'Ingiza Backup (unganisha)'
                    : 'Import Backup (merge)'}
              </span>
            </button>
          </div>

          <div className="card-premium p-5 border-primary-100">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Key size={16} className="text-primary-600" />
              <span>{isSw ? 'Ufunguo wa Claude API' : 'Claude API Key'}</span>
            </h3>
            <p className="text-[10px] text-gray-400 font-medium mb-4">
              {isSw
                ? 'Hiari — bila ufunguo, programu inatumia hifadhidata ya ndani ya ushauri.'
                : 'Optional — without a key, the app uses the built-in advisory database.'}
            </p>
            <form onSubmit={handleSaveApiKey} className="flex flex-col gap-3">
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-primary-900 border border-gray-200 dark:border-primary-600 rounded-2xl text-xs font-semibold"
                />
              </div>
              <button type="submit" className="btn-primary py-3 w-full text-xs font-bold rounded-xl cursor-pointer">
                {isSw ? 'Hifadhi Ufunguo' : 'Save API Key'}
              </button>
            </form>
          </div>
        </>
      )}

      {tab === 'users' && (
        <div className="card-premium p-5 border-primary-100">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={16} className="text-primary-600" />
              {isSw ? 'Simamia Watumiaji' : 'Manage Users'}
            </h3>
            <div className="text-[10px] font-bold text-gray-500">
              {farmerCount} {isSw ? 'wakulima' : 'farmers'} · {adminCount} {isSw ? 'wasimamizi' : 'admins'}
            </div>
          </div>

          <div className="max-h-[28rem] overflow-y-auto rounded-2xl border border-primary-100 dark:border-primary-700 divide-y divide-primary-50 dark:divide-primary-700">
            {accounts.map((account) => (
              <div key={account.email} className="px-3 py-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-primary-800 dark:text-primary-100 truncate">
                    {account.name}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{account.email}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{account.county}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg ${
                      account.role === 'admin'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                    }`}
                  >
                    {account.role === 'admin' ? (isSw ? 'Msimamizi' : 'Admin') : isSw ? 'Mkulima' : 'Farmer'}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEditUser(account)}
                      className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-200 cursor-pointer"
                      title={isSw ? 'Hariri' : 'Edit'}
                    >
                      <Pencil size={12} />
                    </button>
                    {account.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteUser(account)}
                        className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200 cursor-pointer"
                        title={isSw ? 'Futa' : 'Delete'}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'diseases' && (
        <div className="card-premium p-5 border-primary-100">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Bug size={16} className="text-primary-600" />
              {isSw ? 'Simamia Magonjwa' : 'Manage Diseases'}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openAddDisease}
                className="py-2 px-3 rounded-xl bg-primary-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                {isSw ? 'Ongeza' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => void handleResetDiseases()}
                className="py-2 px-3 rounded-xl border border-primary-200 dark:border-primary-600 text-primary-800 dark:text-primary-100 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                {isSw ? 'Rejesha' : 'Reset'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {DISEASE_CROPS.map((crop) => (
              <button
                key={crop}
                type="button"
                onClick={() => setCropFilter(crop)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                  cropFilter === crop
                    ? 'bg-primary-700 text-white'
                    : 'bg-primary-50 dark:bg-primary-900 text-primary-800 dark:text-primary-100'
                }`}
              >
                {crop}
              </button>
            ))}
          </div>

          <div className="max-h-[28rem] overflow-y-auto rounded-2xl border border-primary-100 dark:border-primary-700 divide-y divide-primary-50 dark:divide-primary-700">
            {(catalog?.[cropFilter] ?? []).map((disease) => (
              <div key={disease.diseaseName} className="px-3 py-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-primary-800 dark:text-primary-100">
                    {isSw ? disease.swahili.diseaseName : disease.diseaseName}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {isSw ? 'Ukali' : 'Severity'}: {isSw ? disease.swahili.severity : disease.severity}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditDisease(cropFilter, disease)}
                    className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-200 cursor-pointer"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteDisease(cropFilter, disease.diseaseName)}
                    className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200 cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="card-premium p-4 border-primary-100">
              <p className="text-2xl font-extrabold text-primary-800 dark:text-primary-50">
                {reportSummary.totalScans}
              </p>
              <p className="text-[10px] font-bold text-gray-500 uppercase">{isSw ? 'Uchunguzi wote' : 'Total scans'}</p>
            </div>
            <div className="card-premium p-4 border-primary-100">
              <p className="text-2xl font-extrabold text-primary-800 dark:text-primary-50">
                {reportSummary.last7Days}
              </p>
              <p className="text-[10px] font-bold text-gray-500 uppercase">{isSw ? 'Siku 7' : 'Last 7 days'}</p>
            </div>
            <div className="card-premium p-4 border-primary-100">
              <p className="text-2xl font-extrabold text-primary-800 dark:text-primary-50">
                {reportSummary.last30Days}
              </p>
              <p className="text-[10px] font-bold text-gray-500 uppercase">{isSw ? 'Siku 30' : 'Last 30 days'}</p>
            </div>
            <div className="card-premium p-4 border-primary-100">
              <p className="text-2xl font-extrabold text-primary-800 dark:text-primary-50">
                {farmerCount}
              </p>
              <p className="text-[10px] font-bold text-gray-500 uppercase">{isSw ? 'Wakulima' : 'Farmers'}</p>
            </div>
          </div>

          <div className="card-premium p-5 border-primary-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              {isSw ? 'Kwa zao' : 'By crop'}
            </h3>
            {renderStatBars(reportSummary.byCrop, 'bg-emerald-500')}
          </div>

          <div className="card-premium p-5 border-primary-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              {isSw ? 'Kwa ugonjwa' : 'By disease'}
            </h3>
            {renderStatBars(reportSummary.byDisease, 'bg-amber-500')}
          </div>

          <div className="card-premium p-5 border-primary-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              {isSw ? 'Kwa ukali' : 'By severity'}
            </h3>
            {renderStatBars(reportSummary.bySeverity, 'bg-rose-500')}
          </div>

          <button
            type="button"
            onClick={() => void handleExportReport()}
            className="btn-primary py-3 w-full text-xs font-bold rounded-xl cursor-pointer"
          >
            <Download size={14} />
            {isSw ? 'Pakua Ripoti (PDF)' : 'Download Report (PDF)'}
          </button>
        </div>
      )}

      <Link
        to="/settings"
        className="flex items-center justify-between p-4 rounded-2xl border border-primary-200 dark:border-primary-600 bg-white dark:bg-primary-800 text-sm font-bold text-primary-800 dark:text-primary-100 active:scale-[0.98] transition-transform"
      >
        <span>{isSw ? 'Rudi kwenye Mipangilio' : 'Back to Settings'}</span>
        <ChevronRight size={18} />
      </Link>

      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-primary-800 rounded-3xl p-5 border border-primary-100 dark:border-primary-600 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-primary-800 dark:text-primary-50">
                {isSw ? 'Hariri Akaunti' : 'Edit Account'}
              </h3>
              <button type="button" onClick={() => setEditingUser(null)} className="p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mb-3">{editingUser.email}</p>
            <label className="text-[10px] font-bold uppercase text-gray-500">{isSw ? 'Jina' : 'Name'}</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full mt-1 mb-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-primary-600 bg-gray-50 dark:bg-primary-900 text-xs font-semibold"
            />
            <label className="text-[10px] font-bold uppercase text-gray-500">{isSw ? 'Kaunti' : 'County'}</label>
            <input
              value={editCounty}
              onChange={(e) => setEditCounty(e.target.value)}
              className="w-full mt-1 mb-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-primary-600 bg-gray-50 dark:bg-primary-900 text-xs font-semibold"
            />
            <label className="text-[10px] font-bold uppercase text-gray-500">
              {isSw ? 'Nenosiri jipya (hiari)' : 'New password (optional)'}
            </label>
            <input
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder={isSw ? 'Angalau herufi 8' : 'At least 8 characters'}
              className="w-full mt-1 mb-4 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-primary-600 bg-gray-50 dark:bg-primary-900 text-xs font-semibold"
            />
            <button
              type="button"
              disabled={savingUser}
              onClick={() => void handleSaveUser()}
              className="btn-primary py-3 w-full text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
            >
              {savingUser ? (isSw ? 'Inahifadhi...' : 'Saving...') : isSw ? 'Hifadhi' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {editingDisease && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-3 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-primary-800 rounded-3xl p-5 border border-primary-100 dark:border-primary-600 shadow-xl my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-primary-800 dark:text-primary-50">
                {editingDisease.originalName
                  ? isSw
                    ? 'Hariri Ugonjwa'
                    : 'Edit Disease'
                  : isSw
                    ? 'Ongeza Ugonjwa'
                    : 'Add Disease'}
              </h3>
              <button type="button" onClick={() => setEditingDisease(null)} className="p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <label className="text-[10px] font-bold uppercase text-gray-500">{isSw ? 'Zao' : 'Crop'}</label>
            <select
              value={editingDisease.crop}
              disabled={Boolean(editingDisease.originalName)}
              onChange={(e) =>
                setEditingDisease({ ...editingDisease, crop: e.target.value as CropType })
              }
              className="w-full mt-1 mb-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-primary-600 bg-gray-50 dark:bg-primary-900 text-xs font-semibold"
            >
              {DISEASE_CROPS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="text-[10px] font-bold uppercase text-gray-500">
              {isSw ? 'Jina (EN)' : 'Name (EN)'}
            </label>
            <input
              value={editingDisease.draft.diseaseName}
              onChange={(e) =>
                setEditingDisease({
                  ...editingDisease,
                  draft: { ...editingDisease.draft, diseaseName: e.target.value },
                })
              }
              className="w-full mt-1 mb-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-primary-600 bg-gray-50 dark:bg-primary-900 text-xs font-semibold"
            />

            <label className="text-[10px] font-bold uppercase text-gray-500">
              {isSw ? 'Jina (SW)' : 'Name (SW)'}
            </label>
            <input
              value={editingDisease.draft.swahili.diseaseName}
              onChange={(e) =>
                setEditingDisease({
                  ...editingDisease,
                  draft: {
                    ...editingDisease.draft,
                    swahili: { ...editingDisease.draft.swahili, diseaseName: e.target.value },
                  },
                })
              }
              className="w-full mt-1 mb-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-primary-600 bg-gray-50 dark:bg-primary-900 text-xs font-semibold"
            />

            <label className="text-[10px] font-bold uppercase text-gray-500">
              {isSw ? 'Ukali' : 'Severity'}
            </label>
            <select
              value={editingDisease.draft.severity}
              onChange={(e) =>
                setEditingDisease({
                  ...editingDisease,
                  draft: {
                    ...editingDisease.draft,
                    severity: e.target.value as RiskLevel,
                    swahili: {
                      ...editingDisease.draft.swahili,
                      severity:
                        e.target.value === 'High' ? 'Juu' : e.target.value === 'Low' ? 'Chini' : 'Kati',
                    },
                  },
                })
              }
              className="w-full mt-1 mb-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-primary-600 bg-gray-50 dark:bg-primary-900 text-xs font-semibold"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            {(['treatment', 'prevention'] as const).map((field) => (
              <div key={field} className="mb-3">
                <label className="text-[10px] font-bold uppercase text-gray-500">
                  {field === 'treatment'
                    ? isSw
                      ? 'Matibabu (EN, kila mstari)'
                      : 'Treatment (EN, one per line)'
                    : isSw
                      ? 'Kinga (EN, kila mstari)'
                      : 'Prevention (EN, one per line)'}
                </label>
                <textarea
                  value={editingDisease.draft[field].join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    setEditingDisease({
                      ...editingDisease,
                      draft: { ...editingDisease.draft, [field]: lines },
                    });
                  }}
                  rows={3}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-primary-600 bg-gray-50 dark:bg-primary-900 text-xs font-semibold"
                />
              </div>
            ))}

            <button
              type="button"
              disabled={savingDisease}
              onClick={() => void handleSaveDisease()}
              className="btn-primary py-3 w-full text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
            >
              {savingDisease ? (isSw ? 'Inahifadhi...' : 'Saving...') : isSw ? 'Hifadhi' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
