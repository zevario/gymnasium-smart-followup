import { useState } from 'react';
import { dateTime } from '../../services/pilotApi.js';
import { Button } from '../../components/Button/Button.jsx';
import { PageIntro } from '../../components/Controls/Controls.jsx';
import { useT } from '../../i18n/useLanguage.js';

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
      <section className="card pilot-form">
        <input
          type="search"
          placeholder={t('Cari nama member')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {[...people.values()]
          .filter(([p]) => p.name.toLowerCase().includes(filter.toLowerCase()))
          .map((group) => (
            <div key={group[0].personId}>
              <h3>{group[0].name}</h3>
              <p>
                {group[0].phone} · {group[0].permission}
              </p>
              {group.map((row) => (
                <Button key={row.id} variant="secondary" onClick={() => open(row)}>
                  {row.package + ' · ' + dateTime(row.dueAt)}
                </Button>
              ))}
            </div>
          ))}
        {!people.size && <p>{t('Belum ada data pelanggan.')}</p>}
      </section>
    </>
  );
}
