import { useState } from 'react';
import '../../assets/styles/login/Login.css';
import gymnasyumLogo from '../../assets/gallery/gymnasyum-logo.png';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import LanguageSwitcher from '../../components/LanguageSwitcher.jsx';
import useI18n from '../../i18n/useI18n.js';

function Login({ onLogin,
  isDarkMode,
  onToggleTheme,
  isLoading = false,
  errorMessage = ''
}) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin({ email, password });
  };

  return (
    <main className={`login-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="login-theme-toggle">
        <LanguageSwitcher />
        <ThemeToggle isDarkMode={isDarkMode} onToggleTheme={onToggleTheme} />
      </div>

      <section className="login-card">
        <header className="login-header">
          {t('Masuk ke Gymnasyum')}
        </header>

        <div className="login-content">
          <div className="login-welcome">
            <img
              src={gymnasyumLogo}
              alt="Gymnasyum Logo"
              className="login-logo"
            />

            <div>
              <h1>{t('Selamat datang kembali')}</h1>
              <p>{t('Silakan masuk ke akun Gymnasyum Anda.')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="nama@gymnasyum.id"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('Kata sandi')}</label>

              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={isLoading}
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? t('Sembunyikan') : t('Lihat')}
                </button>
              </div>
            </div>

            {errorMessage && (
              <p className="login-error" role="alert">
                {t(errorMessage)}
              </p>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? t('Memproses...') : t('Masuk')}
            </button>

          </form>
        </div>
      </section>
    </main>
  );
}

export default Login;