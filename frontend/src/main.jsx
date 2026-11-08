import { LanguageProvider } from "./i18n/LanguageProvider.jsx";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './assets/styles/global.css';
import './assets/styles/polish.css';
// Restore the selected appearance before the first render.
try {
    document.documentElement.dataset.theme = localStorage.getItem('gymnasyum-theme') === 'light' ? 'light' : 'dark';
}
catch {
    document.documentElement.dataset.theme = 'dark';
}
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode>
    <LanguageProvider><App /></LanguageProvider>
  </React.StrictMode>);
