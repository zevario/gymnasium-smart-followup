import { createContext, useContext } from 'react';
import { english } from './translations.js';
export const LanguageContext = createContext(null);
export const useLanguage = () => useContext(LanguageContext);
function translateText(text) {
  const key = text.trim().replace(/\s+/g, ' ');
  const translated = english[key];
  if (translated) return text.replace(text.trim(), translated);
  return text
    .replace(/Notifikasi/g, 'Notifications')
    .replace(/Trial kemarin/g, 'Trial yesterday')
    .replace(/Trial 2 hari lalu/g, 'Trial 2 days ago')
    .replace(/Hari ini/g, 'Today')
    .replace(/Besok/g, 'Tomorrow')
    .replace(/Berakhir/g, 'Expires')
    .replace(/Okt/g, 'Oct')
    .replace(/belum dibaca/g, 'unread')
    .replace(/Mulai dari /g, 'Start with ')
    .replace(/Foto profil /g, 'Profile photo of ')
    .replace(/Berhasil masuk sebagai /g, 'Signed in as ')
    .replace(
      /Skor (\d+), tertinggi dalam antrean yang layak dihubungi\./g,
      'Score $1, highest in the eligible contact queue.',
    );
}
export function useT() {
  const { language } = useLanguage();
  return function t(value) {
    if (language !== 'en') return value;
    if (typeof value === 'string') return translateText(value);
    if (Array.isArray(value)) return value.map((item) => t(item));
    return value;
  };
}
