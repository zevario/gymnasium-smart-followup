import { dateTime } from '../../../shared/utils/format.js';
import { Button } from '../../../shared/components/Button.jsx';

import { useT } from '../../../shared/i18n/useLanguage.js';

export function PilotCustomerList({ filter, setFilter, people, open }) {
  const t = useT();
  return (
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
  );
}
