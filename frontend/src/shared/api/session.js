import { STORAGE_KEYS } from '../storage/keys.js';

// Pilot API tokens live in sessionStorage so they end with the browser tab.
const key = STORAGE_KEYS.pilotSession;

export const readSession = () => JSON.parse(sessionStorage.getItem(key) || 'null');
export const hasSession = () => !!sessionStorage.getItem(key);
export const saveSession = (data) =>
  sessionStorage.setItem(
    key,
    JSON.stringify({ accessToken: data.accessToken, refreshToken: data.refreshToken }),
  );
export const clearSession = () => sessionStorage.removeItem(key);
