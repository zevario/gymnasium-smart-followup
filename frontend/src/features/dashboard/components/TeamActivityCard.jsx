import { useT } from '../../../shared/i18n/useLanguage.js';

import { Avatar } from '../../../shared/components/Avatar.jsx';

export function TeamActivityCard({ onAll }) {
  const t = useT();
  return (
    <section className="card mini-card">
      <div className="card-head">
        <div>
          <h2>{t('Aktivitas tim')}</h2>
          <p>{t('Hari ini')}</p>
        </div>
        <button className="text-button" onClick={onAll}>
          {t('Lihat semua ')}
        </button>
      </div>
      <div className="timeline compact">
        <div>
          <Avatar initials="AP" />
          <p>
            <strong>{t('Alya')}</strong> {t('menyelesaikan follow-up Arif ')}
            <small>{t('8 menit lalu')}</small>
          </p>
        </div>
        <div>
          <Avatar initials="FJ" />
          <p>
            <strong>{t('Fajar')}</strong> {t('mencatat balasan dari Bagas ')}
            <small>{t('26 menit lalu')}</small>
          </p>
        </div>
      </div>
    </section>
  );
}
