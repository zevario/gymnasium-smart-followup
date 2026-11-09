import { useT } from '../../../shared/i18n/useLanguage.js';

export function ReportStats({ totals, goal, range }) {
  const t = useT();
  return (
    <div className="report-kpis">
      {[
        ['Follow-up terkirim', totals[1]],
        ['Balasan diterima', totals[3]],
        ['Minat tercatat', totals[4]],
        ['Pembelian terverifikasi', totals[5]],
      ].map((x) => (
        <div className="card" key={x[0]}>
          <small>{t(x[0])}</small>
          <strong>{t(x[1])}</strong>
          <span>
            {t(goal)} {t('· ')}
            {t(range)}
          </span>
        </div>
      ))}
    </div>
  );
}
