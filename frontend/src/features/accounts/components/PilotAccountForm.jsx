import { roles } from '../../../shared/api/users.js';

import { Button } from '../../../shared/components/Button.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';

export function PilotAccountForm({ save, busy }) {
  const t = useT();
  return (
    <form
      className="card pilot-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (await save('/users', 'POST', Object.fromEntries(new FormData(form)))) form.reset();
      }}
    >
      <h2>{t('Tambah akun')}</h2>
      <label>
        {t('Nama')}
        <input required name="name" />
      </label>
      <label>
        Email
        <input required type="email" name="email" />
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
        <input required minLength={8} type="password" autoComplete="new-password" name="password" />
      </label>
      <Button disabled={busy} type="submit">
        {t('Buat akun')}
      </Button>
    </form>
  );
}
