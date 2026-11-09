export function LoginPreferences({ language, setLanguage, t, setDark, isDarkMode }) {
  return (
    <div className="login-theme-toggle">
      <label className="language-switcher">
        <select
          aria-label="Language / Bahasa"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="en">EN</option>
          <option value="id">ID</option>
        </select>
      </label>
      <button
        type="button"
        className="theme-toggle"
        aria-label={t('Ubah tema')}
        onClick={() => setDark(!isDarkMode)}
      >
        {isDarkMode ? '☀' : '☾'}
      </button>
    </div>
  );
}
