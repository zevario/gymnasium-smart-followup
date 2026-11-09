import { PilotReportCard } from '../components/PilotReportCard.jsx';
import { useEffect, useState } from 'react';
import { api } from '../../../shared/api/pilotApi.js';
import { PageIntro } from '../../../shared/components/PageIntro.jsx';
import { useT } from '../../../shared/i18n/useLanguage.js';

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
          data.map((row) => <PilotReportCard key={row.goal} row={row} />)
        ) : (
          <p>{t('Belum ada siklus dalam laporan.')}</p>
        ))}
    </>
  );
}
