import { useT } from '../../../shared/i18n/useLanguage.js';

import { Icon } from '../../../shared/components/Icon.jsx';

export function DashboardStats({ queue, customers, live }) {
  const t = useT();
  return (
    <section className="kpi-grid">
      {[
        ['Perlu ditindaklanjuti', queue.length, 'Tugas aktif hari ini'],
        ['Prioritas tinggi', queue.filter((c) => c.score >= 70).length, 'Skor 70 atau lebih'],
        [
          'Menunggu balasan',
          customers.filter((c) => c.status === 'Menunggu balasan').length,
          live ? 'Dalam antrean lokasi' : 'Dalam data demo',
        ],
        ['Selesai', customers.filter((c) => c.status === 'Selesai').length, 'Oleh seluruh tim'],
      ].map((x, i) => (
        <article className="kpi" key={x[0]}>
          <span className={`kpi-icon kpi-${i}`}>
            <Icon name={i === 0 ? 'list' : i === 1 ? 'spark' : i === 2 ? 'clock' : 'check'} />
          </span>
          <div>
            <small>{t(x[0])}</small>
            <strong>{t(x[1])}</strong>
            <p>{t(x[2])}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
