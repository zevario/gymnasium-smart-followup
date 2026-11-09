import { FollowUpFilters } from '../components/FollowUpFilters.jsx';
import { FollowUpStatusTabs } from '../components/FollowUpStatusTabs.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';
import { useState } from 'react';
import { PageIntro } from '../../../shared/components/PageIntro.jsx';

import { Icon } from '../../../shared/components/Icon.jsx';
import { CustomerRow } from '../../customers/components/CustomerRow.jsx';

export function AllFollowups({ customers, onOpen }) {
  const t = useT();
  const [status, setStatus] = useState('Semua');
  const [goal, setGoal] = useState('Semua tujuan');
  const [owner, setOwner] = useState('Semua PIC');
  const [search, setSearch] = useState('');
  const filtered = customers.filter(
    (c) =>
      (status === 'Semua' || c.status === status) &&
      `${c.name} ${c.package}`.toLowerCase().includes(search.toLowerCase()) &&
      (goal === 'Semua tujuan' || c.goal === goal) &&
      (owner === 'Semua PIC' || c.owner === owner),
  );
  return (
    <>
      <PageIntro
        eyebrow="SMART FOLLOW-UP"
        title={t('Semua follow-up')}
        subtitle="Kelola seluruh tindak lanjut member dari satu tempat."
      />
      <section className="card full-list">
        <FollowUpStatusTabs customers={customers} status={status} setStatus={setStatus} />
        <FollowUpFilters
          search={search}
          setSearch={setSearch}
          goal={goal}
          setGoal={setGoal}
          owner={owner}
          setOwner={setOwner}
          customers={customers}
        />
        {status === 'Diblokir' && (
          <div className="info-banner">
            <span>{t('i')}</span>
            <p>
              <strong>{t('Pengiriman dinonaktifkan untuk tugas diblokir.')}</strong>
              {t(' ')}
              {t('Tinjau alasan pembatasan pada detail member sebelum mengambil tindakan. ')}
            </p>
          </div>
        )}
        <div className="customer-list">
          {filtered.map((c) => (
            <CustomerRow key={c.id} customer={c} onOpen={onOpen} />
          ))}
        </div>
        {!filtered.length && (
          <div className="empty">
            <span>
              <Icon name="check" />
            </span>
            <h3>{t('Tidak ada tugas dalam status ini')}</h3>
            <p>{t('Perubahan status akan langsung muncul di daftar.')}</p>
          </div>
        )}
      </section>
    </>
  );
}
