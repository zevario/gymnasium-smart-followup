import useI18n from '../i18n/useI18n.js';

function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="language-switcher">
      <select
        aria-label={t('Bahasa')}
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
      >
        <option value="id">ID</option>
        <option value="en">EN</option>
      </select>
    </div>
  );
}

export default LanguageSwitcher;
