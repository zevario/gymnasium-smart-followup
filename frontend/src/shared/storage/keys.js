// Browser storage keys used across the app. Keep the string values stable:
// changing one would silently discard data users already saved in their browser.
export const STORAGE_KEYS = {
  theme: 'gymnasyum-theme',
  language: 'gymnasyum-language',
  pilotSession: 'gymnasyum-pilot-session',
  demoLogin: 'gymnasyum-demo-login',
  demoAccounts: 'gymnasyum-demo-accounts-v2',
  disabledAccounts: 'gymnasyum-disabled-accounts',
  followupDays: 'gymnasyum-followup-days',
};

// Per-account keys for the local demo workspace.
export const accountStorageKey = (email) => `gymnasyum-account-v1:${email}`;
export const profilePhotoStorageKey = (email) => `gymnasyum-profile-photo-v1:${email}`;
export const notificationsReadStorageKey = (email) => `gymnasyum-notifications-read:${email}`;
