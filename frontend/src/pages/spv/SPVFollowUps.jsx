import { useEffect, useMemo, useState } from 'react';
import {
  approveFollowUpRecommendation,
  createFollowUpActivity,
  dismissFollowUpRecommendation,
  getFollowupDraftStatus,
  getFollowUpRecommendations,
  getFollowUpHistory,
  getFollowUps,
  getUsers,
  updateFollowUpStatus,
} from '../../services/api';
import '../../assets/styles/spv/SPVFollowUps.css';
import SPVReminderReview from './SPVReminderReview.jsx';
import useI18n from '../../i18n/useI18n.js';

const tabs = [
  'Semua',
  'Perlu ditinjau',
  'Menunggu balasan',
  'Ditunda',
  'Selesai',
  'Diblokir',
];

const statusLabels = {
  pending: 'Perlu ditinjau',
  in_progress: 'Menunggu balasan',
  no_response: 'Menunggu balasan',
  postponed: 'Ditunda',
  completed: 'Selesai',
  blocked: 'Diblokir',
};

const statusValues = {
  'Perlu ditinjau': 'pending',
  'Menunggu balasan': 'in_progress',
  Ditunda: 'postponed',
  Selesai: 'completed',
  Diblokir: 'blocked',
};

const getPriorityLabel = (priority) => ({
  high: 'Tinggi',
  medium: 'Sedang',
  normal: 'Sedang',
  low: 'Rendah',
}[priority] || 'Belum diklasifikasikan');

const getPriorityClass = (priority) => (
  priority === 'high'
    ? 'high'
    : priority === 'medium' || priority === 'normal'
      ? 'medium'
      : priority === 'low'
        ? 'low'
        : 'unknown'
);

const priorityRank = { low: 1, normal: 2, medium: 2, high: 3 };

const getGoal = (packageName = '') =>
  packageName.toLowerCase().includes('trial') ? 'Trial' : 'Perpanjangan';

const getStatusLabel = (followUp) => {
  if (!followUp.contactPermission) return 'Diblokir';
  return statusLabels[followUp.status] || 'Perlu ditinjau';
};

