import { useT } from '../../../shared/i18n/useLanguage.js';

export function History({ customer }) {
  const t = useT();
  const events = [
    ...(customer.history ?? []),
    `14 Okt · 09.02 — Tugas ${customer.goal.toLowerCase()} dibuat: ${customer.context}.`,
    `Data membership — ${customer.package}. PIC: ${customer.owner}.`,
  ];
  return (
    <section className="history">
      <h3>{t('Riwayat aktivitas')}</h3>
      {events.map((event, i) => (
        <div key={i}>
          <span>
            <i />
          </span>
          <p>
            <strong>{t(event)}</strong>
          </p>
        </div>
      ))}
    </section>
  );
}
