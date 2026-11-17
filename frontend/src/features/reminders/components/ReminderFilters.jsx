import { useT } from '../../../shared/i18n/useLanguage.js';
import { priorityLabels, statusLabels } from '../services/reminderFormat.js';

const priorities = ['high', 'medium', 'low'];

/** Penyaring daftar pengingat: prioritas, status, dan kata kunci. */
export function ReminderFilters({ filters, setFilters }) {
  const t = useT();
  const change = (key, value) => setFilters({ ...filters, [key]: value });

  return (
    <div className="card pilot-form reminder-filters">
      <fieldset className="reminder-priority">
        <legend>{t('Prioritas')}</legend>
        <button
          type="button"
          className={filters.priority === '' ? 'active' : ''}
          aria-pressed={filters.priority === ''}
          onClick={() => change('priority', '')}
        >
          {t('Semua')}
        </button>
        {priorities.map((value) => (
          <button
            key={value}
            type="button"
            className={filters.priority === value ? 'active' : ''}
            aria-pressed={filters.priority === value}
            onClick={() => change('priority', value)}
          >
            {t(priorityLabels[value])}
          </button>
        ))}
      </fieldset>
      <div className="reminder-filter-field">
        <label htmlFor="reminder-status">{t('Status')}</label>
        <select
          id="reminder-status"
          value={filters.status}
          onChange={(event) => change('status', event.target.value)}
        >
          <option value="">{t('Semua status')}</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {t(label)}
            </option>
          ))}
        </select>
      </div>
      <div className="reminder-filter-field">
        <label htmlFor="reminder-search">{t('Cari pelanggan')}</label>
        <input
          id="reminder-search"
          type="search"
          value={filters.search}
          onChange={(event) => change('search', event.target.value)}
          placeholder={t('Nama, nomor, atau judul jadwal')}
        />
      </div>
    </div>
  );
}
