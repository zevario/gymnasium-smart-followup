import { PilotCustomerList } from '../components/PilotCustomerList.jsx';
import { useState } from 'react';

import { PageIntro } from '../../../shared/components/PageIntro.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';

export function PilotCustomers({ rows, open }) {
  const t = useT(),
    [filter, setFilter] = useState('');
  const people = new Map();
  for (const row of rows) {
    if (!people.has(row.personId)) people.set(row.personId, []);
    people.get(row.personId).push(row);
  }
  return (
    <>
      <PageIntro
        eyebrow="BINTARO"
        title={t('Pelanggan')}
        subtitle={t('Member dan siklus follow-up di lokasi ini.')}
      />
      <PilotCustomerList filter={filter} setFilter={setFilter} people={people} open={open} />
    </>
  );
}
