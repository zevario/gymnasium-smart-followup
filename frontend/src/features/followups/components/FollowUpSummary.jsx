import { useT } from '../../../shared/i18n/useLanguage.js';
import { Icon } from '../../../shared/components/Icon.jsx';
import { Badge } from '../../../shared/components/Badge.jsx';

import { priorityLabel, followupDelay } from '../services/followupRules.js';

export function FollowUpSummary({ customer: c, eligible }) {
  const t = useT();
  const isDimas = c.name === 'Dimas Saputra';
  return (
    <>
      <section className="detail-section">
        <div className="section-title">
          <h3>{t('Ringkasan member')}</h3>
          <Badge tone="demo">{t('Data membership')}</Badge>
        </div>
        <div className="summary-grid">
          <div>
            <small>{t('Paket target')}</small>
            <strong>{t(c.package)}</strong>
            <span>{t(c.context)}</span>
          </div>
          <div>
            <small>{t('Kunjungan terakhir')}</small>
            <strong>{t(c.goal === 'Trial' ? '13 Okt 2026' : '12 Okt 2026')}</strong>
            <span>{t(c.goal === 'Trial' ? 'Kunjungan trial' : 'Check-in demo')}</span>
          </div>
          <div>
            <small>{t('Kontak terakhir')}</small>
            <strong>{t(c.lastContact ?? '10 Okt 2026')}</strong>
            <span>
              {t(
                c.nextEligible ? `Kontak berikutnya: ${c.nextEligible}` : 'Kontak demo sebelumnya',
              )}
            </span>
          </div>
          <div>
            <small>{t('PIC')}</small>
            <strong>{t(c.owner)}</strong>
            <span>{t('Member Relations')}</span>
          </div>
        </div>
        <div className="data-source">
          <span>{t('Sumber: Data membership')}</span>
          <span>{t('Diperbarui 09.02 WIB')}</span>
        </div>
      </section>
      {!isDimas && (
        <details className="priority-explain">
          <summary>
            <span>
              <Icon name="chart" size={17} /> {t('Mengapa diprioritaskan? ')}
            </span>
            <strong>
              {t(c.score)} {t('· ')}
              {t(priorityLabel(c.score))}
              {t(' ')}
              <Icon name="chevron" size={15} />
            </strong>
          </summary>
          <div>
            <div className="score-parts">
              {[
                ['Urgensi', String(Math.min(c.score, 40))],
                ['Konteks', String(Math.max(0, c.score - 40))],
              ].map((x) => (
                <span key={x[0]}>
                  <small>{t(x[0])}</small>
                  <strong>
                    {t('+')}
                    {t(x[1])}
                  </strong>
                </span>
              ))}
            </div>
            <p>{t('Skor berbasis aturan, bukan prediksi peluang membeli.')}</p>
          </div>
        </details>
      )}
      <section className="eligibility">
        <h3>{t('Kelayakan kontak')}</h3>
        <div>
          <span>
            <Icon name={c.permission === 'Aktif' ? 'check' : 'close'} size={14} />
            {t(' ')}
            {t('Izin ')}
            {t(c.permission === 'Aktif' ? 'aktif' : 'ditarik')}
          </span>
          <span>
            <Icon name={eligible ? 'check' : 'clock'} size={14} />
            {t(' ')}
            {t(
              c.nextEligible
                ? `Jeda aktif hingga ${c.nextEligible}`
                : eligible
                  ? `Jeda ${followupDelay()} hari terpenuhi`
                  : `Kontak nonaktif · ${c.status}`,
            )}
          </span>
          <span>
            <Icon name="clock" size={14} /> {t('Jam kontak 09.00–18.00 WIB ')}
          </span>
        </div>
      </section>
    </>
  );
}
