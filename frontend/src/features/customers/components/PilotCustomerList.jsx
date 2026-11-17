import './memberManagement.css';
import { dateTime } from '../../../shared/utils/format.js';
import { Button } from '../../../shared/components/Button.jsx';

import { useT } from '../../../shared/i18n/useLanguage.js';

export function PilotCustomerList({ filter, setFilter, people, open }) {
  const t = useT();
  const groups = [...people.values()].filter(([p]) =>
    p.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );
  return (
    <section className="card pilot-form staff-member-list">
      <header>
        <h2>Daftar member</h2>
        <span>{groups.length} pelanggan</span>
      </header>
      <label className="staff-member-search">
        Cari member
        <input
          type="search"
          placeholder={t('Cari nama member')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </label>
      <div className="staff-member-grid">
        {groups.map((group) => (
          <article className="staff-member-card" key={group[0].personId}>
            <h3>{group[0].name}</h3>
            <p>
              {group[0].phone} · {group[0].permission}
            </p>
            <div className="staff-member-schedules">
              {group.map((row) => (
                <Button key={row.id} variant="secondary" onClick={() => open(row)}>
                  {row.package + ' · ' + dateTime(row.dueAt)}
                </Button>
              ))}
            </div>
          </article>
        ))}
      </div>
      {!!people.size && !groups.length && (
        <p className="inbox-empty">{t('Tidak ada member yang cocok dengan pencarian.')}</p>
      )}
      {!people.size && <p>{t('Belum ada data pelanggan.')}</p>}
    </section>
  );
}
