import { useEffect, useState } from 'react';
import {
  getReminderDraftStatus,
  getReminderHistory,
  getReminders,
  getUsers,
  reviewReminder,
} from '../../services/api';
import useI18n from '../../i18n/useI18n.js';

function SPVReminderReview() {
  const { t, formatDateTime } = useI18n();
  const [reminders, setReminders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [assignees, setAssignees] = useState({});
  const [aiStatus, setAiStatus] = useState(null);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');
  const [historyId, setHistoryId] = useState('');
  const [historyEvents, setHistoryEvents] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadData = async () => {
    const [reminderData, users, status] = await Promise.all([
      getReminders(),
      getUsers(),
      getReminderDraftStatus(),
    ]);
    setReminders(reminderData.reminders || []);
    setStaff(users.filter((user) => user.role === 'staff' && user.is_active));
    setAiStatus(status);
  };

  useEffect(() => {
    let active = true;
    Promise.all([getReminders(), getUsers(), getReminderDraftStatus()])
      .then(([reminderData, users, status]) => {
        if (!active) return;
        setReminders(reminderData.reminders || []);
        setStaff(users.filter((user) => user.role === 'staff' && user.is_active));
        setAiStatus(status);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleReview = async (reminder, decision) => {
    setSavingId(reminder.id);
    setError('');
    try {
      await reviewReminder(reminder.id, {
        message: drafts[reminder.id] ?? reminder.message ?? '',
        decision,
        ...(decision === 'approve'
          ? { assigned_to: assignees[reminder.id] || '' }
          : {}),
      });
      await loadData();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingId('');
    }
  };

  const showHistory = async (reminder) => {
    setHistoryId(reminder.id);
    setHistoryLoading(true);
    setError('');
    try {
      const data = await getReminderHistory(reminder.id);
      setHistoryEvents(data.events || []);
    } catch (loadError) {
      setError(loadError.message);
      setHistoryEvents([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const pending = reminders.filter((reminder) => (
    reminder.status === 'scheduled' && reminder.approvalStatus === 'pending'
  ));
  const historyReminders = reminders.filter((reminder) => (
    reminder.status !== 'scheduled' || reminder.approvalStatus !== 'pending'
  ));

  return (
    <section className="spv-followups-panel">
      <div className="spv-followups-heading">
        <div>
          <span className="spv-section-label">{t('HUMAN REVIEW')}</span>
          <h2>{t('Reminder menunggu persetujuan')}</h2>
          <p>{t('Reminder tidak dikirim otomatis; Staff mengonfirmasi pengiriman manual.')}</p>
        </div>
      </div>
      {aiStatus && !aiStatus.available && (
        <p className="spv-ai-availability-alert" role="status">
          {t('Generative AI belum tersedia: {{reason}} Silakan susun atau edit pesan secara manual sebelum menyetujui.', {
            reason: t(aiStatus.reason),
          })}
        </p>
      )}
      {error && <p role="alert">{t(error)}</p>}
      {pending.length ? pending.map((reminder) => (
        <article
          className="spv-followup-row spv-reminder-review-row"
          key={reminder.id}
        >
          <div className="spv-member-identity">
            <div className="spv-member-avatar">
              {(reminder.customerName || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{reminder.customerName}</strong>
              <span>{reminder.membershipPackage || t('Paket belum tercatat')}</span>
            </div>
          </div>
          <div className="spv-followup-field">
            <span className="spv-field-label">{t('Jadwal')}</span>
            <strong>{reminder.scheduleTitle || t('Jadwal kelas')}</strong>
            <span>{formatDateTime(reminder.scheduleStartsAt)}</span>
          </div>
          <div className="spv-followup-field">
            <span className="spv-field-label">{t('Waktu reminder')}</span>
            <span>{formatDateTime(reminder.scheduledAt)}</span>
            <span>{reminder.leadMinutes === 120 ? t('2 jam sebelum') : t('24 jam sebelum')}</span>
          </div>
          <label className="spv-followup-field">
            {t('Isi pesan')}
            <textarea
              value={drafts[reminder.id] ?? reminder.message ?? ''}
              onChange={(event) => setDrafts((previous) => ({
                ...previous,
                [reminder.id]: event.target.value,
              }))}
              rows={3}
              maxLength={10000}
            />
          </label>
          <label className="spv-followup-field">
            {t('Tugaskan ke Staff aktif')}
            <select
              value={assignees[reminder.id] ?? reminder.assignedTo ?? ''}
              onChange={(event) => setAssignees((previous) => ({
                ...previous,
                [reminder.id]: event.target.value,
              }))}
            >
              <option value="">{t('Pilih Staff')}</option>
              {staff.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({t('STAFF')})
                </option>
              ))}
            </select>
          </label>
          <div className="spv-followup-field">
            <button
              type="button"
              disabled={
                savingId === reminder.id
                || !staff.length
                || !(assignees[reminder.id] || reminder.assignedTo)
                || !(drafts[reminder.id] ?? reminder.message ?? '').trim()
              }
              onClick={() => handleReview(reminder, 'approve')}
            >
              {t('Setujui dan tugaskan')}
            </button>
            <button
              type="button"
              disabled={savingId === reminder.id}
              onClick={() => handleReview(reminder, 'reject')}
            >
              {t('Tolak draft')}
            </button>
          <button type="button" onClick={() => showHistory(reminder)}>
            {t('Riwayat')}
          </button>
          </div>
        </article>
      )) : (
        <div className="spv-followups-empty">
          <strong>{t('Tidak ada reminder menunggu persetujuan.')}</strong>
        </div>
      )}
      <div className="spv-reminder-history">
        <h3>{t('Riwayat reminder sebelumnya')}</h3>
        {historyReminders.length ? historyReminders.map((reminder) => (
          <article className="spv-reminder-history-row" key={`history-${reminder.id}`}>
            <strong>{reminder.customerName}</strong>
            <span>{reminder.scheduleTitle || 'Reminder'}</span>
            <span>{t(reminder.status)} · {t(reminder.approvalStatus)}</span>
            <button type="button" onClick={() => showHistory(reminder)}>
              {t('Lihat riwayat')}
            </button>
          </article>
        )) : (
          <p className="spv-reminder-history-empty">{t('Belum ada riwayat.')}</p>
        )}
      {historyId && (
        <div className="spv-activity-list">
          <h4>{t('Perubahan reminder')}</h4>
          {historyLoading ? <p>{t('Memuat riwayat...')}</p> : historyEvents.length ? (
            historyEvents.map((event) => (
              <article className="spv-activity-item" key={event.id}>
                <strong>{t(event.eventType)}</strong>
                <span>{formatDateTime(event.createdAt)}</span>
                <span>{event.previousStatus ? t(event.previousStatus) : '—'} → {event.newStatus ? t(event.newStatus) : '—'}</span>
                {event.note && <p>{event.note}</p>}
                <small>{t('Petugas')}: {event.performedBy || t('Sistem')}</small>
                <small>{t('PIC')}: {event.picName || t('Belum ditugaskan')}</small>
              </article>
            ))
          ) : <p>{t('Belum ada riwayat.')}</p>}
        </div>
      )}
      </div>
    </section>
  );
}

export default SPVReminderReview;
