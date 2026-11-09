import { useT } from '../i18n/useLanguage.js';

export function Avatar({ initials, dark = false }) {
  const t = useT();
  return <span className={`avatar ${dark ? 'avatar-dark' : ''}`}>{t(initials)}</span>;
}
