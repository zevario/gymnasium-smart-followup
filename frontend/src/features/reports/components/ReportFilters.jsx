import { useT } from '../../../shared/i18n/useLanguage.js';

export function ReportFilters({ goal, setGoal, range, setRange }) {
  const t = useT();
  return (
    <div className="report-filters">
      <select
        aria-label={t('Tujuan laporan')}
        className="date-select"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
      >
        <option value={'Perpanjangan'}>{t('Perpanjangan')}</option>
        <option value={'Trial'}>{t('Trial')}</option>
      </select>
      <select
        aria-label={t('Periode laporan')}
        className="date-select"
        value={range}
        onChange={(e) => setRange(e.target.value)}
      >
        <option value={'7 hari terakhir'}>{t('7 hari terakhir')}</option>
        <option value={'30 hari terakhir'}>{t('30 hari terakhir')}</option>
      </select>
    </div>
  );
}
