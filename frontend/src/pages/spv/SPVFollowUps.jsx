
import { useMemo, useState } from 'react';
import '../../assets/styles/spv/SPVFollowUps.css';

const followUpData = [
  {
    id: 1,
    initials: 'RP',
    name: 'Rina Pramesti',
    package: 'Open Gym Bulanan',
    goal: 'Perpanjangan',
    priority: 75,
    due: 'Hari ini, 10.00',
    deadline: 'Berakhir 16 Okt · H-2',
    pic: 'Alya',
    status: 'Perlu ditinjau',
  },
  {
    id: 2,
    initials: 'DS',
    name: 'Dimas Saputra',
    package: 'Trial Group Class',
    goal: 'Trial',
    priority: 82,
    due: 'Hari ini, 10.30',
    deadline: 'Trial kemarin',
    pic: 'Belum ditugaskan',
    status: 'Perlu ditinjau',
  },
  {
    id: 3,
    initials: 'NP',
    name: 'Nadia Putri',
    package: 'Open Gym 3 Bulan',
    goal: 'Perpanjangan',
    priority: 64,
    due: 'Hari ini, 13.00',
    deadline: 'Berakhir 19 Okt · H-5',
    pic: 'Alya',
    status: 'Menunggu balasan',
  },
  {
    id: 4,
    initials: 'BW',
    name: 'Bagas Wicaksono',
    package: 'Personal Training',
    goal: 'Perpanjangan',
    priority: 56,
    due: 'Hari ini, 15.00',
    deadline: 'Berakhir 20 Okt · H-6',
    pic: 'Fajar',
    status: 'Ditunda',
  },
  {
    id: 5,
    initials: 'SL',
    name: 'Sari Lestari',
    package: 'Trial Open Gym',
    goal: 'Trial',
    priority: 36,
    due: 'Besok, 09.30',
    deadline: 'Trial 2 hari lalu',
    pic: 'Fajar',
    status: 'Selesai',
  },
  {
    id: 6,
    initials: 'AR',
    name: 'Arif Ramadhan',
    package: 'Open Gym Tahunan',
    goal: 'Perpanjangan',
    priority: 28,
    due: 'Besok, 11.00',
    deadline: 'Berakhir 27 Okt · H-13',
    pic: 'Alya',
    status: 'Perlu ditinjau',
  },
  {
    id: 7,
    initials: 'ML',
    name: 'Maya Laksmi',
    package: 'Yoga Bulanan',
    goal: 'Perpanjangan',
    priority: 71,
    due: 'Diblokir',
    deadline: 'Izin kontak ditarik',
    pic: 'Alya',
    status: 'Diblokir',
  },
  {
    id: 8,
    initials: 'FH',
    name: 'Farhan Hadi',
    package: 'Personal Training',
    goal: 'Trial',
    priority: 45,
    due: 'Besok, 14.00',
    deadline: 'Trial 1 hari lalu',
    pic: 'Fajar',
    status: 'Menunggu balasan',
  },
];

const tabs = [
  'Semua',
  'Perlu ditinjau',
  'Menunggu balasan',
  'Ditunda',
  'Selesai',
  'Diblokir',
];

function getPriorityLabel(score) {
  if (score >= 75) return 'Tinggi';
  if (score >= 50) return 'Sedang';
  return 'Rendah';
}

function getPriorityClass(score) {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function SPVFollowUps() {
  const [activeTab, setActiveTab] = useState('Semua');
  const [search, setSearch] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('Semua tujuan');
  const [selectedPIC, setSelectedPIC] = useState('Semua PIC');

  const filteredData = useMemo(() => {
    return followUpData.filter((member) => {
      const matchesTab =
        activeTab === 'Semua' || member.status === activeTab;

      const matchesSearch =
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.package.toLowerCase().includes(search.toLowerCase());

      const matchesGoal =
        selectedGoal === 'Semua tujuan' ||
        member.goal === selectedGoal;

      const matchesPIC =
        selectedPIC === 'Semua PIC' ||
        member.pic === selectedPIC;

      return matchesTab && matchesSearch && matchesGoal && matchesPIC;
    });
  }, [activeTab, search, selectedGoal, selectedPIC]);

  const getTabCount = (tab) => {
    if (tab === 'Semua') return followUpData.length;

    return followUpData.filter(
      (member) => member.status === tab
    ).length;
  };

  const handleReview = (member) => {
    alert(`Detail anggota ${member.name} akan kita buat berikutnya.`);
  };

  return (
    <div className="spv-followups">
      <div className="spv-followups-heading">
        <div>
          <span className="spv-section-label">SMART FOLLOW-UP</span>
          <h1>Semua follow-up</h1>
          <p>Kelola seluruh tindak lanjut member dari satu tempat.</p>
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
          <div className="spv-followups-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Cari nama atau paket"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={selectedGoal}
            onChange={(event) => setSelectedGoal(event.target.value)}
          >
            <option>Semua tujuan</option>
            <option>Perpanjangan</option>
            <option>Trial</option>
          </select>

          <select
            value={selectedPIC}
            onChange={(event) => setSelectedPIC(event.target.value)}
          >
            <option>Semua PIC</option>
            <option>Alya</option>
            <option>Fajar</option>
            <option>Belum ditugaskan</option>
          </select>
        </div>

        <div className="spv-followups-list">
          {filteredData.length > 0 ? (
            filteredData.map((member) => (
              <article className="spv-followup-row" key={member.id}>
                <div className="spv-member-identity">
                  <div className="spv-member-avatar">
                    {member.initials}
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
                    <span className={`spv-priority-tag ${getPriorityClass(member.priority)}`}>
                      {getPriorityLabel(member.priority)}
                    </span>
                  </div>
                </div>

                <div className="spv-followup-field">
                  <span className="spv-field-label">Tenggat</span>
                  <strong>{member.due}</strong>
                  <span>{member.deadline}</span>
                </div>

                <div className="spv-followup-field">
                  <span className="spv-field-label">PIC</span>
                  <div className="spv-pic">
                    <span className="spv-pic-avatar">
                      {member.pic === 'Belum ditugaskan'
                        ? '?'
                        : member.pic.charAt(0)}
                    </span>
                    {member.pic}
                  </div>
                </div>

                <button
                  type="button"
                  className="spv-review-button"
                  onClick={() => handleReview(member)}
                >
                  Tinjau <span>›</span>
                </button>
              </article>
            ))
          ) : (
            <div className="spv-followups-empty">
              <span>⌕</span>
              <strong>Tidak ada follow-up ditemukan</strong>
              <p>Coba ubah pencarian atau filter yang digunakan.</p>
            </div>
          )}
        </div>

        <div className="spv-followups-footer">
          Menampilkan {filteredData.length} dari {followUpData.length} follow-up
        </div>
      </section>
    </div>
  );
}

export default SPVFollowUps;
