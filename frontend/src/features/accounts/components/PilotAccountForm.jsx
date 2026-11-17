import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { roles } from '../../../shared/api/users.js';

import { Button } from '../../../shared/components/Button.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';

export function PilotAccountForm({ save, busy }) {
  const t = useT();
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form
      className="card pilot-form staff-account-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (await save('/users', 'POST', Object.fromEntries(new FormData(form)))) form.reset();
      }}
    >
      <header>
        <h2>{t('Tambah akun')}</h2>
        <p>{t('Isi identitas dan tentukan peran karyawan.')}</p>
      </header>
      <label>
        {t('Nama')}
        <input required name="name" autoComplete="name" placeholder={t('Nama lengkap')} />
      </label>
      <label>
        Email
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          placeholder="nama@email.com"
        />
      </label>
      <label>
        {t('Peran')}
        <select name="role">
          {Object.entries(roles).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t('Kata sandi awal')}
        <span className="staff-account-password">
          <input
            required
            minLength={8}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            name="password"
            aria-describedby="staff-password-hint"
          />
          <button
            type="button"
            aria-label={t(showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi')}
            aria-pressed={showPassword}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
        <small id="staff-password-hint">{t('Minimal 8 karakter.')}</small>
      </label>
      <div className="staff-account-form-footer">
        <Button disabled={busy} type="submit">
          {t(busy ? 'Menyimpan…' : 'Buat akun')}
        </Button>
      </div>
    </form>
  );
}
