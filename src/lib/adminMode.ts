import { useCallback, useEffect, useState } from 'react';

const ADMIN_SESSION_KEY = 'fieldmate_admin_mode';

export function isAdminModeEnabled(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function enableAdminMode(): void {
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function disableAdminMode(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Unlock via ?admin=1 in the URL (persists for the browser session). */
export function initAdminModeFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '1') {
      enableAdminMode();
    }
  } catch {
    /* ignore */
  }
}

export function useAdminMode() {
  const [enabled, setEnabled] = useState(isAdminModeEnabled);

  useEffect(() => {
    const sync = () => setEnabled(isAdminModeEnabled());
    window.addEventListener('fieldmate-admin-mode', sync);
    return () => window.removeEventListener('fieldmate-admin-mode', sync);
  }, []);

  const unlock = useCallback(() => {
    enableAdminMode();
    setEnabled(true);
    window.dispatchEvent(new Event('fieldmate-admin-mode'));
  }, []);

  const lock = useCallback(() => {
    disableAdminMode();
    setEnabled(false);
    window.dispatchEvent(new Event('fieldmate-admin-mode'));
  }, []);

  return { enabled, unlock, lock };
}
