import { StoredUser } from '../types';
import { dbService } from './db';
import { PILOT_REGION } from '../config/pilotRegion';
import {
  PILOT_FARMER_NAMES,
  PILOT_FARMER_PASSWORD,
  pilotFarmerEmail,
} from '../data/pilotFarmers';

const PASSWORD_SALT = 'FieldMate-UasinGishu-2025';

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(PASSWORD_SALT + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export type SeedResult = {
  created: number;
  skipped: number;
  total: number;
};

const LEGACY_PILOT_EMAIL = /^farmer\d+@fieldmate\.local$/i;

/** Create 50 pilot farmer accounts in IndexedDB (skips emails that already exist). */
export async function seedPilotFarmers(count = 50): Promise<SeedResult> {
  const passwordHash = await hashPassword(PILOT_FARMER_PASSWORD);
  const existing = await dbService.getAllUsers();

  for (const user of existing) {
    if (LEGACY_PILOT_EMAIL.test(user.email)) {
      await dbService.deleteUser(user.email);
    }
  }

  const refreshed = await dbService.getAllUsers();
  const existingEmails = new Set(refreshed.map((u) => u.email.toLowerCase()));

  let created = 0;
  let skipped = 0;
  const baseTime = Date.now() - count * 86_400_000;

  for (let i = 1; i <= count; i += 1) {
    const email = pilotFarmerEmail(i).toLowerCase();
    if (existingEmails.has(email)) {
      skipped += 1;
      continue;
    }

    const user: StoredUser = {
      email,
      name: PILOT_FARMER_NAMES[i - 1] ?? `Farmer ${i}`,
      passwordHash,
      county: PILOT_REGION.county,
      createdAt: baseTime + i * 86_400_000,
      role: 'farmer',
    };

    await dbService.saveUser(user);
    existingEmails.add(email);
    created += 1;
  }

  const total = (await dbService.getAllUsers()).length;
  return { created, skipped, total };
}

export { PILOT_FARMER_PASSWORD };
