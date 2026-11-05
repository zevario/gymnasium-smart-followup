import { useState } from 'react';
import '../../assets/styles/login/Login.css';
import gymnasyumLogo from '../../assets/gallery/gymnasyum-logo.png';
import ThemeToggle from '../../components/ThemeToggle.jsx';

function Login({ onLogin, isDarkMode, onToggleTheme }) {
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
      <ThemeToggle
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
      />
      </div>

      <section className="login-card">
        <header className="login-header">
          Masuk ke Gymnasyum
        </header>

        <div className="login-content">
          <div className="login-welcome">
            <img
              src={gymnasyumLogo}
              alt="Gymnasyum Logo"
              className="login-logo"
            />

            <div>
              <h1>Selamat datang kembali</h1>
              <p>Silakan masuk ke akun Gymnasyum Anda.</p>
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
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Kata sandi</label>

              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Sembunyikan' : 'Lihat'}
                </button>
              </div>
            </div>

            <button type="submit" className="login-button">
              Masuk
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default Login;