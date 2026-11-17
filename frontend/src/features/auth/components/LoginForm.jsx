import { useLoginForm } from '../hooks/useLoginForm.js';
import { LoginPasswordField } from './LoginPasswordField.jsx';
import { LoginEmailPicker } from './LoginEmailPicker.jsx';

export function LoginForm({ authenticate, t, loginType }) {
  const {
    email,
    password,
    setPassword,
    passwordInput,
    showPassword,
    setShowPassword,
    busy,
    errorMessage,
    changeEmail,
    submit,
  } = useLoginForm(authenticate);
  return (
    <form onSubmit={submit}>
      <LoginEmailPicker email={email} onEmailChange={changeEmail} t={t} />
      <LoginPasswordField
        t={t}
        passwordInput={passwordInput}
        showPassword={showPassword}
        password={password}
        setPassword={setPassword}
        setShowPassword={setShowPassword}
      />
      <div className="login-help">
        <a href={'/forgot-password?account=' + loginType}>{t('Lupa password')}</a>
      </div>
      {errorMessage && (
        <p className="login-error" role="alert">
          {t(errorMessage.message || errorMessage)}
          {errorMessage.code === 'EMAIL_ACTIVATION_REQUIRED' && (
            <>
              {' '}
              <a href="/activate-email">{t('Kirim ulang email aktivasi')}</a>
            </>
          )}
        </p>
      )}
      <button type="submit" disabled={busy} className="login-button">
        {t('Masuk')}
      </button>
    </form>
  );
}
