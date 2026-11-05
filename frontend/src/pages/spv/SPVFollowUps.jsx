import { useEffect, useMemo, useState } from 'react';
import {
  getAttendance,
  getLastVisit,
} from '../../utils/attendance-storage';
import { subscribeToStorage } from '../../utils/storage-sync';
import '../../assets/styles/spv/SPVFollowUps.css';

const CUSTOMER_STORAGE_KEY = 'gymnasyum_customers';
const ACCOUNT_STORAGE_KEY = 'gymnasyum_accounts';
const FOLLOWUP_STORAGE_KEY = 'gymnasyum_followups';
const FOLLOWUP_HISTORY_KEY = 'gymnasyum_followup_history';
const FOLLOWUP_ACTIVITY_KEY = 'gymnasyum_followup_activities';

const tabs = [
  'Semua',
  'Perlu ditinjau',
  'Menunggu balasan',
  'Ditunda',
  'Selesai',
  'Diblokir',
];

const readStorage = (key, fallback) => {
  try {
    const savedData = localStorage.getItem(key);
    return savedData ? JSON.parse(savedData) : fallback;
  } catch {
    return fallback;
  }
};

const getCustomerId = (customer, index) =>
  String(customer.id ?? customer.phone ?? customer.name ?? index);

const getPicName = (pic, accounts) => {
  if (!pic || pic === 'Belum ditugaskan') {
    return 'Belum ditugaskan';
  }

  const account = accounts.find(
    (item) =>
      String(item.id) === String(pic) ||
      item.name === pic
  );

  return account?.name ?? pic;
};

const parseDate = (value) => {
  if (!value || value === '-') return null;

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  const months = {
    jan: 0, feb: 1, mar: 2, apr: 3,
    mei: 4, jun: 5, jul: 6, agu: 7,
    sep: 8, okt: 9, nov: 10, des: 11,
  };

  const match = String(value).match(
    /^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/
  );

  if (!match) return null;

  const month = months[match[2].toLowerCase().slice(0, 3)];

  if (month === undefined) return null;

  return new Date(Number(match[3]), month, Number(match[1]));
};

const getVisitFrequencyScore = (customerId, attendance, lastVisit) => {
  // Jika belum ada riwayat kunjungan, gunakan skor dasar.
  if (!lastVisit || lastVisit === '-') return 28;

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const visitsLast30Days = attendance.filter((item) => {
    const visitDate = parseDate(item.visitAt);

    return (
      String(item.customerId) === String(customerId) &&
      visitDate &&
      visitDate >= thirtyDaysAgo &&
      visitDate <= today
    );
  }).length;

  if (visitsLast30Days === 0) return 85;
  if (visitsLast30Days === 1) return 70;
  if (visitsLast30Days <= 3) return 55;
  if (visitsLast30Days <= 7) return 40;

  return 28;
};

const getPriority = (lastVisit, membershipEnd, frequencyScore) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let score = 28;

  // 1. Menghitung lama pelanggan tidak berkunjung.
  const lastVisitDate = parseDate(lastVisit);

  if (!lastVisitDate) {
    score = 75;
  } else {
    lastVisitDate.setHours(0, 0, 0, 0);

    const daysInactive = Math.floor(
      (today - lastVisitDate) / (1000 * 60 * 60 * 24)
    );

    if (daysInactive >= 30) {
      score = Math.max(score, 85);
    } else if (daysInactive >= 14) {
      score = Math.max(score, 75);
    } else if (daysInactive >= 7) {
      score = Math.max(score, 56);
    }
  }

  // 2. Menghitung sisa masa membership.
  const membershipDate = parseDate(membershipEnd);

  if (membershipDate) {
    membershipDate.setHours(0, 0, 0, 0);

    const daysRemaining = Math.ceil(
      (membershipDate - today) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining < 0) {
      score = Math.max(score, 95);
    } else if (daysRemaining <= 3) {
      score = Math.max(score, 90);
    } else if (daysRemaining <= 7) {
      score = Math.max(score, 80);
    } else if (daysRemaining <= 14) {
      score = Math.max(score, 65);
    } else if (daysRemaining <= 30) {
      score = Math.max(score, 48);
    }
  }
  score = Math.max(score, frequencyScore);
  return Math.min(score, 100);
};

