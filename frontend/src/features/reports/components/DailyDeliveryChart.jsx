import { useT } from '../../../shared/i18n/useLanguage.js';

export function DailyDeliveryChart({ goal, totals, days, daily }) {
  const t = useT();
  return (
    <section className="card chart-card">
      <div className="card-head">
        <div>
          <h2>{t('Pengiriman harian')}</h2>
          <p>
            {t(goal)} {t('· total ')}
            {t(totals[1])} {t('terkirim ')}
          </p>
        </div>
      </div>
      <div className={`bar-chart ${days.length > 7 ? 'chart-month' : ''}`}>
        {days.map((day, i) => (
          <div
            key={day}
            title={t(`${day > 0 ? `${day} Okt` : `${30 + day} Sep`}: ${daily[i]} terkirim`)}
          >
            <span>
              <i
                style={{
                  height: `${(daily[i] / Math.max(1, ...daily)) * 100}%`,
                }}
              />
            </span>
            <strong>{t(daily[i])}</strong>
            <small>{t(day > 0 ? `${day}` : `${30 + day}`)}</small>
          </div>
        ))}
      </div>
      <div className="legend">
        <span>
          <i />
          {t(goal)} {t('· tanggal Sep / Okt 2026 ')}
        </span>
      </div>
    </section>
  );
}
