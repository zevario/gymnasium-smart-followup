import { useT } from '../i18n/useLanguage.js';

export function PageIntro({ eyebrow, title, subtitle, right }) {
  const t = useT();
  return (
    <div className="page-intro">
      <div>
        {eyebrow && <p className="eyebrow">{t(eyebrow)}</p>}
        <h1>{t(title)}</h1>
        <p>{t(subtitle)}</p>
      </div>
      {t(right)}
    </div>
  );
}
