import { useT } from '../../../shared/i18n/useLanguage.js';

export function PilotReportCard({ row }) {
  const t = useT();
  return (
    <section className="card pilot-form" key={row.goal}>
      <h2>{t(row.goal === 'trial' ? 'Trial' : 'Perpanjangan')}</h2>
      <dl className="report-metrics">
        <div>
          <dt>{t('Siklus dimulai')}</dt>
          <dd>{row.opened}</dd>
        </div>
        <div>
          <dt>{t('Pernah dihubungi')}</dt>
          <dd>{row.contacted}</dd>
        </div>
        <div>
          <dt>{t('Konversi kohort matang')}</dt>
          <dd>
            {row.converted} <small>/ {row.mature}</small>
          </dd>
        </div>
      </dl>
      <p className="report-conversion-note">
        {row.mature > 0
          ? Math.round((row.converted / row.mature) * 100) + '% ' + t('konversi kohort matang')
          : t('Belum ada kohort matang untuk menghitung tingkat konversi.')}
      </p>
    </section>
  );
}
