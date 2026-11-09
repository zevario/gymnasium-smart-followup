import { useT } from '../i18n/useLanguage.js';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const t = useT();
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('gymnasyum-theme', theme);
    } catch {
      /* Keep the toggle usable when storage is unavailable. */
    }
  }, [theme]);
  const label = theme === 'dark' ? 'Aktifkan light mode' : 'Aktifkan dark mode';
  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={t(label)}
      title={t(label)}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
        {theme === 'dark' ? (
          <path fill="currentColor" d="M20.9 13.3A9 9 0 0 1 10.7 3.1a9 9 0 1 0 10.2 10.2Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4.5" fill="currentColor" />
            <path
              d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </button>
  );
}
