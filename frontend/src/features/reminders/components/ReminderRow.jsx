import { useT } from '../../../shared/i18n/useLanguage.js';
import { PriorityBadge } from './PriorityBadge.jsx';
import { statusLabels, typeLabels, formatMoment } from '../services/reminderFormat.js';
import { formatDate } from '../../packages/services/packageFormat.js';

/** Satu baris pengingat. Baris paket menampilkan sisa sesi dan tanggal berakhir. */
export function ReminderRow({ reminder }) {
  const t = useT();
  const packageReminder = reminder.type === 'package';
  return (
    <li className="reminder-row">
      <div className="reminder-row-head">
        <strong>{reminder.customerName}</strong>
        <PriorityBadge priority={reminder.priority} source={reminder.prioritySource} />
      </div>
      <p className="reminder-meta">
        {t(typeLabels[reminder.type] || reminder.type)} ·{' '}
        <span className={'reminder-status reminder-status-' + reminder.status}>
          {t(statusLabels[reminder.status] || reminder.status)}
        </span>
        {reminder.scheduledAt && ' · ' + t('dijadwalkan ') + formatMoment(reminder.scheduledAt)}
      </p>
      {packageReminder && reminder.packageName && (
        <p className="reminder-package">
          {reminder.packageName} · {reminder.packageRemainingSessions} {t('sesi tersisa')}
          {reminder.packageExpiresAt &&
            ' · ' + t('berakhir ') + formatDate(reminder.packageExpiresAt)}
        </p>
      )}
      {!packageReminder && reminder.scheduleTitle && (
        <p className="reminder-package">{reminder.scheduleTitle}</p>
      )}
      {reminder.phone && <p className="reminder-phone">{reminder.phone}</p>}
    </li>
  );
}
