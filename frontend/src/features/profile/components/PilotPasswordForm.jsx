import { useState } from 'react';
import { api } from '../../../shared/api/pilotApi.js';
import { Button } from '../../../shared/components/Button.jsx';

import { useT } from '../../../shared/i18n/useLanguage.js';

export function PilotPasswordForm() {
  const t = useT();
  const [message, setMessage] = useState('');
  return (
    <form
      className="card pilot-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        try {
          await api('/users/me/password', 'PATCH', Object.fromEntries(new FormData(form)));
          form.reset();
          setMessage(t('Kata sandi diperbarui'));
        } catch (err) {
          setMessage(err.message);
        }
      }}
    >
      <h2>{t('Ubah kata sandi')}</h2>
      {[
        ['currentPassword', 'Kata sandi saat ini'],
        ['newPassword', 'Kata sandi baru'],
        ['confirmPassword', 'Konfirmasi kata sandi'],
      ].map(([name, label]) => (
        <label key={name}>
          {t(label)}
          <input
            type="password"
            required
            name={name}
            autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
          />
        </label>
      ))}
      <Button type="submit">{t('Simpan')}</Button>
      <p role="status">{message}</p>
    </form>
  );
}
