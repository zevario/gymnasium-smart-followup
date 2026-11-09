import { useT } from '../../../shared/i18n/useLanguage.js';

import { Field } from '../../../shared/components/Field.jsx';

export function FollowUpFilters({ search, setSearch, goal, setGoal, owner, setOwner, customers }) {
  const t = useT();
  return (
    <div className="list-tools">
      <Field
        icon="search"
        value={search}
        onChange={setSearch}
        placeholder={t('Cari nama atau paket')}
      />
      <select value={goal} onChange={(e) => setGoal(e.target.value)}>
        <option value={'Semua tujuan'}>{t('Semua tujuan')}</option>
        <option value={'Perpanjangan'}>{t('Perpanjangan')}</option>
        <option value={'Trial'}>{t('Trial')}</option>
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
