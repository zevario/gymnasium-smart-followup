import { useT } from '../../../shared/i18n/useLanguage.js';

import { Avatar } from '../../../shared/components/Avatar.jsx';

import { dateTime } from '../../../shared/api/pilotApi.js';

export function PilotTaskSummary({ task }) {
  const t = useT();
  return (
    <>
      <div className="customer-hero">
        <Avatar initials={task.initials} />
        <div>
          <h2>{task.name}</h2>
          <p>
            {task.package} · {t(task.goal)}
          </p>
        </div>
      </div>
      <section className="detail-section">
        <p>{task.context}</p>
        <p>
          {task.phone} · {t('Izin kontak')} · {t(task.permission)}
        </p>
        <p>PIC · {task.owner}</p>
        <p>
          {t('Tenggat')} · {dateTime(task.dueAt)}
        </p>
        <p>
          {t('Waktu sumber')} · {dateTime(task.observedAt)}
        </p>
        {task.nextAt && (
          <p>
            {t('Jadwal berikutnya')} · {dateTime(task.nextAt)}
          </p>
        )}
        {task.reason && <p>{task.reason}</p>}{' '}
        {task.transaction && (
          <p>
            {t('Transaksi terverifikasi')} · {task.transaction}
          </p>
        )}
        <details>
          <summary>
            {t('Skor prioritas')} · {task.score}
          </summary>
          <p>
            {t('Urgensi')} {task.parts.urgency} · {t('Minat')} {task.parts.interest} ·{' '}
            {t('Aktivitas')} {task.parts.activity} · {t('Keterlambatan')} {task.parts.overdue}
          </p>
        </details>
      </section>
    </>
  );
}
