// Browser storage keys used across the app. Keep the string values stable:
// changing one would silently discard data users already saved in their browser.
export const STORAGE_KEYS = {
  theme: 'gymnasyum-theme',
  language: 'gymnasyum-language',
  pilotSession: 'gymnasyum-pilot-session',
};

// Per-account notification preferences.
export const notificationsReadStorageKey = (email) => `gymnasyum-notifications-read:${email}`;
