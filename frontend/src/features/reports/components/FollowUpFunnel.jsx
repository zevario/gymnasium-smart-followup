import { useT } from '../../../shared/i18n/useLanguage.js';

import { Badge } from '../../../shared/components/Badge.jsx';

export function FollowUpFunnel({ goal, range, stages, totals }) {
  const t = useT();
  return (
    <section className="card funnel-card">
      <div className="card-head">
        <div>
          <h2>{t('Funnel tindak lanjut')}</h2>
          <p>
            {t(goal)} {t('· ')}
            {t(range)} {t('· hingga 14 Okt 2026 ')}
          </p>
        </div>
        <Badge tone="demo">{t('Data demo')}</Badge>
      </div>
      <div className="funnel">
        {stages.map((label, i) => (
          <div key={label}>
            <span>{t(label)}</span>
            <div>
              <i
                style={{
                  width: `${totals[0] ? (totals[i] / totals[0]) * 100 : 0}%`,
                }}
              />
            </div>
            <strong>{t(totals[i])}</strong>
          </div>
        ))}
      </div>
      <p className="chart-note">
        {t(
          'Riwayat demo periode terpilih, terpisah dari antrean hari ini. Pembelian terverifikasi memiliki referensi transaksi sintetis. ',
        )}
      </p>
    </section>
  );
}
