import { useT } from '../../../shared/i18n/useLanguage.js';

export function PilotReportCard({ row }) {
  const t = useT();
  return (
    <section className="card pilot-form" key={row.goal}>
      <h2>{t(row.goal === 'trial' ? 'Trial' : 'Perpanjangan')}</h2>
      <p>
        {t('Siklus dimulai')} · {row.opened}
      </p>
      <p>
        {t('Pernah dihubungi')} · {row.contacted}
      </p>
      <p>
        {t('Konversi kohort matang')} · {row.converted} / {row.mature}{' '}
        {row.mature > 0 && '(' + Math.round((row.converted / row.mature) * 100) + '%)'}
      </p>
    </section>
  );
}
