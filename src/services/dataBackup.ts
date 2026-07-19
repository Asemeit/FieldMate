import { Diagnosis, StoredUser } from '../types';
import { dbService } from './db';

export type FieldMateBackup = {
  version: 1;
  exportedAt: number;
  browserHint?: string;
  users: StoredUser[];
  diagnoses: Diagnosis[];
};

export type ImportResult = {
  usersAdded: number;
  usersSkipped: number;
  diagnosesAdded: number;
};

export async function buildFieldMateBackup(): Promise<FieldMateBackup> {
  const [users, diagnoses] = await Promise.all([
    dbService.getAllUsers(),
    dbService.getAllDiagnoses(),
  ]);
  return {
    version: 1,
    exportedAt: Date.now(),
    browserHint: navigator.userAgent,
    users,
    diagnoses,
  };
}

export function downloadFieldMateBackup(backup: FieldMateBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `fieldmate-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importFieldMateBackup(raw: unknown): Promise<ImportResult> {
  if (!raw || typeof raw !== 'object') {
    throw new Error('INVALID_BACKUP');
  }

  const backup = raw as FieldMateBackup;
  if (backup.version !== 1 || !Array.isArray(backup.users)) {
    throw new Error('INVALID_BACKUP');
  }

  const existingUsers = await dbService.getAllUsers();
  const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

  let usersAdded = 0;
  let usersSkipped = 0;

  for (const account of backup.users) {
    if (!account?.email || !account.passwordHash || !account.name) continue;
    const email = account.email.toLowerCase();
    if (existingEmails.has(email)) {
      usersSkipped += 1;
      continue;
    }
    await dbService.saveUser({
      ...account,
      email,
    });
    existingEmails.add(email);
    usersAdded += 1;
  }

  let diagnosesAdded = 0;
  const diagnoses = Array.isArray(backup.diagnoses) ? backup.diagnoses : [];
  for (const item of diagnoses) {
    if (!item?.id) continue;
    const existing = await dbService.getDiagnosis(item.id);
    if (existing) continue;
    await dbService.saveDiagnosis(item);
    diagnosesAdded += 1;
  }

  return { usersAdded, usersSkipped, diagnosesAdded };
}

/** Chrome at localhost:5173 is the canonical demo browser. */
export function isRecommendedBrowser(): boolean {
  const ua = navigator.userAgent;
  const isChrome = /Chrome/i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua);
  const host = window.location.hostname;
  const port = window.location.port;
  const onLocalhost = host === 'localhost' || host === '127.0.0.1';
  return isChrome && onLocalhost && (port === '5173' || port === '');
}

export function storageBrowserLabel(): string {
  if (isRecommendedBrowser()) return 'Chrome (recommended)';
  if (/vscode/i.test(navigator.userAgent)) return 'VS Code embedded browser';
  if (/Edg/i.test(navigator.userAgent)) return 'Microsoft Edge';
  if (/Firefox/i.test(navigator.userAgent)) return 'Firefox';
  if (/Chrome/i.test(navigator.userAgent)) return 'Chrome';
  return 'This browser';
}
