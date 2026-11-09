import { PilotAccountForm } from '../components/PilotAccountForm.jsx';
import { PilotAccountRow } from '../components/PilotAccountRow.jsx';
import { useState, useEffect } from 'react';
import { api } from '../../../shared/api/pilotApi.js';
import { PageIntro } from '../../../shared/components/PageIntro.jsx';

import { useT } from '../../../shared/i18n/useLanguage.js';

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
          <PilotAccountRow key={row.id} row={row} user={user} busy={busy} save={save} />
        ))}
      </section>
      <PilotAccountForm save={save} busy={busy} />
      <p role="status">{message}</p>
    </>
  );
}
