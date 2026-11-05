import '../../assets/styles/spv/SPVDashboard.css';

const summaryData = [
  {
    title: 'Total Follow-up',
    value: '48',
    description: 'Seluruh follow-up hari ini',
    icon: '📋',
  },
  {
    title: 'Prioritas Tinggi',
    value: '12',
    description: 'Perlu segera ditangani',
    icon: '🔥',
  },
  {
    title: 'Menunggu Balasan',
    value: '18',
    description: 'Sudah dikirim ke pelanggan',
    icon: '⏳',
  },
  {
    title: 'Selesai',
    value: '18',
    description: 'Follow-up telah ditangani',
    icon: '✓',
  },
];

const priorityMembers = [
  {
    id: 1,
    name: 'Rina Amelia',
    phone: '0812-xxxx-1234',
    absences: 5,
    priority: 'High',
    pic: 'Andi',
    status: 'Belum ditangani',
  },
  {
    id: 2,
    name: 'Budi Santoso',
    phone: '0813-xxxx-2345',
    absences: 3,
    priority: 'Medium',
    pic: 'Sinta',
    status: 'Menunggu balasan',
  },
  {
    id: 3,
    name: 'Dewi Lestari',
    phone: '0856-xxxx-3456',
    absences: 2,
    priority: 'Medium',
    pic: 'Andi',
    status: 'Belum ditangani',
  },
  {
    id: 4,
    name: 'Agus Pratama',
    phone: '0819-xxxx-4567',
    absences: 1,
    priority: 'Low',
    pic: 'Rizky',
    status: 'Selesai',
  },
];

const teamActivities = [
  {
    id: 1,
    name: 'Andi',
    activity: 'Menangani follow-up Rina Amelia',
    time: '10 menit lalu',
  },
  {
    id: 2,
    name: 'Sinta',
    activity: 'Mengirim pesan kepada Budi Santoso',
    time: '25 menit lalu',
  },
  {
    id: 3,
    name: 'Rizky',
    activity: 'Menyelesaikan follow-up Agus Pratama',
    time: '40 menit lalu',
  },
];

function Dashboard() {
  return (
    <div className="spv-dashboard">
      <div className="spv-dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p>
            Pantau aktivitas tim dan perkembangan follow-up pelanggan.
          </p>
        </div>

        <span className="spv-dashboard-date">
          Ringkasan Hari Ini
        </span>
      </div>

      <section className="spv-summary-grid">
        {summaryData.map((item) => (
          <div className="spv-summary-card" key={item.title}>
            <div className="spv-summary-top">
              <span>{item.title}</span>
              <span className="spv-summary-icon">{item.icon}</span>
            </div>

            <h2>{item.value}</h2>
            <p>{item.description}</p>
          </div>
        ))}
      </section>

      <div className="spv-dashboard-grid">
        <section className="spv-panel spv-priority-panel">
          <div className="spv-panel-heading">
            <div>
              <h2>Prioritas Follow-up</h2>
              <p>Anggota yang membutuhkan perhatian tim</p>
            </div>

            <button className="spv-text-button">
              Lihat Semua
            </button>
          </div>

          <div className="spv-table-wrapper">
            <table className="spv-priority-table">
              <thead>
                <tr>
                  <th>Nama Anggota</th>
                  <th>Absen</th>
                  <th>Prioritas</th>
                  <th>PIC</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {priorityMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <strong>{member.name}</strong>
                      <span>{member.phone}</span>
                    </td>

                    <td>{member.absences} kali</td>

                    <td>
                      <span
                        className={`spv-priority-badge ${member.priority.toLowerCase()}`}
                      >
                        {member.priority}
                      </span>
                    </td>

                    <td>{member.pic}</td>

                    <td>{member.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="spv-side-panels">
          <section className="spv-panel">
            <div className="spv-panel-heading">
              <div>
                <h2>Aktivitas Tim</h2>
                <p>Aktivitas terbaru PIC</p>
              </div>
            </div>

            <div className="spv-activity-list">
              {teamActivities.map((activity) => (
                <div className="spv-activity-item" key={activity.id}>
                  <div className="spv-activity-avatar">
                    {activity.name.charAt(0)}
                  </div>

                  <div>
                    <strong>{activity.name}</strong>
                    <p>{activity.activity}</p>
                    <span>{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="spv-panel spv-attention-panel">
            <h2>Perlu Perhatian</h2>

            <div className="spv-attention-item">
              <span className="spv-attention-dot" />
              <div>
                <strong>3 follow-up terlambat</strong>
                <p>Belum ditangani sesuai jadwal.</p>
              </div>
            </div>

            <div className="spv-attention-item">
              <span className="spv-attention-dot warning" />
              <div>
                <strong>5 pelanggan belum merespons</strong>
                <p>Perlu pemantauan lanjutan.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
