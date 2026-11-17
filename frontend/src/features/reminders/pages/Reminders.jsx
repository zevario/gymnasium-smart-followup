import '../../../shared/styles/operational-pages.css';
import { useState } from 'react';
import { PageIntro } from '../../../shared/components/PageIntro.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';
import { useReminders } from '../hooks/useReminders.js';
import { ReminderFilters } from '../components/ReminderFilters.jsx';
import { ReminderRow } from '../components/ReminderRow.jsx';

/** Daftar pengingat harian, terurut prioritas dan dapat disaring. */
export function Reminders() {
  const t = useT();
  const [filters, setFilters] = useState({ priority: '', status: '', search: '' });
  const { reminders, error } = useReminders(filters);

  return (
    <div className="reminders-page">
      <PageIntro
        eyebrow="BINTARO"
        title={t('Pengingat')}
        subtitle={t('Kandidat pengingat jadwal dan paket, terurut dari prioritas tertinggi.')}
      />
      <ReminderFilters filters={filters} setFilters={setFilters} />
      {error && <p role="alert">{error}</p>}
      {!reminders && !error && <p role="status">{t('Memuat pengingat…')}</p>}
      {reminders &&
        (reminders.length ? (
          <ul className="reminder-list">
            {reminders.map((reminder) => (
              <ReminderRow key={reminder.id} reminder={reminder} />
            ))}
          </ul>
        ) : (
          <div className="operational-empty">
            <h2>{t('Tidak ada pengingat yang cocok')}</h2>
            <p>{t('Coba ubah prioritas, status, atau kata pencarian.')}</p>
            {(filters.priority || filters.status || filters.search) && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setFilters({ priority: '', status: '', search: '' })}
              >
                {t('Reset filter')}
              </button>
            )}
          </div>
        ))}
    </div>
  );
}
