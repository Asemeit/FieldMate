/**
 * Removes stale service workers and caches on localhost.
 * Old PWA caches were serving CSS with backdrop-blur that blocked clicks in Chrome.
 */
export async function clearStaleLocalhostPwa(): Promise<void> {
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (!isLocalhost) return;

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}
