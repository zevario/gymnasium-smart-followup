import { useT } from '../../../shared/i18n/useLanguage.js';

import { Field } from '../../../shared/components/Field.jsx';

export function DashboardFilters({
  search,
  setSearch,
  goal,
  setGoal,
  priority,
  setPriority,
  owner,
  setOwner,
  customers,
}) {
  const t = useT();
  return (
    <div className="toolbar">
      <Field
        icon="search"
        value={search}
        onChange={setSearch}
        placeholder={t('Cari nama member')}
      />
      <div className="segmented">
        {['Semua', 'Perpanjangan', 'Trial'].map((x) => (
          <button className={goal === x ? 'selected' : ''} onClick={() => setGoal(x)} key={x}>
            {t(x)}
          </button>
        ))}
      </div>
      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value={'Semua prioritas'}>{t('Semua prioritas')}</option>
        <option value={'Tinggi'}>{t('Tinggi')}</option>
        <option value={'Sedang'}>{t('Sedang')}</option>
        <option value={'Rendah'}>{t('Rendah')}</option>
      </select>
      <select value={owner} onChange={(e) => setOwner(e.target.value)}>
        <option value={'Semua PIC'}>{t('Semua PIC')}</option>
        {[...new Set(customers.map((c) => c.owner))].map((name) => (
          <option key={name} value={name}>
            {t(name)}
          </option>
        ))}
      </select>
    </div>
  );
}
