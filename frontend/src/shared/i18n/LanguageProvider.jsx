import { useEffect, useState } from 'react';
import { LanguageContext } from './useLanguage.js';

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('gymnasyum-language') === 'en' ? 'en' : 'id';
    } catch {
      return 'id';
    }
  });
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem('gymnasyum-language', language);
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
