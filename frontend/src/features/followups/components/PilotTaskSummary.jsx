import {
  CalendarDays,
  Clock3,
  Phone,
  UserRound,
  ShieldCheck,
  ShieldAlert,
  Database,
  ChevronDown,
  BarChart3,
} from 'lucide-react';
import { useT } from '../../../shared/i18n/useLanguage.js';
import { Avatar } from '../../../shared/components/Avatar.jsx';
import { dateTime } from '../../../shared/utils/format.js';

export function PilotTaskSummary({ task }) {
  const t = useT();
  const permitted = task.permission === 'Aktif';
  const level = task.score >= 70 ? 'Tinggi' : task.score >= 40 ? 'Sedang' : 'Rendah';
  return (
    <>
      <div className="task-profile">
        <Avatar initials={task.initials} />
        <div>
          <span className="task-eyebrow">{t('DETAIL FOLLOW-UP')}</span>
          <h2>{task.name}</h2>
          <p>
            {task.package}
            <span aria-hidden="true"> · </span>
            {t(task.goal)}
          </p>
        </div>
      </div>
      <section className="task-overview" aria-label={t('Ringkasan follow-up')}>
        <div className="task-context">
          <span className="task-context-icon">
            <CalendarDays size={19} aria-hidden="true" />
          </span>
          <div>
            <span className="task-field-label">{t('Informasi paket')}</span>
            <p>{task.context}</p>
          </div>
        </div>
        <dl className="task-facts">
          <div>
            <dt>
              <Phone size={15} aria-hidden="true" />
              {t('Nomor kontak')}
            </dt>
            <dd>{task.phone || '—'}</dd>
          </div>
          <div>
            <dt>
              {permitted ? (
                <ShieldCheck size={15} aria-hidden="true" />
              ) : (
                <ShieldAlert size={15} aria-hidden="true" />
              )}
              {t('Izin kontak')}
            </dt>
            <dd>
              <span className={'task-permission ' + (permitted ? 'is-allowed' : 'is-pending')}>
                {t(task.permission)}
              </span>
            </dd>
          </div>
          <div>
            <dt>
              <UserRound size={15} aria-hidden="true" />
              {t('Penanggung jawab')}
            </dt>
            <dd>{task.owner || t('Belum ditugaskan')}</dd>
          </div>
          <div>
            <dt>
              <Clock3 size={15} aria-hidden="true" />
              {t('Tenggat')}
            </dt>
            <dd>{dateTime(task.dueAt)}</dd>
          </div>
          <div className="task-fact-wide">
            <dt>
              <Database size={15} aria-hidden="true" />
              {t('Waktu sumber')}
            </dt>
            <dd>{dateTime(task.observedAt)}</dd>
          </div>
          {task.nextAt && (
            <div className="task-fact-wide">
              <dt>{t('Jadwal berikutnya')}</dt>
              <dd>{dateTime(task.nextAt)}</dd>
            </div>
          )}
          {task.transaction && (
            <div className="task-fact-wide">
              <dt>{t('Transaksi terverifikasi')}</dt>
              <dd>{task.transaction}</dd>
            </div>
          )}
        </dl>
        {task.reason && <p className="task-reason">{task.reason}</p>}
        <details className="task-priority">
          <summary>
            <span>
              <BarChart3 size={17} aria-hidden="true" />
              {t('Skor prioritas')}
            </span>
            <span>
              <strong>{task.score}</strong>
              <span className="task-priority-level">{t(level)}</span>
              <ChevronDown size={16} className="task-priority-chevron" aria-hidden="true" />
            </span>
          </summary>
          <div className="task-score-parts">
            {[
              ['urgency', 'Urgensi'],
              ['interest', 'Minat'],
              ['activity', 'Aktivitas'],
              ['overdue', 'Keterlambatan'],
            ].map(([key, label]) => (
              <div key={key}>
                <span>{t(label)}</span>
                <strong>{task.parts?.[key] ?? '—'}</strong>
              </div>
            ))}
          </div>
        </details>
      </section>
    </>
  );
}
