import './packages.css';
import { useState } from 'react';
import { PageIntro } from '../../../shared/components/PageIntro.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';
import { usePackageCatalog } from '../hooks/usePackageCatalog.js';
import { CustomerPicker } from '../components/CustomerPicker.jsx';
import { CustomerPackages } from '../components/CustomerPackages.jsx';
import { ExpiringPackages } from '../components/ExpiringPackages.jsx';

/** Halaman paket: yang mendekati kedaluwarsa, dan paket per pelanggan. */
export function Packages({ user }) {
  const t = useT();
  const { catalog, error } = usePackageCatalog();
  const [days, setDays] = useState(7);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const mayAssign = user?.roleCode === 'admin' || user?.roleCode === 'spv';

  return (
    <div className="packages-page">
      <PageIntro
        eyebrow="BINTARO"
        title={t('Paket')}
        subtitle={t('Sisa sesi, masa berlaku, dan paket yang perlu segera ditindaklanjuti.')}
      />
      {error && <p role="alert">{error}</p>}
      <ExpiringPackages days={days} setDays={setDays} />
      <div className="package-columns">
        <CustomerPicker
          search={search}
          setSearch={setSearch}
          selectedId={selected?.id}
          onSelect={setSelected}
        />
        <CustomerPackages
          key={selected?.id || 'unselected'}
          customerId={selected?.id}
          customerName={selected?.name}
          catalog={catalog}
          mayAssign={mayAssign}
        />
      </div>
    </div>
  );
}
