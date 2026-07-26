import { StoredUser } from '../types';
import { dbService } from './db';
import { PILOT_REGION } from '../config/pilotRegion';
import { resolveUserRole } from '../config/admin';
import {
  isValidEmail,
  isValidName,
  isValidPassword,
  MIN_PASSWORD_LENGTH,
} from '../lib/validation';

const PASSWORD_SALT = 'FieldMate-UasinGishu-2025';
const LAST_EMAIL_KEY = 'fieldmate_last_email';
const SESSION_KEY = 'fieldmate_active_user';

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(PASSWORD_SALT + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPasswordLegacy(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateRegistrationInput(name: string, email: string, password: string): void {
  if (!isValidName(name) || !isValidEmail(email) || !isValidPassword(password)) {
    throw new Error('INVALID_INPUT');
  }
}

function pickPreferredUser(existing: StoredUser, candidate: StoredUser): StoredUser {
  const existingHasHash = Boolean(existing.passwordHash?.length);
  const candidateHasHash = Boolean(candidate.passwordHash?.length);

  if (existingHasHash && !candidateHasHash) return existing;
  if (!existingHasHash && candidateHasHash) return candidate;

  return existing.createdAt <= candidate.createdAt ? existing : candidate;
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'Farmer';
  return local.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

class AuthService {
  /** Run once on app start — repair legacy records and session-only accounts. */
  public async initializeAuth(): Promise<void> {
    await this.migrateUsers();
    await this.migrateSessionAccounts();
  }

  /** Normalize emails, merge duplicates, and remove stale IndexedDB keys. */
  private async migrateUsers(): Promise<void> {
    const allUsers = await dbService.getAllUsers();
    const keepByEmail = new Map<string, StoredUser>();

    for (const user of allUsers) {
      const normalized = normalizeEmail(user.email);
      if (!normalized) continue;

      const candidate: StoredUser = { ...user, email: normalized };
      const existing = keepByEmail.get(normalized);

      if (!existing) {
        keepByEmail.set(normalized, candidate);
        continue;
      }

      const preferred = pickPreferredUser(existing, candidate);
      const dropped = preferred === existing ? candidate : existing;
      keepByEmail.set(normalized, preferred);
      await dbService.deleteUser(dropped.email).catch(() => undefined);
    }

    for (const user of allUsers) {
      const normalized = normalizeEmail(user.email);
      const keeper = keepByEmail.get(normalized);
      if (!keeper || keeper.email === user.email) continue;
      await dbService.deleteUser(user.email).catch(() => undefined);
    }

    for (const user of keepByEmail.values()) {
      const emailRole = resolveUserRole(user.email);
      const role = emailRole === 'admin' ? 'admin' : user.role ?? 'farmer';
      const updated: StoredUser = { ...user, role };
      await dbService.saveUser(updated);
    }
  }

  /** Old logins only saved a session — create a users record so reset/login works. */
  private async migrateSessionAccounts(): Promise<void> {
    const sessions: Array<{ name: string; email: string }> = [];

    const activeUser = await dbService.getSetting<{ name: string; email: string }>('activeUser');
    if (activeUser?.email && activeUser?.name) {
      sessions.push(activeUser);
    }

    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) sessions.push(JSON.parse(raw));
    } catch {
      // ignore invalid session JSON
    }

    for (const session of sessions) {
      const normalized = normalizeEmail(session.email);
      if (!normalized || !session.name.trim()) continue;
      if (await this.findUserByEmail(normalized)) continue;

      await dbService.saveUser({
        email: normalized,
        name: session.name.trim(),
        passwordHash: '',
        county: PILOT_REGION.county,
        createdAt: Date.now(),
        role: resolveUserRole(normalized),
      });
    }
  }

  private async findUserByEmail(rawEmail: string): Promise<StoredUser | undefined> {
    const normalizedEmail = normalizeEmail(rawEmail);
    let user = await dbService.getUserByEmail(normalizedEmail);
    if (user) return user;

    const allUsers = await dbService.getAllUsers();
    const legacy = allUsers.find((u) => normalizeEmail(u.email) === normalizedEmail);
    if (!legacy) return undefined;

    const migrated: StoredUser = { ...legacy, email: normalizedEmail };
    await dbService.saveUser(migrated);
    if (legacy.email !== normalizedEmail) {
      await dbService.deleteUser(legacy.email).catch(() => undefined);
    }
    return migrated;
  }

  private async resolveDisplayName(normalizedEmail: string): Promise<string> {
    const activeUser = await dbService.getSetting<{ name: string; email: string }>('activeUser');
    if (activeUser && normalizeEmail(activeUser.email) === normalizedEmail && activeUser.name.trim()) {
      return activeUser.name.trim();
    }

    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw) as { name?: string; email?: string };
        if (session.email && normalizeEmail(session.email) === normalizedEmail && session.name?.trim()) {
          return session.name.trim();
        }
      }
    } catch {
      // ignore invalid session JSON
    }

    return nameFromEmail(normalizedEmail);
  }

  private async passwordMatches(user: StoredUser, password: string): Promise<boolean> {
    if (!user.passwordHash) return false;

    const trimmed = password.trim();
    const candidates = await Promise.all([
      hashPassword(trimmed),
      hashPasswordLegacy(trimmed),
      hashPassword(password),
      hashPasswordLegacy(password),
    ]);

    return candidates.includes(user.passwordHash);
  }

  public async accountExists(email: string): Promise<boolean> {
    return !!(await this.findUserByEmail(email));
  }

  public rememberEmail(email: string): void {
    try {
      localStorage.setItem(LAST_EMAIL_KEY, normalizeEmail(email));
    } catch {
      // ignore storage errors
    }
  }

  public getRememberedEmail(): string {
    try {
      return localStorage.getItem(LAST_EMAIL_KEY) ?? '';
    } catch {
      return '';
    }
  }

  public async registerUser(name: string, email: string, password: string): Promise<StoredUser> {
    validateRegistrationInput(name, email, password.trim());
    const normalizedEmail = normalizeEmail(email);
    const trimmedName = name.trim();
    const trimmedPassword = password.trim();

    if (await this.findUserByEmail(normalizedEmail)) {
      throw new Error('EMAIL_EXISTS');
    }

    const user: StoredUser = {
      email: normalizedEmail,
      name: trimmedName,
      passwordHash: await hashPassword(trimmedPassword),
      county: PILOT_REGION.county,
      createdAt: Date.now(),
      role: resolveUserRole(normalizedEmail),
    };

    await dbService.saveUser(user);
    this.rememberEmail(normalizedEmail);
    return user;
  }

  public async loginUser(email: string, password: string): Promise<StoredUser> {
    const normalizedEmail = normalizeEmail(email);
    const trimmedPassword = password.trim();

    if (!isValidEmail(normalizedEmail) || !isValidPassword(trimmedPassword)) {
      throw new Error('INVALID_CREDENTIALS');
    }

    let user = await this.findUserByEmail(normalizedEmail);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (!user.passwordHash) {
      user.passwordHash = await hashPassword(trimmedPassword);
      await dbService.saveUser(user);
      this.rememberEmail(normalizedEmail);
      return user;
    }

    if (!(await this.passwordMatches(user, password))) {
      throw new Error('WRONG_PASSWORD');
    }

    const upgradedHash = await hashPassword(trimmedPassword);
    if (user.passwordHash !== upgradedHash) {
      user.passwordHash = upgradedHash;
      await dbService.saveUser(user);
    }

    this.rememberEmail(normalizedEmail);
    return user;
  }

  public async updateProfile(
    email: string,
    updates: { name?: string; county?: string }
  ): Promise<StoredUser> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (updates.name !== undefined) {
      if (!isValidName(updates.name)) throw new Error('INVALID_INPUT');
      user.name = updates.name.trim();
    }

    if (updates.county !== undefined) {
      const county = updates.county.trim();
      if (county.length < 2 || county.length > 60) throw new Error('INVALID_INPUT');
      user.county = county;
    }

    await dbService.saveUser(user);
    return user;
  }

  public async resetPassword(email: string, newPassword: string): Promise<void> {
    const normalizedEmail = normalizeEmail(email);
    const trimmedPassword = newPassword.trim();

    if (!isValidEmail(normalizedEmail) || !isValidPassword(trimmedPassword)) {
      throw new Error('INVALID_INPUT');
    }

    let user = await this.findUserByEmail(normalizedEmail);

    if (!user) {
      user = {
        email: normalizedEmail,
        name: await this.resolveDisplayName(normalizedEmail),
        passwordHash: await hashPassword(trimmedPassword),
        county: PILOT_REGION.county,
        createdAt: Date.now(),
        role: resolveUserRole(normalizedEmail),
      };
    } else {
      user.passwordHash = await hashPassword(trimmedPassword);
    }

    await dbService.saveUser(user);
    this.rememberEmail(normalizedEmail);
  }

  public async getUserCount(): Promise<number> {
    const users = await dbService.getAllUsers();
    return users.length;
  }

  public async listUsers(): Promise<StoredUser[]> {
    const users = await dbService.getAllUsers();
    return users.sort((a, b) => a.createdAt - b.createdAt);
  }

  /** Admin: update farmer name / county. Cannot change admin email identity. */
  public async adminUpdateUser(
    email: string,
    updates: { name?: string; county?: string }
  ): Promise<StoredUser> {
    return this.updateProfile(email, updates);
  }

  /** Admin: set a new password for any account. */
  public async adminSetPassword(email: string, newPassword: string): Promise<void> {
    await this.resetPassword(email, newPassword);
  }

  /** Admin: permanently remove an account. Blocks deleting the signed-in admin. */
  public async adminDeleteUser(email: string, actingAdminEmail: string): Promise<void> {
    const normalized = normalizeEmail(email);
    const acting = normalizeEmail(actingAdminEmail);

    if (!normalized) throw new Error('USER_NOT_FOUND');
    if (normalized === acting) throw new Error('CANNOT_DELETE_SELF');

    const user = await this.findUserByEmail(normalized);
    if (!user) throw new Error('USER_NOT_FOUND');

    if (resolveUserRole(normalized) === 'admin') {
      throw new Error('CANNOT_DELETE_ADMIN');
    }

    await dbService.deleteUser(normalized);
    await dbService.deleteUser(user.email).catch(() => undefined);
  }
}

export const authService = new AuthService();
export default authService;

export { MIN_PASSWORD_LENGTH };
