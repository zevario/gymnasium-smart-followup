import { MemberRow } from '../components/MemberRow.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';
import { useState } from 'react';
import { PageIntro } from '../../../shared/components/PageIntro.jsx';
import { Field } from '../../../shared/components/Field.jsx';

export function Customers({ customers, onOpen }) {
  const t = useT();
  const [search, setSearch] = useState('');
  const shown = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <PageIntro
        eyebrow="DATA CONTOH"
        title={t('Pelanggan')}
        subtitle="Lihat status membership dan preferensi kontak setiap member."
      />
      <section className="card members-card">
        <div className="member-tools">
          <Field icon="search" value={search} onChange={setSearch} placeholder={t('Cari member')} />
          <span>
            {t(shown.length)} {t('member ditampilkan')}
          </span>
        </div>
        <div className="table-head">
          <span>{t('Member')}</span>
          <span>{t('Status membership')}</span>
          <span>{t('Kunjungan terakhir')}</span>
          <span>{t('Izin kontak')}</span>
          <span>{t('PIC')}</span>
          <span />
        </div>
        {shown.map((c, i) => (
          <MemberRow key={c.id} c={c} onOpen={onOpen} i={i} />
        ))}
      </section>
    </>
  );
}
