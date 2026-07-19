export type UserRole = 'farmer' | 'admin';

/** Accounts with administrator access inside the same FieldMate app. */
export const ADMIN_EMAILS: readonly string[] = ['zalphaprecious@gmail.com'];

export function resolveUserRole(email: string): UserRole {
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalized) ? 'admin' : 'farmer';
}

export function isAdminRole(role: UserRole | undefined): boolean {
  return role === 'admin';
}
