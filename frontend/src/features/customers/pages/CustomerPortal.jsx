import { resendActivation } from '../../auth/services/activationDelivery.js';
import { Eye, EyeOff } from 'lucide-react';
import LanguageSwitcher from '../../../shared/components/LanguageSwitcher.jsx';
import { ThemeToggle } from '../../../shared/components/ThemeToggle.jsx';
import { useState, useEffect } from 'react';
import './customerPortal.css';

import { CustomerCenter } from './CustomerCenter.jsx';
import { sessionKey, request } from '../services/memberApi.js';
import LoginPage from '../../auth/pages/Login.jsx';
import { login as loginEmployee } from '../../../shared/api/pilotApi.js';
function AuthPreferences() {
  return (
    <div
      className="customer-preferences customer-auth-preferences"
      role="group"
      aria-label="Bahasa dan tema"
    >
      <LanguageSwitcher />
      <span aria-hidden="true" />
      <ThemeToggle />
    </div>
  );
}
function RegistrationPassword({ name, label, confirm = false }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="registration-field">
      <span className="registration-label">{label}</span>
      <span className="registration-password">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          placeholder={label}
          autoComplete="new-password"
          required
          minLength={10}
          aria-describedby={confirm ? undefined : 'registration-password-hint'}
        />
        <button
          type="button"
          aria-label={(visible ? 'Sembunyikan ' : 'Tampilkan ') + label.toLowerCase()}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
      </span>
    </label>
  );
}
export function CustomerPortal() {
  const [person, setPerson] = useState(null),
    [restoring, setRestoring] = useState(() => !!sessionStorage.getItem(sessionKey)),
    [register] = useState(() => new URLSearchParams(location.search).has('register')),
    [busy, setBusy] = useState(false),
    [registeredEmail, setRegisteredEmail] = useState(''),
    [resent, setResent] = useState(''),
    [message, setMessage] = useState('');
  const refresh = async () => setPerson(await request('me'));
  useEffect(() => {
    if (sessionStorage.getItem(sessionKey))
      request('me')
        .then(setPerson)
        .catch((e) => setMessage(e.message))
        .finally(() => setRestoring(false));
  }, []);
  async function registerAccount(event) {
    event.preventDefault();
    if (busy) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setMessage('');
    if (fields.password !== fields.confirm) {
      setMessage('Konfirmasi kata sandi harus sama dengan kata sandi.');
      return;
    }
    setBusy(true);
    try {
      await request('register', 'POST', {
        name: fields.name,
        phone: fields.phone,
        email: fields.email,
        password: fields.password,
        contact: !!fields.contact,
      });
      setRegisteredEmail(fields.email);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  if (restoring)
    return (
      <main className="customer-portal">
        <p role="status">Memuat akun customer…</p>
      </main>
    );
  if (person)
    return (
      <CustomerCenter
        person={person}
        refresh={refresh}
        commit={async (path, method, data) => {
          await request(path, method, data);
          await refresh();
        }}
        logout={async () => {
          await request('logout', 'POST');
          sessionStorage.removeItem(sessionKey);
          location.href = '/';
        }}
      />
    );
  if (register)
    return (
      <main className="customer-portal customer-registration">
        <header className="registration-topbar">
          <a href="/" className="registration-brand">
            <img src="/images/gymnasyum-logo.png" alt="" width="36" height="36" />
            <strong>Gymnasyum Bintaro</strong>
          </a>
          <AuthPreferences />
        </header>
        <section className="registration-card" aria-labelledby="registration-title">
          <header className="registration-intro">
            <h1 id="registration-title">Registrasi</h1>
            <p>Buat akun untuk mengakses layanan Gymnasyum.</p>
          </header>
          {message && (
            <p className="customer-feedback is-error" role="alert">
              {message}
            </p>
          )}
          {registeredEmail ? (
            <div className="registration-activation" role="status">
              <strong>Periksa email Anda</strong>
              <p>
                Buka tautan aktivasi di kotak masuk {registeredEmail} sebelum masuk. Periksa juga
                folder spam.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setMessage('');
                  setResent('');
                  try {
                    setResent(await resendActivation(registeredEmail));
                  } catch (error) {
                    setMessage(error.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Kirim ulang email aktivasi
              </button>
              {resent && <p>{resent}</p>}
            </div>
          ) : (
            <form className="registration-form" onSubmit={registerAccount}>
              <label className="registration-field">
                <span className="registration-label">Nama lengkap</span>
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="Nama lengkap"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </label>
              <label className="registration-field">
                <span className="registration-label">Nomor kontak (contoh +628123456789)</span>
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Nomor telepon / WhatsApp"
                  pattern={'\\+[1-9][0-9]{7,14}'}
                  required
                  aria-describedby="registration-phone-hint"
                  onInvalid={(e) =>
                    e.currentTarget.setCustomValidity(
                      'Gunakan kode negara tanpa angka 0 di depan, contoh +628123456789.',
                    )
                  }
                  onInput={(e) => e.currentTarget.setCustomValidity('')}
                />
              </label>
              <label className="registration-field registration-wide">
                <span className="registration-label">Email</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  required
                />
              </label>
              <RegistrationPassword name="password" label="Kata sandi" />
              <RegistrationPassword name="confirm" label="Konfirmasi kata sandi" confirm />
              <div className="registration-hints registration-wide">
                <p id="registration-phone-hint">
                  Gunakan kode negara untuk nomor telepon, contoh +628123456789.
                </p>
                <p id="registration-password-hint">Kata sandi minimal 10 karakter.</p>
              </div>
              <label className="registration-consent registration-wide">
                <input name="contact" type="checkbox" />
                <span>Saya bersedia menerima follow-up paket dan trial.</span>
              </label>
              <button className="registration-submit registration-wide" disabled={busy}>
                {busy ? 'Membuat akun…' : 'Buat akun'}
              </button>
            </form>
          )}
          <p className="registration-signin">
            Sudah memiliki akun? <a href="/customer">Masuk</a>
          </p>
        </section>
      </main>
    );
  return (
    <LoginPage
      initialLoginType="customer"
      authenticate={async (email, password, setError) => {
        try {
          await loginEmployee(email, password);
          location.href = '/';
        } catch (error) {
          setError(error.message);
        }
      }}
    />
  );
}
