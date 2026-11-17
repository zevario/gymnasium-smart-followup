import { useEffect, useState } from 'react';
import { History, Download, UserRoundCheck, MessageSquare, Check, Clock3 } from 'lucide-react';
import { api } from '../../../shared/api/pilotApi.js';
import { dateTime } from '../../../shared/utils/format.js';
import { useT } from '../../../shared/i18n/useLanguage.js';
import { taskActionLabels } from '../constants/taskActionLabels.js';

const actionIcons = {
  import: Download,
  claim: UserRoundCheck,
  assign: UserRoundCheck,
  reply: MessageSquare,
  closed: Check,
  accepted: Check,
  snooze: Clock3,
};
export function PilotTaskHistory({ taskId, version }) {
  const t = useT();
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
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
  }, [taskId, version, retry]);
  return (
    <section className="task-timeline">
      <header>
        <h3>
          <History size={18} aria-hidden="true" />
          {t('Riwayat aktivitas')}
        </h3>
        {history && <span className="task-history-count">{history.length}</span>}
      </header>
      {error && (
        <p role="alert" className="task-history-message">
          {error}{' '}
          <button type="button" onClick={() => setRetry((n) => n + 1)}>
            {t('Coba lagi')}
          </button>
        </p>
      )}
      {!history && !error && (
        <p role="status" className="task-history-message">
          {t('Memuat riwayat…')}
        </p>
      )}
      {history?.length === 0 && (
        <p className="task-history-message">{t('Belum ada aktivitas pada follow-up ini.')}</p>
      )}
      <ol>
        {history?.map((entry, index) => {
          const EntryIcon = actionIcons[entry.action] || History;
          return (
            <li key={entry.id} className={index === 0 ? 'is-latest' : ''}>
              <span className="task-event-icon">
                <EntryIcon size={15} aria-hidden="true" />
              </span>
              <div className="task-event-content">
                <div className="task-event-title">
                  <strong>{t(taskActionLabels[entry.action] || entry.action)}</strong>
                  {index === 0 && <span>{t('Terbaru')}</span>}
                </div>
                <div className="task-event-meta">
                  <span>{entry.name || t('Sistem')}</span>
                  <time dateTime={entry.created_at}>{dateTime(entry.created_at)}</time>
                </div>
                {entry.note && <p>{entry.note}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
