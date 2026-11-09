import { useT } from '../i18n/useLanguage.js';

export function Badge({ children, tone = 'neutral' }) {
  const t = useT();
  return <span className={`badge badge-${tone}`}>{t(children)}</span>;
}
