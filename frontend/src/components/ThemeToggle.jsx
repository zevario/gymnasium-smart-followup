import '../assets/styles/ThemeToggle.css';
import { Sun, Moon } from 'lucide-react';

function ThemeToggle({ isDarkMode, onToggleTheme }) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggleTheme}
      aria-label="Toggle theme"
      title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
    >
      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

export default ThemeToggle;