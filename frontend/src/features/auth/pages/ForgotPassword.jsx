import { useState } from 'react';
import { ThemeToggle } from '../../../shared/components/ThemeToggle.jsx';
import LanguageSwitcher from '../../../shared/components/LanguageSwitcher.jsx';
import { useLanguage } from '../../../shared/i18n/useLanguage.js';
import './ForgotPassword.css';

const titles = {
  forgot: ['Lupa Password', 'Forgot Password'],
  reset: ['Buat kata sandi baru', 'Set a new password'],
  activate: ['Konfirmasi email', 'Confirm your email'],
  resend: ['Kirim ulang aktivasi', 'Resend activation email'],
};

export function ForgotPassword() {
  const { language } = useLanguage();
  const en = language === 'en';
  const [token] = useState(() => location.hash.slice(1));
  const activation = location.pathname === '/activate-email';
  const mode = activation
    ? token
      ? 'activate'
      : 'resend'
    : location.pathname === '/reset-password'
      ? 'reset'
      : 'forgot';
  const customer = activation || new URLSearchParams(location.search).get('account') === 'customer';
  const account = customer ? 'customer' : 'employee';
  const loginUrl = customer ? '/customer' : '/';
  const [busy, setBusy] = useState(false);
  const [waitingForSender, setWaitingForSender] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(mode === 'reset' && !token);
  const instructions = {
    forgot: en
      ? 'Enter your account email to request a password reset.'
      : 'Masukkan email akun Anda untuk menerima tautan reset password.',
    reset: customer
      ? en
        ? 'Use at least 10 characters.'
        : 'Gunakan minimal 10 karakter.'
      : en
        ? 'Use at least 8 characters, including uppercase and lowercase letters.'
        : 'Gunakan minimal 8 karakter, dengan huruf besar dan kecil.',
    activate: en
      ? 'Confirm that this email address belongs to your Gymnasyum account.'
      : 'Konfirmasikan bahwa alamat email ini milik akun Gymnasyum Anda.',
    resend: en
      ? 'Enter the email address you registered with.'
      : 'Masukkan alamat email yang Anda gunakan saat registrasi.',
  };
  const success = {
    forgot: en
      ? 'If your account is active, check your inbox and spam folder for the reset link.'
      : 'Jika akun Anda aktif, periksa kotak masuk dan folder spam untuk tautan reset password.',
    reset: en
      ? 'Your password has been updated. You can now sign in with your new password.'
      : 'Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.',
    activate: en
      ? 'Your email is confirmed. You can now sign in as a Customer.'
      : 'Email berhasil dikonfirmasi. Anda sekarang dapat masuk sebagai Customer.',
    resend: en
      ? 'If your account is awaiting activation, check your inbox and spam folder.'
      : 'Jika akun Anda menunggu aktivasi, periksa kotak masuk dan folder spam.',
  };
  const buttons = {
    forgot: 'Reset Password',
    reset: en ? 'Save new password' : 'Simpan kata sandi baru',
    activate: en ? 'Confirm email' : 'Konfirmasi email',
    resend: en ? 'Send activation link' : 'Kirim tautan aktivasi',
  };
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const { email, password, confirm } = Object.fromEntries(new FormData(event.currentTarget));
    setError('');
    if (mode === 'reset' && password !== confirm) {
      setError(en ? 'The passwords must match.' : 'Konfirmasi kata sandi belum cocok.');
      return;
    }
    const actions = {
      forgot: ['forgot-password', { account, email }],
      resend: ['resend-activation', { email }],
      reset: ['reset-password', { account, token, password }],
      activate: ['activate-email', { token }],
    };
    const [endpoint, body] = actions[mode];
    setBusy(true);
    try {
      const response = await fetch('/api/auth/' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await response.json();
      if (!response.ok) {
        if (response.status === 410) setInvalid(true);
        else setError(json.message);
        return;
      }
      if (token) history.replaceState(null, '', location.pathname + location.search);
      setWaitingForSender(json.delivery === 'waiting-for-sender');
      setDone(true);
    } catch {
      setError(
        en
          ? 'Unable to reach the service. Please try again.'
          : 'Layanan belum dapat dihubungi. Silakan coba lagi.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="forgot-password-page">
      <header className="forgot-password-header">
        <a href={loginUrl} className="forgot-password-brand">
          <img src="/images/gymnasyum-logo.png" alt="" width="32" height="32" />
          <strong>Gymnasyum Bintaro</strong>
        </a>
        <div className="forgot-password-preferences">
          <LanguageSwitcher />
          <span aria-hidden="true" />
          <ThemeToggle />
        </div>
      </header>
      <section className="forgot-password-card" aria-labelledby="forgot-password-title">
        <h1 id="forgot-password-title">{titles[mode][en ? 1 : 0]}</h1>
        {invalid ? (
          <div className="forgot-password-support" role="alert">
            <p>
              {en ? 'This link is no longer valid.' : 'Tautan sudah kedaluwarsa atau tidak valid.'}
            </p>
            <a href={activation ? '/activate-email' : '/forgot-password?account=' + account}>
              {en ? 'Request a new link' : 'Minta tautan baru'}
            </a>
          </div>
        ) : done ? (
          <p className="forgot-password-support" role="status">
            {waitingForSender
              ? en
                ? 'The email sender is not connected yet. If your account is awaiting activation, your request is queued.'
                : 'Pengirim email belum tersambung. Jika akun Anda menunggu aktivasi, permintaan Anda masuk antrean.'
              : success[mode]}
          </p>
        ) : (
          <>
            <p>{instructions[mode]}</p>
            <form onSubmit={submit}>
              {(mode === 'forgot' || mode === 'resend') && (
                <label className="forgot-password-email">
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    required
                    maxLength={254}
                  />
                </label>
              )}
              {mode === 'reset' &&
                [
                  ['password', en ? 'New password' : 'Kata sandi baru'],
                  ['confirm', en ? 'Confirm new password' : 'Konfirmasi kata sandi baru'],
                ].map(([name, label]) => (
                  <label className="forgot-password-email" key={name}>
                    <span>{label}</span>
                    <input
                      name={name}
                      placeholder={label}
                      autoComplete="new-password"
                      type="password"
                      minLength={customer ? 10 : 8}
                      maxLength={72}
                      required
                    />
                  </label>
                ))}
              {error && <p role="alert">{error}</p>}
              <button type="submit" disabled={busy}>
                {busy ? (en ? 'Processing…' : 'Memproses…') : buttons[mode]}
              </button>
            </form>
          </>
        )}
        <a className="forgot-password-back" href={loginUrl}>
          {en ? 'Back to sign in' : 'Kembali ke login'}
        </a>
      </section>
    </main>
  );
}