function SPVFollowUps() {
  const {
    t,
    translateReason,
    formatDate,
    formatDateTime,
    formatNumber,
  } = useI18n();
  const [customers, setCustomers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [followupDraftStatus, setFollowupDraftStatus] = useState(null);
  const [recommendationAssignees, setRecommendationAssignees] = useState({});
  const [recommendationDrafts, setRecommendationDrafts] = useState({});
  const [savingRecommendationId, setSavingRecommendationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendationFilter, setRecommendationFilter] = useState(
    'Semua rekomendasi',
  );
  const [activityType, setActivityType] = useState('WhatsApp');
  const [activityNote, setActivityNote] = useState('');
  const [activityResult, setActivityResult] = useState('');
  const [selectedHistoryMember, setSelectedHistoryMember] = useState(null);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [savingActivity, setSavingActivity] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState('');
  const [activeTab, setActiveTab] = useState('Semua');
  const [search, setSearch] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('Semua tujuan');
  const [selectedPIC, setSelectedPIC] = useState('Semua PIC');

  const loadFollowUps = async () => {
    try {
      const data = await getFollowUps();
      setCustomers(data.followUps || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    getFollowUps()
      .then((data) => {
        if (active) setCustomers(data.followUps || []);
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
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      getFollowUpRecommendations(),
      getUsers(),
      getFollowupDraftStatus(),
    ])
      .then(([recommendationData, users, draftStatus]) => {
        if (!active) return;
        setRecommendations(recommendationData.recommendations || []);
        setFollowupDraftStatus(draftStatus);
        setStaffUsers(
          users.filter((user) => user.role === 'staff' && user.is_active),
        );
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const reloadRecommendations = async () => {
    const data = await getFollowUpRecommendations();
    setRecommendations(data.recommendations || []);
  };

  const handleReviewRecommendation = async (recommendation, decision) => {
    setSavingRecommendationId(recommendation.id);
    setError('');
    try {
      if (decision === 'approve') {
        await approveFollowUpRecommendation(recommendation.id, {
          assigned_to: recommendationAssignees[recommendation.id]
            || recommendation.assignedTo
            || '',
          draft_message: recommendationDrafts[recommendation.id] || '',
        });
      } else {
        await dismissFollowUpRecommendation(recommendation.id);
      }
      await Promise.all([reloadRecommendations(), loadFollowUps()]);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingRecommendationId('');
    }
  };

  const followUps = useMemo(
    () => customers
      .map((customer) => {
        const name = customer.name || 'Tanpa nama';
        const packageName = customer.membershipPackage || '-';
        const priority = customer.priority || null;
        const lastVisit = customer.lastVisit;
        const membershipEnd = customer.membershipEnd;
        return {
          ...customer,
          name,
          initials: name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0].toUpperCase())
            .join(''),
          package: packageName,
          goal: getGoal(packageName),
          priority,
          priorityReason: translateReason(
            customer.priorityReason || 'Belum ada rekomendasi aktif dari sistem.',
          ),
          recommendation: customer.contactPermission
            ? customer.recommendedAction || 'Belum ada rekomendasi'
            : 'Jangan hubungi',
          due: membershipEnd
            ? t('Berakhir {{date}}', { date: formatDate(membershipEnd) })
            : t('Masa membership belum ditentukan'),
          deadline: lastVisit
            ? t('Kunjungan terakhir: {{date}}', { date: formatDate(lastVisit) })
            : t('Belum memiliki riwayat kunjungan'),
          pic: customer.picName || 'Belum ditugaskan',
          status: getStatusLabel(customer),
        };
      })
      .sort((a, b) => {
        const aBlocked = a.recommendation === 'Jangan hubungi';
        const bBlocked = b.recommendation === 'Jangan hubungi';
        if (aBlocked !== bBlocked) return Number(aBlocked) - Number(bBlocked);
        return (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
      }),
    [customers, formatDate, t, translateReason],
  );

  const picOptions = useMemo(
    () => [...new Set(
      followUps
        .map((member) => member.pic)
        .filter((pic) => pic && pic !== 'Belum ditugaskan'),
    )],
    [followUps],
  );

  const filteredData = useMemo(() => followUps.filter((member) => {
    const keyword = search.toLowerCase();
    const matchesTab = activeTab === 'Semua' || member.status === activeTab;
    const matchesSearch = [
      member.name,
      member.package,
      member.phone,
      member.pic,
      member.priorityReason,
      t(member.recommendation),
    ].some((value) => String(value || '').toLowerCase().includes(keyword));
    const matchesGoal = selectedGoal === 'Semua tujuan'
      || member.goal === selectedGoal;
    const matchesPIC = selectedPIC === 'Semua PIC'
      || member.pic === selectedPIC;
    const matchesRecommendation = recommendationFilter === 'Semua rekomendasi'
      || member.recommendation === recommendationFilter;

    return matchesTab
      && matchesSearch
      && matchesGoal
      && matchesPIC
      && matchesRecommendation;
  }), [
    followUps,
    activeTab,
    search,
    selectedGoal,
    selectedPIC,
    recommendationFilter,
    t,
  ]);

  const getTabCount = (tab) => (
    tab === 'Semua'
      ? followUps.length
      : followUps.filter((member) => member.status === tab).length
  );

  const handleStatusChange = async (member, label) => {
    const nextStatus = statusValues[label];
    if (!nextStatus || !member.contactPermission) return;
    setSavingStatusId(member.id);
    setLoading(true);
    setError('');
    try {
      await updateFollowUpStatus(member.id, nextStatus);
      await loadFollowUps();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingStatusId('');
    }
  };

  const openHistory = async (member) => {
    setSelectedHistoryMember(member);
    setHistoryEvents([]);
    setHistoryError('');
    setHistoryLoading(true);
    try {
      const data = await getFollowUpHistory(member.id);
      setHistoryEvents(data.events || []);
    } catch (loadError) {
      setHistoryError(loadError.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAddActivity = async () => {
    if (!selectedHistoryMember || !activityNote.trim()) return;
    setSavingActivity(true);
    setHistoryError('');
    try {
      const data = await createFollowUpActivity(selectedHistoryMember.id, {
        channel: activityType,
        note: activityNote.trim(),
        result: activityResult.trim(),
      });
      setHistoryEvents((previous) => [data.event, ...previous]);
      setActivityNote('');
      setActivityResult('');
      setActivityType('WhatsApp');
    } catch (saveError) {
      setHistoryError(saveError.message);
    } finally {
      setSavingActivity(false);
    }
  };

  const statusEvents = historyEvents.filter(
    (event) => event.eventType === 'status',
  );
  const activityEvents = historyEvents.filter(
    (event) => event.eventType === 'activity',
  );
  const otherEvents = historyEvents.filter(
    (event) => !['status', 'activity'].includes(event.eventType),
  );

  return (
    <div className="spv-followups">
      <div className="spv-followups-heading">
        <div>
          <span className="spv-section-label">{t('SMART FOLLOW-UP')}</span>
          <h1>{t('Semua follow-up')}</h1>
          <p>{t('Kelola seluruh tindak lanjut member dari satu tempat.')}</p>
        </div>
      </div>

      <SPVReminderReview />

      <section className="spv-followups-panel">
        <div className="spv-followups-heading">
          <div>
            <span className="spv-section-label">{t('RULE-BASED CLASSIFICATION')}</span>
            <h2>{t('Rekomendasi menunggu tinjauan')}</h2>
            <p>
              {t('Klasifikasi dihitung dari aktivitas PostgreSQL, bukan model AI. Tidak ada pesan yang dikirim otomatis.')}
            </p>
          </div>
        </div>
        {recommendations.length ? recommendations.map((recommendation) => (
          <article
            className="spv-followup-row spv-recommendation-row"
            key={recommendation.id}
          >
            <div className="spv-member-identity">
              <div className="spv-member-avatar">
                {(recommendation.customerName || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{recommendation.customerName}</strong>
                <span>{recommendation.membershipPackage || t('Paket belum tercatat')}</span>
              </div>
            </div>
            <div className="spv-followup-field">
              <span className="spv-field-label">{t('Prioritas')}</span>
              <span className={`spv-priority-tag ${getPriorityClass(recommendation.priority)}`}>
                {t(getPriorityLabel(recommendation.priority))}
              </span>
            </div>
            <div className="spv-followup-field">
              <span className="spv-field-label">{t('Alasan dari data')}</span>
              <span>{translateReason(recommendation.reason)}</span>
              <small>{t(recommendation.recommendedAction)}</small>
            </div>
            <label className="spv-followup-field">
              {t('Tugaskan kepada Staff')}
              <select
                value={
                  recommendationAssignees[recommendation.id]
                  ?? recommendation.assignedTo
                  ?? ''
                }
                onChange={(event) => setRecommendationAssignees((previous) => ({
                  ...previous,
                  [recommendation.id]: event.target.value,
                }))}
              >
                <option value="">{t('Pilih Staff aktif')}</option>
                {staffUsers.map((user) => (
                  <option value={user.id} key={user.id}>
                    {user.name} ({t('STAFF')})
                  </option>
                ))}
              </select>
            </label>
            <label className="spv-followup-field">
              {t('Draft pesan opsional')}
              {followupDraftStatus && !followupDraftStatus.available
                && ` (${t('Manual: {{reason}}', {
                  reason: t(followupDraftStatus.reason),
                })})`}
              <textarea
                rows={3}
                maxLength={10000}
                value={recommendationDrafts[recommendation.id] || ''}
                onChange={(event) => setRecommendationDrafts((previous) => ({
                  ...previous,
                  [recommendation.id]: event.target.value,
                }))}
              />
            </label>
            <div className="spv-followup-field">
              <button
                type="button"
                disabled={
                  savingRecommendationId === recommendation.id
                  || !staffUsers.length
                  || !(
                    recommendationAssignees[recommendation.id]
                    || recommendation.assignedTo
                  )
                }
                onClick={() => handleReviewRecommendation(recommendation, 'approve')}
              >
                {t('Setujui dan tugaskan')}
              </button>
              <button
                type="button"
                disabled={savingRecommendationId === recommendation.id}
                onClick={() => handleReviewRecommendation(recommendation, 'dismiss')}
              >
                {t('Abaikan rekomendasi')}
              </button>
            </div>
          </article>
        )) : (
          <div className="spv-followups-empty">
            <strong>{t('Belum ada rekomendasi yang menunggu tinjauan.')}</strong>
          </div>
        )}
      </section>

      <section className="spv-followups-panel">
        <div className="spv-followups-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`spv-followups-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {t(tab)}
              <span>{formatNumber(getTabCount(tab))}</span>
            </button>
          ))}
        </div>

        <div className="spv-followups-filters">
          <select
            value={recommendationFilter}
            onChange={(event) => setRecommendationFilter(event.target.value)}
          >
            <option value="Semua rekomendasi">{t('Semua rekomendasi')}</option>
            <option value="Hubungi untuk perpanjangan">{t('Hubungi untuk perpanjangan')}</option>
            <option value="Tindak lanjuti reminder yang belum mendapat respons">
              {t('Tindak lanjuti reminder yang belum mendapat respons')}
            </option>
            <option value="Evaluasi pelanggan yang tidak aktif">{t('Evaluasi pelanggan yang tidak aktif')}</option>
            <option value="Pantau aktivitas kunjungan">{t('Pantau aktivitas kunjungan')}</option>
            <option value="Belum ada rekomendasi">{t('Belum ada rekomendasi')}</option>
            <option value="Jangan hubungi">{t('Jangan hubungi')}</option>
          </select>

          <div className="spv-followups-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder={t('Cari nama, paket, nomor, atau PIC')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={selectedGoal}
            onChange={(event) => setSelectedGoal(event.target.value)}
          >
            <option value="Semua tujuan">{t('Semua tujuan')}</option>
            <option value="Perpanjangan">{t('Perpanjangan')}</option>
            <option value="Trial">{t('Trial')}</option>
          </select>

          <select
            value={selectedPIC}
            onChange={(event) => setSelectedPIC(event.target.value)}
          >
            <option value="Semua PIC">{t('Semua PIC')}</option>
            {picOptions.map((pic) => (
              <option key={pic} value={pic}>{pic}</option>
            ))}
            <option value="Belum ditugaskan">{t('Belum ditugaskan')}</option>
          </select>
        </div>

        {error && <p role="alert">{t(error)}</p>}

        <div className="spv-followups-list">
          {loading ? (
            <div className="spv-followups-empty"><strong>{t('Memuat data follow-up...')}</strong></div>
          ) : filteredData.length > 0 ? (
            filteredData.map((member) => (
              <article
                className="spv-followup-row spv-member-followup-row"
                key={member.id}
              >
                <div className="spv-member-identity">
                  <div className="spv-member-avatar">{member.initials || '?'}</div>
                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.package}</span>
                  </div>
                </div>

                <div className="spv-followup-field">
                  <span className="spv-field-label">{t('Tujuan')}</span>
                  <span className="spv-goal-tag">{t(member.goal)}</span>
                </div>

                <div className="spv-followup-field">
                  <span className="spv-field-label">{t('Prioritas')}</span>
                  <div className="spv-priority-value">
                  <strong>{t(getPriorityLabel(member.priority)).toUpperCase()}</strong>
                    <span className={`spv-priority-tag ${getPriorityClass(member.priority)}`}>
                      {t(getPriorityLabel(member.priority))}
                    </span>
                  </div>
                  <small className="spv-priority-reason">{member.priorityReason}</small>
                </div>

                <div className="spv-followup-field">
                  <span className="spv-field-label">{t('Informasi kunjungan')}</span>
                  <strong>{member.due}</strong>
                  <span>{member.deadline}</span>
                </div>

                <div className="spv-followup-recommendation">
                  <span>{t('Rekomendasi tindakan')}</span>
                  <strong>{t(member.recommendation)}</strong>
                </div>

                <div className="spv-followup-field">
                  <span className="spv-field-label">{t('PIC')}</span>
                  <div className="spv-pic">
                    <span className="spv-pic-avatar">
                      {member.pic === 'Belum ditugaskan' ? '?' : member.pic.charAt(0).toUpperCase()}
                    </span>
                    {member.pic === 'Belum ditugaskan' ? t(member.pic) : member.pic}
                  </div>
                </div>

                <div className="spv-followup-field">
                  <span className="spv-field-label">{t('Status')}</span>
                  <select
                    className="spv-followup-status"
                    value={member.status}
                    disabled={!member.contactPermission || savingStatusId === member.id}
                    onChange={(event) => handleStatusChange(member, event.target.value)}
                  >
                    {tabs.slice(1).map((status) => (
                      <option key={status} value={status}>{t(status)}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="spv-history-button"
                    disabled={!member.followupId}
                    onClick={() => openHistory(member)}
                  >
                    {t('Lihat Riwayat')}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="spv-followups-empty">
              <span>⌕</span>
              <strong>{error ? t('Data follow-up tidak dapat dimuat') : t('Tidak ada follow-up ditemukan')}</strong>
              <p>
                {error
                  ? t('Periksa koneksi backend lalu coba lagi.')
                  : t('Belum ada pelanggan yang sesuai dengan pencarian atau filter yang digunakan.')}
              </p>
            </div>
          )}
        </div>

        <div className="spv-followups-footer">
          {t('Menampilkan {{shown}} dari {{total}} follow-up', {
            shown: formatNumber(filteredData.length),
            total: formatNumber(followUps.length),
          })}
        </div>

        {selectedHistoryMember && (
          <div className="spv-history-overlay">
            <div className="spv-history-modal">
              <div className="spv-history-header">
                <div>
                  <h2>{t('Riwayat Follow-Up')}</h2>
                  <p>{selectedHistoryMember.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHistoryMember(null)}
                  aria-label={t('Tutup riwayat')}
                >
                  ✕
                </button>
              </div>

              {historyError && <p role="alert">{t(historyError)}</p>}
              {historyLoading ? (
                <p className="spv-history-empty">{t('Memuat riwayat...')}</p>
              ) : (
                <>
                  <section className="spv-history-section">
                    <h3>{t('Riwayat Perubahan Status')}</h3>
                    {statusEvents.length ? statusEvents.map((event) => (
                      <div className="spv-history-item" key={event.id}>
                        <strong>
                          {t(statusLabels[event.previousStatus] || event.previousStatus)}
                          {' → '}
                          {t(statusLabels[event.newStatus] || event.newStatus)}
                        </strong>
                        <span>
                          {formatDateTime(event.createdAt, {
                            dateStyle: 'long',
                            timeStyle: 'short',
                          })}
                        </span>
                        <small>{t('Petugas')}: {event.performedBy || t('Tidak diketahui')}</small>
                      </div>
                    )) : (
                      <p className="spv-history-empty">{t('Belum ada perubahan status.')}</p>
                    )}
                  </section>

                  <section className="spv-history-section">
                    <h3>{t('Persetujuan dan Penugasan')}</h3>
                    {otherEvents.length ? otherEvents.map((event) => (
                      <div className="spv-history-item" key={event.id}>
                        <strong>{t(event.eventType)}</strong>
                        <span>{formatDateTime(event.createdAt, {
                          dateStyle: 'long',
                          timeStyle: 'short',
                        })}</span>
                        {event.note && <small>{event.note}</small>}
                        <small>{t('Petugas')}: {event.performedBy || t('Tidak diketahui')}</small>
                        <small>{t('PIC')}: {event.picName || t('Belum ditugaskan')}</small>
                      </div>
                    )) : (
                      <p className="spv-history-empty">{t('Belum ada persetujuan atau penugasan.')}</p>
                    )}
                  </section>

                  <section className="spv-activity-form">
                    <h3>{t('Tambah Aktivitas')}</h3>
                    <label htmlFor="followup-channel">{t('Metode komunikasi')}</label>
                    <select
                      id="followup-channel"
                      value={activityType}
                      onChange={(event) => setActivityType(event.target.value)}
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Telepon">{t('Telepon')}</option>
                      <option value="Kunjungan">{t('Kunjungan langsung')}</option>
                    </select>

                    <label htmlFor="followup-note">{t('Catatan aktivitas')}</label>
                    <textarea
                      id="followup-note"
                      value={activityNote}
                      onChange={(event) => setActivityNote(event.target.value)}
                      placeholder={t('Tuliskan aktivitas yang dilakukan...')}
                      rows={3}
                    />

                    <label htmlFor="followup-result">{t('Hasil tindak lanjut')}</label>
                    <input
                      id="followup-result"
                      type="text"
                      value={activityResult}
                      onChange={(event) => setActivityResult(event.target.value)}
                      placeholder={t('Contoh: Pelanggan tertarik memperpanjang')}
                    />
                    {!selectedHistoryMember.contactPermission && (
                      <p role="alert">{t('Izin kontak ditolak; aktivitas kontak tidak dapat disimpan.')}</p>
                    )}
                    <button
                      type="button"
                      disabled={
                        !activityNote.trim()
                        || savingActivity
                        || !selectedHistoryMember.contactPermission
                      }
                      onClick={handleAddActivity}
                    >
                      {savingActivity ? t('Menyimpan...') : t('Simpan Aktivitas')}
                    </button>
                  </section>

                  <section className="spv-activity-list">
                    <h3>{t('Aktivitas Sebelumnya')}</h3>
                    {activityEvents.length ? activityEvents.map((event) => (
                      <div className="spv-activity-item" key={event.id}>
                        <strong>{t(event.channel)}</strong>
                        <span>{formatDateTime(event.createdAt)}</span>
                        <p>{event.note}</p>
                        {event.result && <p><strong>{t('Hasil')}:</strong> {event.result}</p>}
                        <small>{t('Petugas')}: {event.performedBy || t('Tidak diketahui')}</small>
                        <small>{t('PIC pelanggan')}: {event.picName || t('Belum ditugaskan')}</small>
                      </div>
                    )) : (
                      <p className="spv-history-empty">{t('Belum ada aktivitas yang dicatat.')}</p>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default SPVFollowUps;
