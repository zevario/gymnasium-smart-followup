const STORAGE_SYNC_EVENT = 'gymnasyum:storage-sync';

// Memberi tahu komponen lain di tab yang sama bahwa data berubah.
export const notifyStorageChange = (key) => {
  window.dispatchEvent(
    new CustomEvent(STORAGE_SYNC_EVENT, { detail: { key } })
  );
};

// Mendengarkan perubahan dari tab yang sama maupun tab lain.
export const subscribeToStorage = (key, callback) => {
  const handleLocalChange = (event) => {
    if (event.detail?.key === key) {
      callback();
    }
  };

  const handleCrossTabChange = (event) => {
    if (event.key === key || event.key === null) {
      callback();
    }
  };

  window.addEventListener(STORAGE_SYNC_EVENT, handleLocalChange);
  window.addEventListener('storage', handleCrossTabChange);

  return () => {
    window.removeEventListener(STORAGE_SYNC_EVENT, handleLocalChange);
    window.removeEventListener('storage', handleCrossTabChange);
  };
};