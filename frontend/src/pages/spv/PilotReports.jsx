import { useEffect, useState } from 'react';
import { api } from '../../services/pilotApi.js';
import { PageIntro } from '../../components/Controls/Controls.jsx';
import { useT } from '../../i18n/useLanguage.js';

export function PilotReports() {
  const t = useT();
  const [data, setData] = useState(null),
    [error, setError] = useState('');
  useEffect(() => {
    api('/pilot/reports')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <PageIntro
        eyebrow="BINTARO"
        title={t('Laporan')}
        subtitle={t('Hasil per siklus berdasarkan transaksi yang dikonfirmasi sumber.')}
      />
      {error && <p role="alert">{error}</p>}
      {data &&
        (data.length ? (
          data.map((row) => (
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
          ))
        ) : (
          <p>{t('Belum ada siklus dalam laporan.')}</p>
        ))}
    </>
  );
}