const getPriorityLabel = (score) => {
  if (score >= 70) return 'Tinggi';
  if (score >= 40) return 'Sedang';
  return 'Rendah';
};

const getPriorityClass = (score) => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const getRecommendation = (customer, lastVisit) => {
  // Prioritas pertama: periksa izin kontak.
  if (customer.contactPermission === 'Ditolak') {
    return 'Jangan hubungi';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Periksa masa berlaku membership.
  const membershipEnd = parseDate(
    customer.membershipEnd ??
      customer.membershipEndDate ??
      customer.endDate ??
      customer.expiresAt
  );

  if (membershipEnd) {
    membershipEnd.setHours(0, 0, 0, 0);

    const daysRemaining = Math.ceil(
      (membershipEnd - today) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining >= 0 && daysRemaining <= 7) {
      return 'Hubungi untuk perpanjangan';
    }
  }

  // Periksa aktivitas kunjungan.
  const lastVisitDate = parseDate(lastVisit);

  if (!lastVisitDate) {
    return 'Evaluasi pelanggan yang tidak aktif';
  }

  lastVisitDate.setHours(0, 0, 0, 0);

  const daysInactive = Math.floor(
    (today - lastVisitDate) / (1000 * 60 * 60 * 24)
  );

  if (daysInactive >= 30) {
    return 'Evaluasi pelanggan yang tidak aktif';
  }

  if (daysInactive >= 14) {
    return 'Ingatkan jadwal kunjungan';
  }

  return 'Belum perlu tindakan khusus';
};

const getPriorityReason = (customer, lastVisit) => {
  if (customer.contactPermission === 'Ditolak') {
    return 'Izin kontak ditolak. Jangan hubungi pelanggan.';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const membershipEnd = parseDate(
    customer.membershipEnd ??
      customer.membershipEndDate ??
      customer.endDate ??
      customer.expiresAt
  );

  if (membershipEnd) {
    membershipEnd.setHours(0, 0, 0, 0);

    const daysRemaining = Math.ceil(
      (membershipEnd - today) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining >= 0 && daysRemaining <= 7) {
      return `Membership akan berakhir dalam ${daysRemaining} hari.`;
    }
  }

  const lastVisitDate = parseDate(lastVisit);

  if (!lastVisitDate) {
    return 'Belum memiliki riwayat kunjungan.';
  }

  lastVisitDate.setHours(0, 0, 0, 0);

  const daysInactive = Math.floor(
    (today - lastVisitDate) / (1000 * 60 * 60 * 24)
  );

  if (daysInactive >= 30) {
    return `Tidak berkunjung selama ${daysInactive} hari.`;
  }

  if (daysInactive >= 14) {
    return `Sudah ${daysInactive} hari tidak berkunjung.`;
  }

  return 'Aktivitas pelanggan masih tergolong aktif.';
};

const getGoal = (packageName = '') =>
  packageName.toLowerCase().includes('trial')
    ? 'Trial'
    : 'Perpanjangan';

const getDeadline = (customer) => {
  const endDate =
    customer.membershipEnd ??
    customer.membershipEndDate ??
    customer.endDate ??
    customer.expiresAt;

  if (!endDate) return 'Masa membership belum ditentukan';

  const date = parseDate(endDate);

  if (!date) return `Berakhir ${endDate}`;

  return `Berakhir ${date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
};

function SPVFollowUps() {
  const [customers, setCustomers] = useState(() =>
    readStorage(CUSTOMER_STORAGE_KEY, [])
  );

  const [recommendationFilter, setRecommendationFilter] = useState(
    'Semua rekomendasi'
  );

  const [accounts, setAccounts] = useState(() =>
  readStorage(ACCOUNT_STORAGE_KEY, [])
  );

  const [attendance, setAttendance] = useState(() =>
    getAttendance()
  );

  const [followUpStatuses, setFollowUpStatuses] = useState(() =>
    readStorage(FOLLOWUP_STORAGE_KEY, {})
  );

  const [followUpHistory, setFollowUpHistory] = useState(() =>
  readStorage(FOLLOWUP_HISTORY_KEY, [])
  );

  const [followUpActivities, setFollowUpActivities] = useState(() =>
  readStorage(FOLLOWUP_ACTIVITY_KEY, [])
  );

  const [activityType, setActivityType] = useState('WhatsApp');
  const [activityNote, setActivityNote] = useState('');
  const [activityResult, setActivityResult] = useState('');
  const [selectedHistoryMember, setSelectedHistoryMember] = useState(null);
  const [activeTab, setActiveTab] = useState('Semua');
  const [search, setSearch] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('Semua tujuan');
  const [selectedPIC, setSelectedPIC] = useState('Semua PIC');

  // Sinkronisasi data pelanggan, akun, dan absensi.
  useEffect(() => {

  const loadCustomers = () => {
    setCustomers(readStorage(CUSTOMER_STORAGE_KEY, []));
  };

  const loadAccounts = () => {
    setAccounts(readStorage(ACCOUNT_STORAGE_KEY, []));
  };

  const loadAttendance = () => {
    setAttendance(getAttendance());
  };

  const unsubscribeCustomers = subscribeToStorage(
    CUSTOMER_STORAGE_KEY,
    loadCustomers
  );

  const unsubscribeAccounts = subscribeToStorage(
    ACCOUNT_STORAGE_KEY,
    loadAccounts
  );

  const unsubscribeAttendance = subscribeToStorage(
    'gymnasyum_visits',
    loadAttendance
  );

  return () => {
    unsubscribeCustomers();
    unsubscribeAccounts();
    unsubscribeAttendance();
  };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      FOLLOWUP_STORAGE_KEY,
      JSON.stringify(followUpStatuses)
    );
  }, [followUpStatuses]);

  useEffect(() => {
  localStorage.setItem(
    FOLLOWUP_HISTORY_KEY,
    JSON.stringify(followUpHistory)
  );
  }, [followUpHistory]);

  useEffect(() => {
    localStorage.setItem(
      FOLLOWUP_ACTIVITY_KEY,
      JSON.stringify(followUpActivities)
    );
  }, [followUpActivities]);

  const picOptions = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.role === 'Admin/CS & Sales' &&
          account.active === true
      ),
    [accounts]
  );

  const followUps = useMemo(() => {
    return customers
      .map((customer, index) => {
        const id = getCustomerId(customer, index);
        const status = customer.contactPermission === 'Ditolak'
          ? 'Diblokir'
          : followUpStatuses[id] ?? 'Perlu ditinjau';

        const attendanceLastVisit = getLastVisit(
          customer.id,
          attendance
        );

        const lastVisit =
          attendanceLastVisit !== '-'
            ? attendanceLastVisit
            : customer.lastVisit ?? '-';

        const frequencyScore = getVisitFrequencyScore(
          customer.id,
          attendance,
          lastVisit
        );

        const priority = getPriority(
          lastVisit,
          customer.membershipEnd ??
            customer.membershipEndDate ??
            customer.endDate ??
            customer.expiresAt,
          frequencyScore
        );

        const name = customer.name ?? 'Tanpa nama';
        const packageName = customer.package ?? '-';

        return {
          id,
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
          priorityReason: getPriorityReason(customer, lastVisit),
          recommendation: getRecommendation(customer, lastVisit),
          due: getDeadline(customer),
          deadline: lastVisit !== '-'
            ? `Kunjungan terakhir: ${lastVisit}`
            : 'Belum memiliki riwayat kunjungan',
          pic: getPicName(customer.pic, accounts),
          status,
          contactPermission: customer.contactPermission,
          phone: customer.phone ?? '',
        };
      })
      .sort((a, b) => {
        const aBlocked = a.recommendation === 'Jangan hubungi';
        const bBlocked = b.recommendation === 'Jangan hubungi';

        if (aBlocked !== bBlocked) {
          return Number(aBlocked) - Number(bBlocked);
        }

        return b.priority - a.priority;
      });
  }, [customers, accounts, attendance, followUpStatuses]);

  const filteredData = useMemo(() => {
  return followUps.filter((member) => {
    const matchesTab =
      activeTab === 'Semua' || member.status === activeTab;

    const keyword = search.toLowerCase();

    const matchesSearch =
      member.name.toLowerCase().includes(keyword) ||
      member.package.toLowerCase().includes(keyword) ||
      member.phone.toLowerCase().includes(keyword) ||
      member.pic.toLowerCase().includes(keyword);

    const matchesGoal =
      selectedGoal === 'Semua tujuan' ||
      member.goal === selectedGoal;

    const matchesPIC =
      selectedPIC === 'Semua PIC' ||
      member.pic === selectedPIC;

    const matchesRecommendation =
      recommendationFilter === 'Semua rekomendasi' ||
      member.recommendation === recommendationFilter;

    return (
      matchesTab &&
      matchesSearch &&
      matchesGoal &&
      matchesPIC &&
      matchesRecommendation
    );
  });
}, [
  followUps,
  activeTab,
  search,
  selectedGoal,
  selectedPIC,
  recommendationFilter,
  ]);

  const handleAddActivity = () => {
  if (!selectedHistoryMember || !activityNote.trim()) {
    return;
  }

  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem('gymnasyum_session')
    );
  } catch (error) {
    console.error('Gagal membaca sesi pengguna:', error);
  }

  const newActivity = {
    id: Date.now(),
    customerId: selectedHistoryMember.id,
    customerName: selectedHistoryMember.name,

    type: activityType,
    note: activityNote.trim(),
    result: activityResult.trim(),

    pic: selectedHistoryMember.pic,

    performedById: currentUser?.id ?? null,
    performedBy: currentUser?.name ?? 'Tidak diketahui',
    performedByRole:
      currentUser?.accountRole ?? currentUser?.role ?? '-',

    createdAt: new Date().toISOString(),
  };

  setFollowUpActivities((previous) => [
    newActivity,
    ...previous,
  ]);

  setActivityNote('');
  setActivityResult('');
  setActivityType('WhatsApp');
  };

  const getTabCount = (tab) => {
    if (tab === 'Semua') return followUps.length;

    return followUps.filter(
      (member) => member.status === tab
    ).length;
  };

  const handleStatusChange = (memberId, nextStatus) => {
  const member = followUps.find(
    (item) => String(item.id) === String(memberId)
  );

  if (!member || member.status === nextStatus) return;

  setFollowUpHistory((previous) => [
    {
      id: Date.now(),
      customerId: memberId,
      customerName: member.name,
      previousStatus: member.status,
      newStatus: nextStatus,
      changedAt: new Date().toISOString(),
    },
    ...previous,
  ]);

  setFollowUpStatuses((previous) => ({
    ...previous,
    [memberId]: nextStatus,
  }));
  };

  return (
    <div className="spv-followups">
      <div className="spv-followups-heading">
        <div>
          <span className="spv-section-label">
            SMART FOLLOW-UP
          </span>
          <h1>Semua follow-up</h1>
          <p>
            Kelola seluruh tindak lanjut member dari satu tempat.
          </p>
        </div>
      </div>

      <section className="spv-followups-panel">
        <div className="spv-followups-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`spv-followups-tab ${
                activeTab === tab ? 'active' : ''
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              <span>{getTabCount(tab)}</span>
            </button>
          ))}
        </div>

        <div className="spv-followups-filters">
          <select
            value={recommendationFilter}
            onChange={(event) => setRecommendationFilter(event.target.value)}
          >
            <option value="Semua rekomendasi">Semua rekomendasi</option>
            <option value="Hubungi untuk perpanjangan">
              Hubungi untuk perpanjangan
            </option>
            <option value="Ingatkan jadwal kunjungan">
              Ingatkan jadwal kunjungan
            </option>
            <option value="Evaluasi pelanggan yang tidak aktif">
              Evaluasi pelanggan yang tidak aktif
            </option>
            <option value="Belum perlu tindakan khusus">
              Belum perlu tindakan khusus
            </option>
            <option value="Jangan hubungi">
              Jangan hubungi
            </option>
          </select>

          <div className="spv-followups-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Cari nama, paket, nomor, atau PIC"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={selectedGoal}
            onChange={(event) => setSelectedGoal(event.target.value)}
          >
            <option value="Semua tujuan">Semua tujuan</option>
            <option value="Perpanjangan">Perpanjangan</option>
            <option value="Trial">Trial</option>
          </select>

          <select
            value={selectedPIC}
            onChange={(event) => setSelectedPIC(event.target.value)}
          >
            <option value="Semua PIC">Semua PIC</option>
            {picOptions.map((account) => (
              <option key={account.id} value={account.name}>
                {account.name}
              </option>
            ))}
            <option value="Belum ditugaskan">
              Belum ditugaskan
            </option>
          </select>
        </div>

        <div className="spv-followups-list">
          {filteredData.length > 0 ? (
            filteredData.map((member) => (
              <article
                className="spv-followup-row"
                key={member.id}
              >
                <div className="spv-member-identity">
                  <div className="spv-member-avatar">
                    {member.initials || '?'}
                  </div>

                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.package}</span>
                  </div>
                </div>

                <div className="spv-followup-field">
                  <span className="spv-field-label">Tujuan</span>
                  <span className="spv-goal-tag">{member.goal}</span>
                </div>

                <div className="spv-followup-field">
                  <span className="spv-field-label">Prioritas</span>

                  <div className="spv-priority-value">
                    <strong>{member.priority}</strong>
                    <span
                      className={`spv-priority-tag ${getPriorityClass(
                        member.priority
                      )}`}
                    >
                      {getPriorityLabel(member.priority)}
                    </span>
                  </div>

                  <small className="spv-priority-reason">
                    {member.priorityReason}
                  </small>
                </div>

                <div className="spv-followup-field">
                  <span className="spv-field-label">
                    Informasi kunjungan
                  </span>
                  <strong>{member.due}</strong>
                  <span>{member.deadline}</span>
                </div>

                <div className="spv-followup-recommendation">
                  <span>Rekomendasi tindakan</span>
                  <strong>{member.recommendation}</strong>
                </div>

                <div className="spv-followup-field">
                  <span className="spv-field-label">PIC</span>

                  <div className="spv-pic">
                    <span className="spv-pic-avatar">
                      {member.pic === 'Belum ditugaskan'
                        ? '?'
                        : member.pic.charAt(0).toUpperCase()}
                    </span>
                    {member.pic}
                  </div>
                </div>

                <div className="spv-followup-field">
                  <span className="spv-field-label">Status</span>

                  <select
                    className="spv-followup-status"
                    value={member.status}
                    disabled={member.contactPermission === 'Ditolak'}
                    onChange={(event) =>
                      handleStatusChange(member.id, event.target.value)
                    }
                  >
                    <option value="Perlu ditinjau">Perlu ditinjau</option>
                    <option value="Menunggu balasan">Menunggu balasan</option>
                    <option value="Ditunda">Ditunda</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Diblokir">Diblokir</option>
                  </select>

                  <button
                    type="button"
                    className="spv-history-button"
                    onClick={() => setSelectedHistoryMember(member)}
                  >
                    Lihat Riwayat
                  </button>
                </div>

              </article>
            ))
          ) : (
            <div className="spv-followups-empty">
              <span>⌕</span>
              <strong>Tidak ada follow-up ditemukan</strong>
              <p>
                Belum ada pelanggan yang sesuai dengan pencarian
                atau filter yang digunakan.
              </p>
            </div>
          )}
        </div>    

        <div className="spv-followups-footer">
          Menampilkan {filteredData.length} dari {followUps.length}{' '}
          follow-up
        </div>
        
        {selectedHistoryMember && (
            <div className="spv-history-overlay">
              <div className="spv-history-modal">
                {/* Header */}
                <div className="spv-history-header">
                  <div>
                    <h2>Riwayat Follow-Up</h2>
                    <p>{selectedHistoryMember.name}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedHistoryMember(null)}
                    aria-label="Tutup riwayat"
                  >
                    ✕
                  </button>
                </div>

                {/* Riwayat perubahan status */}
                <section className="spv-history-section">
                  <h3>Riwayat Perubahan Status</h3>

                  {followUpHistory.filter(
                    (item) =>
                      String(item.customerId) ===
                      String(selectedHistoryMember.id)
                  ).length > 0 ? (
                    followUpHistory
                      .filter(
                        (item) =>
                          String(item.customerId) ===
                          String(selectedHistoryMember.id)
                      )
                      .map((item) => (
                        <div className="spv-history-item" key={item.id}>
                          <strong>
                            {item.previousStatus} → {item.newStatus}
                          </strong>
                          <span>
                            {new Date(item.changedAt).toLocaleString('id-ID', {
                              dateStyle: 'long',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="spv-history-empty">
                      Belum ada perubahan status.
                    </p>
                  )}
                </section>

                {/* Form aktivitas */}
                <section className="spv-activity-form">
                  <h3>Tambah Aktivitas</h3>

                  <label>Metode komunikasi</label>
                  <select
                    value={activityType}
                    onChange={(event) => setActivityType(event.target.value)}
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Telepon">Telepon</option>
                    <option value="Kunjungan">Kunjungan langsung</option>
                  </select>

                  <label>Catatan aktivitas</label>
                  <textarea
                    value={activityNote}
                    onChange={(event) => setActivityNote(event.target.value)}
                    placeholder="Tuliskan aktivitas yang dilakukan..."
                    rows={3}
                  />

                  <label>Hasil tindak lanjut</label>
                  <input
                    type="text"
                    value={activityResult}
                    onChange={(event) => setActivityResult(event.target.value)}
                    placeholder="Contoh: Pelanggan tertarik memperpanjang"
                  />

                  <button
                    type="button"
                    disabled={!activityNote.trim()}
                    onClick={handleAddActivity}
                  >
                    Simpan Aktivitas
                  </button>
                </section>

                {/* Daftar aktivitas */}
                <section className="spv-activity-list">
                  <h3>Aktivitas Sebelumnya</h3>

                  {followUpActivities.filter(
                    (item) =>
                      String(item.customerId) ===
                      String(selectedHistoryMember.id)
                  ).length > 0 ? (
                    followUpActivities
                      .filter(
                        (item) =>
                          String(item.customerId) ===
                          String(selectedHistoryMember.id)
                      )
                      .map((item) => (
                        <div className="spv-activity-item" key={item.id}>
                          <strong>{item.type}</strong>

                          <span>
                            {new Date(item.createdAt).toLocaleString('id-ID')}
                          </span>

                          <p>{item.note}</p>

                          {item.result && (
                            <p>
                              <strong>Hasil:</strong> {item.result}
                            </p>
                          )}

                          <small>Petugas: {item.performedBy || 'Tidak diketahui'}</small>
                          <small>PIC pelanggan: {item.pic}</small>
                        </div>
                      ))
                  ) : (
                    <p className="spv-history-empty">
                      Belum ada aktivitas yang dicatat.
                    </p>
                  )}
                </section>
              </div>
            </div>
        )}


      </section>
    </div>
  );
}

export default SPVFollowUps;