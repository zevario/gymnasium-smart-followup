import { loginMember } from '../../customers/services/memberApi.js';
import { LoginForm } from '../components/LoginForm.jsx';

import { LoginPreferences } from '../components/LoginPreferences.jsx';
import { LoginSocialLinks } from '../components/LoginSocialLinks.jsx';
import { LoginStory } from '../components/LoginStory.jsx';

import { english } from '../data/loginContent.js';

import { useLanguage } from '../../../shared/i18n/useLanguage.js';
import { useState } from 'react';
import './Login.css';
function Login({ accounts, demoPassword, authenticate, initialLoginType = 'employee' }) {
  const { language, setLanguage } = useLanguage();
  const [loginType, setLoginType] = useState(initialLoginType);
  const [isDarkMode, setDark] = useState(false);
  const t = (key) => (language === 'en' ? (english[key] ?? key) : key);
  return (
    <main className={`login-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <LoginStory t={t} />

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel-inner">
          <LoginPreferences
            language={language}
            setLanguage={setLanguage}
            t={t}
            setDark={setDark}
            isDarkMode={isDarkMode}
          />
          <div className="login-card">
            <header className="login-welcome">
              <img src="/images/gymnasyum-logo.png" alt="Gymnasyum" className="login-logo" />
              <h1 id="login-title" className="login-system-name">
                GYMNASYUM<span>SMART FOLLOW-UP SYSTEM</span>
              </h1>
            </header>
            <div className="login-account-types" role="group" aria-label={t('Jenis akun')}>
              {['customer', 'employee'].map((type) => (
                <button
                  type="button"
                  key={type}
                  aria-pressed={loginType === type}
                  onClick={() => setLoginType(type)}
                >
                  {type === 'customer' ? 'Customer' : 'Employee'}
                </button>
              ))}
            </div>
            <LoginForm
              key={loginType}
              loginType={loginType}
              accounts={accounts.filter(
                (account) => (account.role === 'Customer') === (loginType === 'customer'),
              )}
              demoPassword={demoPassword}
              authenticate={async (email, password, setError, demo) => {
                if (loginType === 'employee' || demo) {
                  await authenticate(email, password, setError, demo);
                  return;
                }
                try {
                  await loginMember(email, password);
                  location.href = '/customer';
                } catch (error) {
                  setError(error);
                }
              }}
              t={t}
            />
            {loginType === 'customer' && (
              <div className="login-customer-access">
                <span>{t('Kamu belum memiliki akun?')}</span>{' '}
                <a href="/customer?register">{t('Registrasi')}</a>
              </div>
            )}
          </div>
          <LoginSocialLinks />
          <p className="login-copyright">
            © {new Date().getFullYear()} Gymnasyum · Grup DB15-G007
          </p>
        </div>
      </section>
    </main>
  );
}
export default Login;
