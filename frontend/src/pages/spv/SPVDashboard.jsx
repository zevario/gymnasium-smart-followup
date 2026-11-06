
import { useEffect, useState } from 'react';
import { getAttendance } from '../../utils/attendance-storage';
import '../../assets/styles/spv/SPVDashboard.css';

const getToday = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    try {
      const savedCustomers = localStorage.getItem('gymnasyum_customers');

      setCustomers(
        savedCustomers ? JSON.parse(savedCustomers) : []
      );
    } catch (error) {
      console.error('Gagal membaca data member:', error);
      setCustomers([]);
    }

    setAttendance(getAttendance());
  }, []);

  const today = getToday();

  const todayAttendance = attendance.filter((item) => {
    if (!item.visitAt) return false;

    return new Date(item.visitAt).toLocaleDateString('en-CA') === today;
  });

  const uniqueMembersToday = new Set(
    todayAttendance.map((item) => item.customerId)
  );

  const uniqueStaffToday = new Set(
    todayAttendance.map((item) => item.recordedBy)
  );

  const reviewCustomers = customers.filter(
    (customer) => customer.status === 'Perlu ditinjau'
  );

  const summaryData = [
    {
      title: 'Total Member',
      value: customers.length,
      description: 'Seluruh member terdaftar',
      icon: '👥',
    },
    {
      title: 'Kunjungan Hari Ini',
      value: todayAttendance.length,
      description: 'Total kunjungan tercatat hari ini',
      icon: '📋',
    },
    {
      title: 'Member Berkunjung',
      value: uniqueMembersToday.size,
      description: 'Member unik yang berkunjung hari ini',
      icon: '🏋️',
    },
    {
      title: 'Staff Bertugas',
      value: uniqueStaffToday.size,
      description: 'Staff yang mencatat kunjungan hari ini',
      icon: '👤',
    },
  ];

  const recentAttendance = [...attendance]
    .sort(
      (a, b) => new Date(b.visitAt) - new Date(a.visitAt)
    )
    .slice(0, 5);

  const recentActivities = recentAttendance;

  return (
    <div className="spv-dashboard">
      <div className="spv-dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p>
            Pantau aktivitas kunjungan member dan perkembangan operasional.
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
              <h2>Kunjungan Terbaru</h2>
              <p>Riwayat kunjungan member yang dicatat Staff</p>
            </div>
          </div>

          <div className="spv-table-wrapper">
            <table className="spv-priority-table">
              <thead>
                <tr>
                  <th>Nama Member</th>
                  <th>Waktu Kunjungan</th>
                  <th>Dicatat Oleh</th>
                </tr>
              </thead>

              <tbody>
                {recentAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="3">
                      Belum ada data kunjungan.
                    </td>
                  </tr>
                ) : (
                  recentAttendance.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.customerName}</strong>
                      </td>

                      <td>
                        {formatDateTime(item.visitAt)}
                      </td>

                      <td>{item.recordedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="spv-side-panels">
          <section className="spv-panel">
            <div className="spv-panel-heading">
              <div>
                <h2>Aktivitas Tim</h2>
                <p>Catatan kunjungan terbaru dari Staff</p>
              </div>
            </div>

            <div className="spv-activity-list">
              {recentActivities.length === 0 ? (
                <p>Belum ada aktivitas Staff.</p>
              ) : (
                recentActivities.map((activity) => (
                  <div
                    className="spv-activity-item"
                    key={activity.id}
                  >
                    <div className="spv-activity-avatar">
                      {activity.recordedBy?.charAt(0) || '-'}
                    </div>

                    <div>
                      <strong>{activity.recordedBy}</strong>
                      <p>
                        Mencatat kunjungan {activity.customerName}
                      </p>
                      <span>
                        {formatDateTime(activity.visitAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="spv-panel spv-attention-panel">
            <h2>Perlu Perhatian</h2>

            <div className="spv-attention-item">
              <span className="spv-attention-dot" />
              <div>
                <strong>
                  {reviewCustomers.length} member perlu ditinjau
                </strong>
                <p>
                  Berdasarkan status data member.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
