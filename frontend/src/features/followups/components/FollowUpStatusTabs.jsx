import { useT } from '../../../shared/i18n/useLanguage.js';

export function FollowUpStatusTabs({ customers, status, setStatus }) {
  const t = useT();
  return (
    <div className="status-tabs">
      {[
        'Semua',
        'Perlu ditinjau',
        'Menunggu balasan',
        'Ditunda',
        'Selesai',
        'Diblokir',
        ...new Set(
          customers
            .filter((c) => ['Mendatang', 'Dalam penanganan'].includes(c.status))
            .map((c) => c.status),
        ),
      ].map((s) => (
        <button key={s} className={status === s ? 'active' : ''} onClick={() => setStatus(s)}>
          {t(s)}
          <span>{t(customers.filter((c) => s === 'Semua' || c.status === s).length)}</span>
        </button>
      ))}
    </div>
  );
}
