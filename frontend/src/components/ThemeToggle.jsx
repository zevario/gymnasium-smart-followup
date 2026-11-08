import '../assets/styles/ThemeToggle.css';
import { Sun, Moon } from 'lucide-react';
import useI18n from '../i18n/useI18n.js';

function ThemeToggle({ isDarkMode, onToggleTheme }) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggleTheme}
      aria-label={t('Toggle theme')}
      title={isDarkMode ? t('Light Mode') : t('Dark Mode')}
    >
      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

export default ThemeToggle;