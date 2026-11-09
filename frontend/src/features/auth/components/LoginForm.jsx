import { useLoginForm } from '../hooks/useLoginForm.js';
import { LoginPasswordField } from './LoginPasswordField.jsx';
import { LoginEmailPicker } from './LoginEmailPicker.jsx';

import { whatsapp } from '../data/loginContent.js';

export function LoginForm({ accounts, demoPassword, authenticate, t }) {
  const {
    email,
    password,
    setPassword,
    passwordInput,
    showAccounts,
    setShowAccounts,
    showPassword,
    setShowPassword,
    busy,
    errorMessage,
    changeEmail,
    selectDemoAccount,
    submit,
  } = useLoginForm(authenticate, demoPassword);
  return (
    <form onSubmit={submit}>
      <LoginEmailPicker
        accounts={accounts}
        email={email}
        onEmailChange={changeEmail}
        showAccounts={showAccounts}
        setShowAccounts={setShowAccounts}
        onSelectAccount={selectDemoAccount}
        t={t}
      />
      <LoginPasswordField
        t={t}
        passwordInput={passwordInput}
        showPassword={showPassword}
        password={password}
        setPassword={setPassword}
        setShowPassword={setShowPassword}
      />
      <div className="login-help">
        <span>{t('Tidak bisa masuk?')}</span>
        <a href={whatsapp} target="_blank" rel="noreferrer">
          {t('Hubungi tim Gymnasyum')}
          <svg
            aria-hidden="true"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M7 17 17 7 M7 7h10v10" />
          </svg>
        </a>
      </div>
      {errorMessage && (
        <p className="login-error" role="alert">
          {t(errorMessage)}
        </p>
      )}
      <button type="submit" disabled={busy} className="login-button">
        {t('Masuk')}
      </button>
    </form>
  );
}
