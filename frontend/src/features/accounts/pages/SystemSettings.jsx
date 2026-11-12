import { DemoConnectionPanel } from '../components/DemoConnectionPanel.jsx';

import { DemoAccountList } from '../components/DemoAccountList.jsx';
import { DemoAccountForm } from '../components/DemoAccountForm.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';
import { useContext, useState } from 'react';
import { AccountContext } from '../../auth/context/AccountContext.js';
import {
  demoAccounts,
  accountRoles,
  replaceDemoAccounts,
  demoPassword,
} from '../../auth/services/demoAccounts.js';
import { permissions } from '../../auth/services/access.js';
import { PageIntro } from '../../../shared/components/PageIntro.jsx';
import { STORAGE_KEYS } from '../../../shared/storage/keys.js';

export function SystemSettings() {
  const t = useT();
  const user = useContext(AccountContext);
  const [disabledAccounts, setDisabledAccounts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.disabledAccounts) || '[]');
    } catch {
      return [];
    }
  });
  const [accounts, setAccounts] = useState(demoAccounts);
  const [draft, setDraft] = useState({ name: '', email: '', role: accountRoles[0] });
  const [message, setMessage] = useState('');
  const saveAccounts = (next) => {
    try {
      localStorage.setItem(STORAGE_KEYS.demoAccounts, JSON.stringify(next));
      replaceDemoAccounts(next);
      setAccounts(next);
      setMessage('Data akun demo berhasil disimpan.');
      return true;
    } catch {
      setMessage('Data gagal disimpan. Periksa penyimpanan browser.');
      return false;
    }
  };
  const [connection, setConnection] = useState('Belum terhubung');
  if (!permissions(user).system) return null;
  const toggleAccount = (email) => {
    if (email === user?.email) return;
    const next = disabledAccounts.includes(email)
      ? disabledAccounts.filter((value) => value !== email)
      : [...disabledAccounts, email];
    try {
      localStorage.setItem(STORAGE_KEYS.disabledAccounts, JSON.stringify(next));
      setDisabledAccounts(next);
      setMessage('Status akun berhasil diperbarui.');
    } catch {
      setMessage('Status akun gagal disimpan.');
    }
  };
  return (
    <>
      <PageIntro
        eyebrow="ADMINISTRATOR SISTEM"
        title={t('Administrasi sistem')}
        subtitle="Kelola akses akun demo dan periksa kesiapan koneksi. Data pelanggan dibatasi untuk peran operasional."
      />
      <section className="card system-panel">
        <h2>{t('Akun dan hak akses')}</h2>
        <p>
          {t(
            'Administrator membuat akun, mengubah peran, dan menonaktifkan akses karyawan. Admin/CS dan Sales menggunakan satu peran operasional.',
          )}
        </p>
        <DemoAccountForm
          draft={draft}
          setMessage={setMessage}
          accounts={accounts}
          saveAccounts={saveAccounts}
          setDraft={setDraft}
        />
        <p>
          {t('Akun demo tersimpan di browser ini. Kata sandi demo: ')}
          {t(demoPassword)}
        </p>
        {message && <p role="status">{t(message)}</p>}
        <DemoAccountList
          accounts={accounts}
          user={user}
          saveAccounts={saveAccounts}
          disabledAccounts={disabledAccounts}
          toggleAccount={toggleAccount}
        />
      </section>
      <DemoConnectionPanel connection={connection} setConnection={setConnection} />
    </>
  );
}
