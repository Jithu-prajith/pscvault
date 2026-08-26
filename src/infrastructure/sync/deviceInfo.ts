import { generateUUIDv7 } from '../../lib/uuid';

let cachedDeviceId: string | null = null;

export function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const stored = localStorage.getItem('pscvault_device_id');
    if (stored) {
      cachedDeviceId = stored;
      return cachedDeviceId;
    }
  } catch {}

  let prefix = 'web';
  try {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      prefix = 'desktop';
    } else if (typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      prefix = 'phone';
    }
  } catch {}

  const shortUuid = generateUUIDv7().slice(0, 8);
  cachedDeviceId = `${prefix}-${shortUuid}`;

  try {
    localStorage.setItem('pscvault_device_id', cachedDeviceId);
  } catch {}

  return cachedDeviceId;
}
