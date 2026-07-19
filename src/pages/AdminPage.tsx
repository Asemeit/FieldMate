import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authService } from '../services/auth';
import { seedPilotFarmers } from '../services/seedUsers';
import {
  buildFieldMateBackup,
  downloadFieldMateBackup,
  importFieldMateBackup,
} from '../services/dataBackup';
import { PILOT_REGION } from '../config/pilotRegion';
import { StoredUser } from '../types';
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
} from 'lucide-react';
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
  const [registeredUsers, setRegisteredUsers] = useState(0);
  const [accounts, setAccounts] = useState<StoredUser[]>([]);
  const [inputKey, setInputKey] = useState(apiKey);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const refreshStats = async () => {
    const [count, list] = await Promise.all([authService.getUserCount(), authService.listUsers()]);
    setRegisteredUsers(count);
    setAccounts(list);
  };

  useEffect(() => {
    void refreshStats();
  }, []);

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

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

  const farmerCount = accounts.filter((a) => a.role !== 'admin').length;
  const adminCount = accounts.filter((a) => a.role === 'admin').length;

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
                ? `Umeingia kama msimamizi — ${user?.name}. Simamia usajili wa wakulima na data ya mradi wa ${PILOT_REGION.county}.`
                : `Signed in as administrator — ${user?.name}. Manage farmer enrolment and ${PILOT_REGION.county} project records.`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card-premium p-4 border-primary-100">
          <Users size={18} className="text-primary-600 mb-2" />
          <p className="text-2xl font-extrabold text-primary-800 dark:text-primary-50">{registeredUsers}</p>
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {isSw ? 'Akaunti zote' : 'Total accounts'}
          </p>
        </div>
        <div className="card-premium p-4 border-primary-100">
          <FileBarChart size={18} className="text-primary-600 mb-2" />
          <p className="text-2xl font-extrabold text-primary-800 dark:text-primary-50">{diagnosesHistory.length}</p>
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {isSw ? 'Uchunguzi' : 'Scans saved'}
          </p>
        </div>
      </div>

      <div className="card-premium p-5 border-primary-100">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Users size={16} className="text-primary-600" />
          {isSw ? 'Wakulima Waliosajiliwa' : 'Registered Farmers'}
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div className="rounded-xl bg-primary-50 dark:bg-primary-900/60 p-3 border border-primary-100 dark:border-primary-700">
            <p className="font-extrabold text-primary-800 dark:text-primary-100">{farmerCount}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase">
              {isSw ? 'Wakulima' : 'Farmers'}
            </p>
          </div>
          <div className="rounded-xl bg-primary-50 dark:bg-primary-900/60 p-3 border border-primary-100 dark:border-primary-700">
            <p className="font-extrabold text-primary-800 dark:text-primary-100">{adminCount}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase">
              {isSw ? 'Wasimamizi' : 'Admins'}
            </p>
          </div>
        </div>

        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-3">
          {isSw
            ? `Orodha ya wakulima waliosajiliwa kwenye mradi wa ${PILOT_REGION.county}.`
            : `Farmers enrolled in the ${PILOT_REGION.county} pilot programme.`}
        </p>

        <div className="max-h-80 overflow-y-auto rounded-2xl border border-primary-100 dark:border-primary-700 divide-y divide-primary-50 dark:divide-primary-700">
          {accounts.map((account) => (
            <div key={account.email} className="px-3 py-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-primary-800 dark:text-primary-100 truncate">{account.name}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{account.email}</p>
              </div>
              <span
                className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg shrink-0 ${
                  account.role === 'admin'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                }`}
              >
                {account.role === 'admin' ? (isSw ? 'Msimamizi' : 'Admin') : isSw ? 'Mkulima' : 'Farmer'}
              </span>
            </div>
          ))}
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

      <Link
        to="/settings"
        className="flex items-center justify-between p-4 rounded-2xl border border-primary-200 dark:border-primary-600 bg-white dark:bg-primary-800 text-sm font-bold text-primary-800 dark:text-primary-100 active:scale-[0.98] transition-transform"
      >
        <span>{isSw ? 'Rudi kwenye Mipangilio' : 'Back to Settings'}</span>
        <ChevronRight size={18} />
      </Link>
    </div>
  );
};

export default AdminPage;
