import { LanguageProvider } from './shared/i18n/LanguageProvider.jsx';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App.jsx';
import { STORAGE_KEYS } from './shared/storage/keys.js';
import './shared/styles/global.css';
import './shared/styles/polish.css';
// Restore the selected appearance before the first render.
try {
  document.documentElement.dataset.theme =
    localStorage.getItem(STORAGE_KEYS.theme) === 'light' ? 'light' : 'dark';
} catch {
  document.documentElement.dataset.theme = 'dark';
}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
);
