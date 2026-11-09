import { useState } from 'react';
import { priorityLabel } from '../../followups/services/followupRules.js';
import { DashboardFilters } from './DashboardFilters.jsx';

import { useT } from '../../../shared/i18n/useLanguage.js';

import { Icon } from '../../../shared/components/Icon.jsx';

import { Button } from '../../../shared/components/Button.jsx';
import { CustomerRow } from '../../customers/components/CustomerRow.jsx';

export function DashboardQueue({ customers, queue, onOpen }) {
  const t = useT();
  const [search, setSearch] = useState('');
  const [goal, setGoal] = useState('Semua');
  const [priority, setPriority] = useState('Semua prioritas');
  const [owner, setOwner] = useState('Semua PIC');
  const filtered = queue.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) &&
      (goal === 'Semua' || c.goal === goal) &&
      (priority === 'Semua prioritas' || priority === priorityLabel(c.score)) &&
      (owner === 'Semua PIC' || c.owner === owner),
  );
  const reset = () => {
    setSearch('');
    setGoal('Semua');
    setPriority('Semua prioritas');
    setOwner('Semua PIC');
  };

  return (
    <section className="card worklist-card">
      <div className="card-head">
        <div>
          <h2>{t('Prioritas hari ini')}</h2>
          <p>{t('Diurutkan berdasarkan skor dan tenggat')}</p>
        </div>
        <span className="count">
          {t(filtered.length)} {t('member')}
        </span>
      </div>
      <DashboardFilters
        search={search}
        setSearch={setSearch}
        goal={goal}
        setGoal={setGoal}
        priority={priority}
        setPriority={setPriority}
        owner={owner}
        setOwner={setOwner}
        customers={customers}
      />
      {filtered.length ? (
        <div className="customer-list">
          {filtered.map((c) => (
            <CustomerRow key={c.id} customer={c} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <span>
            <Icon name="check" size={24} />
          </span>
          <h3>
            {t(queue.length ? 'Tidak ada follow-up yang cocok' : 'Antrean hari ini sudah selesai')}
          </h3>
          <p>
            {t(
              queue.length
                ? 'Coba ubah pencarian atau filter.'
                : 'Tugas menunggu balasan, ditunda, dan mendatang tersedia di Semua follow-up.',
            )}
          </p>
          {queue.length > 0 && (
            <Button variant="secondary" onClick={reset}>
              {t('Atur ulang filter ')}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
