import './accounts.css';
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
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [failed, setFailed] = useState(false);
  const load = () => api('/users').then(setRows);
  useEffect(() => {
    load().catch((e) => { setFailed(true); setMessage(e.message); }).finally(() => setLoading(false));
  }, []);
  async function save(path, method, body) {
    setBusy(true);
    setMessage('');
    setFailed(false);
    try {
      await api(path, method, body);
      await load();
      setMessage(t('Tersimpan'));
      return true;
    } catch (e) {
      setFailed(true);
      setMessage(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="staff-accounts-page">
      <PageIntro
        eyebrow="GYMNASYUM"
        title={t('Akun karyawan')}
        subtitle={t('Kelola akses ke ruang kerja Bintaro.')}
      />
      <section className="card pilot-form staff-accounts-list">
        <header><h2>{t('Daftar akun')}</h2><span>{rows.length} {t('akun')}</span></header>
        {loading && <p role="status">{t('Memuat akun…')}</p>}
        {!loading && !failed && !rows.length && <p>{t('Belum ada akun karyawan.')}</p>}
        {rows.map((row) => (
          <PilotAccountRow key={row.id} row={row} user={user} busy={busy} save={save} />
        ))}
      </section>
      <PilotAccountForm save={save} busy={busy} />
      {message && <p className={'account-feedback' + (failed ? ' is-error' : '')} role={failed ? 'alert' : 'status'}>{message}</p>}
    </div>
  );
}
