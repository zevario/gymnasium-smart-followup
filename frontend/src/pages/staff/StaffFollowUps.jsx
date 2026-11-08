import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createFollowUpActivity,
  getFollowUpHistory,
  getFollowUps,
  getFollowupDraftStatus,
  getReminders,
  getStaffNotifications,
  markReminderSent,
  markStaffNotificationRead,
  setReminderResponse,
  updateFollowUpStatus,
} from '../../services/api';
import '../../assets/styles/staff/StaffDashboard.css';
import useI18n from '../../i18n/useI18n.js';
import { openWhatsApp } from '../../utils/whatsapp.js';

function StaffFollowUps() {
  const { t, translateReason, formatDateTime, formatNumber } = useI18n();
  const [followups, setFollowups] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [messageDraft, setMessageDraft] = useState('');
  const [draftGeneratorStatus, setDraftGeneratorStatus] = useState(null);
  const [draftStatusError, setDraftStatusError] = useState('');
  const [draftStatusLoading, setDraftStatusLoading] = useState(true);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [history, setHistory] = useState([]);
  const [channel, setChannel] = useState('WhatsApp');
  const [note, setNote] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const followupStatuses = [
    ['pending', t('Perlu ditinjau')],
    ['in_progress', t('Menunggu balasan')],
    ['no_response', t('Belum ada balasan')],
    ['postponed', t('Ditunda')],
    ['completed', t('Selesai')],
  ];

  const loadWork = useCallback(async () => {
    const [followupData, reminderData, notificationData] = await Promise.all([
      getFollowUps(),
      getReminders(),
      getStaffNotifications(),
    ]);
    setFollowups(followupData.followUps || []);
    setReminders(reminderData.reminders || []);
    setNotifications(notificationData.notifications || []);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([getFollowUps(), getReminders(), getStaffNotifications()])
      .then(([followupData, reminderData, notificationData]) => {
        if (!active) return;
        setFollowups(followupData.followUps || []);
        setReminders(reminderData.reminders || []);
        setNotifications(notificationData.notifications || []);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadWork]);

  useEffect(() => {
    let active = true;
    getFollowupDraftStatus()
      .then((status) => {
        if (active) setDraftGeneratorStatus(status);
      })
      .catch((statusError) => {
        if (active) setDraftStatusError(statusError.message);
      })
      .finally(() => {
        if (active) setDraftStatusLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedMember = followups.find((followup) => (
    followup.id === selectedMemberId
  ));

  const priorityCounts = useMemo(() => ({
    high: followups.filter((followup) => followup.priority === 'high').length,
    medium: followups.filter(
      (followup) => ['medium', 'normal'].includes(followup.priority),
    ).length,
    low: followups.filter((followup) => followup.priority === 'low').length,
    unclassified: followups.filter((followup) => !followup.priority).length,
  }), [followups]);

  const filteredFollowups = useMemo(() => {
    const query = memberSearch.trim().toLocaleLowerCase();
    return followups.filter((followup) => {
      const matchesPriority = priorityFilter === 'all'
        || (priorityFilter === 'unclassified'
          ? !followup.priority
          : priorityFilter === 'medium'
          ? ['medium', 'normal'].includes(followup.priority)
          : followup.priority === priorityFilter);
      const matchesSearch = [
        followup.name,
        followup.phone,
        followup.membershipPackage,
        followup.priorityReason,
      ].some((value) => String(value || '').toLocaleLowerCase().includes(query));
      return matchesPriority && matchesSearch;
    });
  }, [followups, memberSearch, priorityFilter]);

  const handleStatusChange = async (customerId, status) => {
    setError('');
    try {
      await updateFollowUpStatus(customerId, status);
      await loadWork();
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const openHistory = async (followup) => {
    setSelectedFollowup(followup);
    setError('');
    try {
      const data = await getFollowUpHistory(followup.id);
      setHistory(data.events || []);
    } catch (loadError) {
      setError(loadError.message);
      setHistory([]);
    }
  };

  const selectMember = (followup) => {
    setSelectedMemberId(followup.id);
    setMessageDraft(followup.draftMessage || '');
  };

  const openWhatsAppDraft = () => {
    if (!selectedMember?.contactPermission || !messageDraft.trim()) return;
    openWhatsApp(selectedMember.phone, messageDraft.trim());
  };

  const openCommunicationHistory = () => {
    if (!selectedMember) return;
    setChannel('WhatsApp');
    setNote(messageDraft.trim());
    setResult('');
    openHistory(selectedMember);
  };

  const handleActivity = async (event) => {
    event.preventDefault();
    if (!selectedFollowup || !note.trim()) return;
    setSaving(true);
    setError('');
    try {
      await createFollowUpActivity(selectedFollowup.id, {
        channel,
        note: note.trim(),
        result: result.trim(),
      });
      setNote('');
      setResult('');
      const data = await getFollowUpHistory(selectedFollowup.id);
      setHistory(data.events || []);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendConfirmation = async (reminder) => {
    setError('');
    try {
      await markReminderSent(reminder.id);
      await loadWork();
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const handleResponse = async (reminder, responded) => {
    setError('');
    try {
      await setReminderResponse(reminder.id, responded);
      await loadWork();
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const handleNotificationRead = async (notification) => {
    try {
      await markStaffNotificationRead(notification.id);
      setNotifications((previous) => previous.map((item) => (
        item.id === notification.id
          ? { ...item, readAt: new Date().toISOString() }
          : item
      )));
    } catch (readError) {
      setError(readError.message);
    }
  };

  const dueReminders = reminders.filter((reminder) => (
    reminder.status === 'scheduled'
    && reminder.approvalStatus === 'approved'
    && (!reminder.scheduledAt || new Date(reminder.scheduledAt) <= new Date())
  ));

  return (
    <main className="staff-dashboard staff-followups-page">
      <div className="staff-dashboard-heading">
        <div>
          <span className="staff-dashboard-eyebrow">{t('ASSIGNED WORK')}</span>
          <h1>{t('Tugas Follow-up')}</h1>
          <p>{t('Komunikasi dan perubahan status tersimpan ke database.')}</p>
        </div>
      </div>

      {error && <p role="alert">{t(error)}</p>}

      <section className="staff-dashboard-section staff-followups-section staff-followups-summary">
        <div className="staff-section-heading">
          <div>
            <h2>{t('Ringkasan Harian')}</h2>
            <p>{t('Notifikasi internal yang dibuat oleh backend.')}</p>
          </div>
        </div>
        {notifications.length ? notifications.map((notification) => (
          <article className="staff-recent-item" key={notification.id}>
            <div className="staff-recent-info">
              <strong>{notification.title}</strong>
              <span>
                {t('Menunggu persetujuan: {{count}} · Reminder belum dikirim: {{notSent}} · Belum ada respons: {{noResponse}} · Follow-up ditunda: {{postponed}}', {
                  count: formatNumber(notification.payload.pendingApproval || 0),
                  notSent: formatNumber(notification.payload.notSent || 0),
                  noResponse: formatNumber(notification.payload.noResponse || 0),
                  postponed: formatNumber(notification.payload.postponedFollowups || 0),
                })}
              </span>
            </div>
            {!notification.readAt && (
              <button type="button" onClick={() => handleNotificationRead(notification)}>
                {t('Tandai dibaca')}
              </button>
            )}
          </article>
        )) : (
          <p className="staff-followups-empty">{t('Belum ada ringkasan harian.')}</p>
        )}
      </section>

      <section className="staff-dashboard-section staff-followups-section">
        <div className="staff-section-heading">
          <div>
            <h2>{t('Member yang membutuhkan follow-up')}</h2>
            <p>{t('Prioritas dihitung dari aktivitas PostgreSQL dengan aturan, bukan model AI.')}</p>
          </div>
          <span>{formatNumber(followups.length)} {t('tugas')}</span>
        </div>
        <div className="staff-followup-priority-summary">
          {[
            ['high', 'Tinggi', priorityCounts.high],
            ['medium', 'Sedang', priorityCounts.medium],
            ['low', 'Rendah', priorityCounts.low],
          ].map(([priority, label, count]) => (
            <article className={`staff-followup-priority-card ${priority}`} key={priority}>
              <span>{t(label)}</span>
              <strong>{formatNumber(count)}</strong>
            </article>
          ))}
        </div>
        {priorityCounts.unclassified > 0 && (
          <p className="staff-followup-unclassified-note">
            {t('Klasifikasi belum tersedia untuk {{count}} member.', {
              count: formatNumber(priorityCounts.unclassified),
            })}
          </p>
        )}
        <div className="staff-followup-filters">
          <label>
            <span>{t('Cari nama atau nomor WhatsApp')}</span>
            <input
              type="search"
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder={t('Cari nama atau nomor WhatsApp')}
            />
          </label>
          <label>
            <span>{t('Filter prioritas')}</span>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              <option value="all">{t('Semua prioritas')}</option>
              <option value="high">{t('Tinggi')}</option>
              <option value="medium">{t('Sedang')}</option>
              <option value="low">{t('Rendah')}</option>
              <option value="unclassified">{t('Belum diklasifikasikan')}</option>
            </select>
          </label>
        </div>
        {loading ? <p>{t('Memuat tugas...')}</p> : filteredFollowups.length ? (
          filteredFollowups.map((followup) => (
            <article
              className={`staff-recent-item staff-task-row ${selectedMemberId === followup.id ? 'selected' : ''}`}
              key={followup.followupId || followup.id}
            >
              <div className="staff-recent-info">
                <strong>{followup.name}</strong>
                <span>{followup.phone || t('Nomor WhatsApp belum tercatat')}</span>
                <span>{followup.membershipPackage || t('Paket belum tercatat')}</span>
                <span>
                  {t('Prioritas')}: {t(followup.priority || 'Belum diklasifikasikan')}
                  {' · '}{t('Status')}: {t(followup.status)}
                </span>
                <span>
                  {t('Kunjungan terakhir')}: {followup.lastVisit
                    ? formatDateTime(followup.lastVisit)
                    : t('Belum memiliki riwayat kunjungan')}
                  {' · '}{t('Kunjungan 30 hari')}: {formatNumber(followup.visitsLast30Days || 0)}
                  {' · '}{t('Absen 30 hari')}: {formatNumber(followup.absencesLast30Days || 0)}
                </span>
                {followup.priorityReason && (
                  <span>{translateReason(followup.priorityReason)}</span>
                )}
                {followup.noResponseCount > 0 && (
                  <span>
                    {t('Reminder tanpa respons: {{count}}', {
                      count: formatNumber(followup.noResponseCount),
                    })}
                    {followup.lastReminderRespondedAt
                      ? ` · ${t('Respons terakhir')}: ${formatDateTime(followup.lastReminderRespondedAt)}`
                      : ''}
                  </span>
                )}
                {followup.lastReminderStatus && (
                  <span>{t('Status reminder terakhir')}: {t(followup.lastReminderStatus)}</span>
                )}
              </div>
              <select
                value={followup.status}
                onChange={(event) => handleStatusChange(followup.id, event.target.value)}
                aria-label={t('Status follow-up {{name}}', { name: followup.name })}
              >
                {followupStatuses.map(([value, label]) => (
                  <option value={value} key={value} disabled={value === 'pending'}>
                    {label}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => selectMember(followup)}>
                {selectedMemberId === followup.id ? t('Member dipilih') : t('Pilih member')}
              </button>
              <button type="button" onClick={() => openHistory(followup)}>
                {t('Riwayat dan catat aktivitas')}
              </button>
            </article>
          ))
        ) : (
          <p className="staff-followups-empty">
            {followups.length
              ? t('Belum ada pelanggan yang sesuai dengan pencarian atau filter yang digunakan.')
              : t('Belum ada follow-up yang ditugaskan.')}
          </p>
        )}
      </section>

      {selectedMember && (
        <section className="staff-dashboard-section staff-followups-section staff-followup-composer">
          <div className="staff-section-heading">
            <div>
              <h2>{t('Tindak lanjuti {{name}}', { name: selectedMember.name })}</h2>
              <p>{t('Periksa dan edit pesan sebelum membukanya di WhatsApp.')}</p>
            </div>
            <button type="button" onClick={() => setSelectedMemberId('')}>
              {t('Tutup')}
            </button>
          </div>
          <div className="staff-followup-composer-content">
            <div className="staff-followup-ai-notice" role="status">
              <strong>{t('Generate pesan AI belum tersedia')}</strong>
              <p>
                {draftStatusLoading
                  ? t('Memeriksa status layanan pesan...')
                  : draftStatusError
                    ? t(draftStatusError)
                    : draftGeneratorStatus?.available
                      ? t('Endpoint untuk membuat draft pesan belum tersedia.')
                      : t(draftGeneratorStatus?.reason || 'Generative AI belum dikonfigurasi. Tulis pesan secara manual.')}
              </p>
              <button type="button" disabled>
                {t('Generate Pesan AI')}
              </button>
            </div>
            <label className="staff-followup-message-field">
              {t('Draft pesan WhatsApp')}
              <textarea
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                rows={5}
                maxLength={10000}
                placeholder={t('Tulis pesan yang relevan berdasarkan informasi member yang tersedia.')}
              />
            </label>
            <p className="staff-followup-manual-note">
              {t('WhatsApp dibuka untuk pengiriman manual. Membuka aplikasi tidak menandai pesan sebagai terkirim.')}
            </p>
            <div className="staff-followup-composer-actions">
              <button
                type="button"
                disabled={!selectedMember.contactPermission || !selectedMember.phone || !messageDraft.trim()}
                onClick={openWhatsAppDraft}
              >
                {t('Buka WhatsApp')}
              </button>
              <button
                type="button"
                disabled={!selectedMember.contactPermission || !messageDraft.trim()}
                onClick={openCommunicationHistory}
              >
                {t('Catat komunikasi setelah mengirim')}
              </button>
            </div>
            {!selectedMember.contactPermission && (
              <p className="staff-followup-permission-note" role="alert">
                {t('Izin kontak tidak diberikan; aktivitas kontak tidak dapat disimpan.')}
              </p>
            )}
          </div>
        </section>
      )}

      <section className="staff-dashboard-section staff-followups-section staff-followups-reminders">
        <div className="staff-section-heading">
          <div>
            <h2>{t('Reminder Jadwal')}</h2>
            <p>{t('Pengiriman WhatsApp tetap dilakukan manual oleh Staff.')}</p>
          </div>
          <span>{formatNumber(dueReminders.length)} {t('siap dikonfirmasi')}</span>
        </div>
        {reminders.length ? reminders.map((reminder) => (
          <article className="staff-recent-item staff-task-row" key={reminder.id}>
            <div className="staff-recent-info">
              <strong>{reminder.customerName}</strong>
              <span>{reminder.scheduleTitle || t('Reminder follow-up')}</span>
              <span>
                {t('Status')}: {t(reminder.status)} · {t('Persetujuan')}: {t(reminder.approvalStatus)}
                {' · '}{t('Jadwal')}: {formatDateTime(reminder.scheduledAt)}
              </span>
              {reminder.message && <p>{reminder.message}</p>}
            </div>
            {dueReminders.some((item) => item.id === reminder.id) && (
              <button type="button" onClick={() => handleSendConfirmation(reminder)}>
                {t('Konfirmasi sudah dikirim')}
              </button>
            )}
            {(reminder.status === 'sent' || reminder.status === 'no_response') && (
              <>
                <button type="button" onClick={() => handleResponse(reminder, true)}>
                  {t('Respons diterima')}
                </button>
                <button type="button" onClick={() => handleResponse(reminder, false)}>
                  {t('Belum ada respons')}
                </button>
              </>
            )}
          </article>
        )) : <p className="staff-followups-empty">{t('Belum ada reminder yang ditugaskan.')}</p>}
      </section>

      {selectedFollowup && (
        <section className="staff-dashboard-section staff-followups-section staff-followups-history">
          <div className="staff-section-heading">
            <div>
              <h2>{t('Riwayat — {{name}}', { name: selectedFollowup.name })}</h2>
              <p>{t('Catatan aktivitas dan perubahan status yang tersimpan.')}</p>
            </div>
            <button type="button" onClick={() => setSelectedFollowup(null)}>
              {t('Tutup')}
            </button>
          </div>
          <form onSubmit={handleActivity}>
            <label>
              {t('Metode komunikasi')}
              <select value={channel} onChange={(event) => setChannel(event.target.value)}>
                <option>WhatsApp</option>
                <option value="Telepon">{t('Telepon')}</option>
                <option value="Kunjungan">{t('Kunjungan')}</option>
              </select>
            </label>
            <label>
              {t('Catatan')}
              <textarea value={note} onChange={(event) => setNote(event.target.value)} required />
            </label>
            <label>
              {t('Hasil')}
              <input value={result} onChange={(event) => setResult(event.target.value)} />
            </label>
            <button type="submit" disabled={saving || !note.trim()}>
              {saving ? t('Menyimpan...') : t('Simpan aktivitas')}
            </button>
          </form>
          {history.length ? history.map((event) => (
            <article className="staff-recent-item" key={event.id}>
              <div className="staff-recent-info">
                <strong>
                  {event.eventType === 'activity'
                    ? t(event.channel)
                    : t(event.eventType)}
                </strong>
                <span>{formatDateTime(event.createdAt)} · {event.performedBy || t('Tidak diketahui')}</span>
                {event.previousStatus && (
                  <span>{t(event.previousStatus)} → {t(event.newStatus)}</span>
                )}
                {event.note && <p>{event.note}</p>}
                {event.result && <p>{t('Hasil')}: {event.result}</p>}
              </div>
            </article>
          )) : <p>{t('Belum ada riwayat.')}</p>}
        </section>
      )}
    </main>
  );
}

export default StaffFollowUps;
