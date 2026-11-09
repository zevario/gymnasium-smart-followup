import { useT } from '../../../shared/i18n/useLanguage.js';

import { Icon } from '../../../shared/components/Icon.jsx';

import { Button } from '../../../shared/components/Button.jsx';

export function RecommendationCard({ recommendation, onOpen }) {
  const t = useT();
  return (
    <section className="recommendation">
      <div className="rec-label">
        <Icon name="spark" size={16} /> {t('REKOMENDASI BERIKUTNYA ')}
      </div>
      <h2>
        {t(
          recommendation
            ? `Mulai dari ${recommendation.name.split(' ')[0]}`
            : 'Semua sudah ditangani',
        )}
      </h2>
      <p>
        {t(
          recommendation
            ? `${recommendation.package} · ${recommendation.context}. Skor ${recommendation.score}, tertinggi dalam antrean yang layak dihubungi.`
            : 'Tidak ada tugas layak kontak yang jatuh tempo hari ini.',
        )}
      </p>
      {recommendation && (
        <>
          <div className="rec-facts">
            <span>
              <Icon name="calendar" size={16} />
              {t(recommendation.deadline)}
            </span>
          </div>
          <Button onClick={() => onOpen(recommendation)}>
            {t('Tinjau follow-up ')}
            <Icon name="chevron" size={16} />
          </Button>
        </>
      )}
      <small>{t('Pesan AI selalu ditinjau sebelum dikirim.')}</small>
    </section>
  );
}
