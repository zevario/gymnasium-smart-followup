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
          placeholder={t('Masukkan kata sandi Anda')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button
          type="button"
          className="toggle-password"
          aria-controls="password"
          aria-pressed={showPassword}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? t('Sembunyikan') : t('Lihat')}
        </button>
      </div>
    </div>
  );
}
