import { useT } from '../../../shared/i18n/useLanguage.js';

export function PasswordRequirements({ rules }) {
  const t = useT();
  return (
    <aside className="password-requirements" id="password-requirements">
      <h3>{t('Persyaratan Password')}</h3>
      <p>{t('Gunakan password yang kuat dengan ketentuan berikut.')}</p>
      <ul>
        {rules.map((rule) => (
          <li key={rule.label} className={rule.valid ? 'is-valid' : ''}>
            <span aria-hidden="true">{t(rule.valid ? '✓' : '•')}</span>
            {t(rule.label)}
          </li>
        ))}
      </ul>
    </aside>
  );
}
