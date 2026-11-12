import { useEffect, useState } from 'react';
import { LanguageContext } from './useLanguage.js';
import { STORAGE_KEYS } from '../storage/keys.js';

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.language) === 'en' ? 'en' : 'id';
    } catch {
      return 'id';
    }
  });
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEYS.language, language);
    } catch {
      /* Keep the selection for this session. */
    }
  }, [language]);
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
