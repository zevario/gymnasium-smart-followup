import { useState, useEffect } from 'react';
import { api, roles } from '../../services/pilotApi.js';
import { PageIntro } from '../../components/Controls/Controls.jsx';
import { Button } from '../../components/Button/Button.jsx';
import { useT } from '../../i18n/useLanguage.js';

export function PilotAccounts({ user }) {
  const t = useT(),
    [rows, setRows] = useState([]),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const load = () => api('/users').then(setRows);
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);
  async function save(path, method, body) {
    setBusy(true);
    setMessage('');
    try {
      await api(path, method, body);
      await load();
      setMessage(t('Tersimpan'));
      return true;
    } catch (e) {
      setMessage(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageIntro
        eyebrow="GYMNASYUM"
        title={t('Akun karyawan')}
        subtitle={t('Kelola akses ke ruang kerja Bintaro.')}
      />
      <section className="card pilot-form">
        {rows.map((row) => (
          <div className="pilot-account" key={row.id}>
            <div>
              <strong>{row.name}</strong>
              <p>{row.email}</p>
            </div>
            <select
              aria-label={t('Peran') + ' ' + row.name}
              value={row.role}
              disabled={row.id === user.id || busy}
              onChange={(e) => save('/users/' + row.id, 'PUT', { role: e.target.value })}
            >
              {Object.entries(roles).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              disabled={row.id === user.id || busy}
              onClick={() => save('/users/' + row.id, 'PUT', { is_active: !row.is_active })}
            >
              {t(row.is_active ? 'Nonaktifkan' : 'Aktifkan')}
            </Button>
          </div>
        ))}
      </section>
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
          <input
            required
            minLength={8}
            type="password"
            autoComplete="new-password"
            name="password"
          />
        </label>
        <Button disabled={busy} type="submit">
          {t('Buat akun')}
        </Button>
      </form>
      <p role="status">{message}</p>
    </>
  );
}
