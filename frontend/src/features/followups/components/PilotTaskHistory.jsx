import { useEffect, useState } from 'react';
import { api } from '../../../shared/api/pilotApi.js';
import { dateTime } from '../../../shared/utils/format.js';
import { useT } from '../../../shared/i18n/useLanguage.js';
import { taskActionLabels } from '../constants/taskActionLabels.js';

export function PilotTaskHistory({ taskId, version }) {
  const t = useT();
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api('/pilot/tasks/' + taskId + '/history')
      .then((rows) => {
        if (active) {
          setHistory(rows);
          setError('');
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [taskId, version]);
  return (
    <>
      {error && <p role="alert">{error}</p>}
      <section className="history">
        <h3>{t('Riwayat aktivitas')}</h3>
        {history.map((entry) => (
          <p key={entry.id}>
            <strong>{t(taskActionLabels[entry.action] || entry.action)}</strong> · {entry.name} ·{' '}
            {dateTime(entry.created_at)}
            <br />
            {entry.note}
          </p>
        ))}
      </section>
    </>
  );
}
