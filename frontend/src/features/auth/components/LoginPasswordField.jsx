import { Eye, EyeOff } from 'lucide-react';

export function LoginPasswordField({
  t,
  passwordInput,
  showPassword,
  password,
  setPassword,
  setShowPassword,
}) {
  return (
    <div className="form-group">
      <label htmlFor="password">{t('Kata sandi')}</label>
      <div className="password-wrapper">
        <input
          ref={passwordInput}
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder={t('Kata sandi')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button
          type="button"
          className="toggle-password"
          aria-controls="password"
          aria-label={showPassword ? t('Sembunyikan kata sandi') : t('Tampilkan kata sandi')}
          aria-pressed={showPassword}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
      </div>
    </div>
  );
}
