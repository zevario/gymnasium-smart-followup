
import { useEffect, useState } from 'react';
import { getAllCustomers, getAttendances } from '../../services/api';
import '../../assets/styles/spv/SPVDashboard.css';
import useI18n from '../../i18n/useI18n.js';

const getToday = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

function Dashboard() {
  const { t, formatDateTime, formatNumber } = useI18n();
  const [customers, setCustomers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      getAllCustomers(),
      getAttendances(),
    ])
      .then(([customerData, attendanceData]) => {
        if (!active) return;
        setCustomers(customerData.customers || []);
        setAttendance(attendanceData.attendances || []);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      });
    return () => {
      active = false;
    };
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

  const reviewCustomers = customers.filter((customer) => (
    customer.status === 'inactive'
    || (customer.membership_end && new Date(customer.membership_end) < new Date())
  ));

  const summaryData = [
    {
      title: t('Total Member'),
      value: customers.length,
      description: t('Seluruh member terdaftar'),
      icon: '👥',
    },
    {
      title: t('Kunjungan Hari Ini'),
      value: todayAttendance.length,
      description: t('Total kunjungan tercatat hari ini'),
      icon: '📋',
    },
    {
      title: t('Member Berkunjung'),
      value: uniqueMembersToday.size,
      description: t('Member unik yang berkunjung hari ini'),
      icon: '🏋️',
    },
    {
      title: t('Staff Bertugas'),
      value: uniqueStaffToday.size,
      description: t('Staff yang mencatat kunjungan hari ini'),
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
      {error && <p role="alert">{t(error)}</p>}
      <div className="spv-dashboard-heading">
        <div>
          <h1>{t('Dashboard')}</h1>
          <p>
            {t('Pantau aktivitas kunjungan member dan perkembangan operasional.')}
          </p>
        </div>

        <span className="spv-dashboard-date">
          {t('Ringkasan Hari Ini')}
        </span>
      </div>

      <section className="spv-summary-grid">
        {summaryData.map((item) => (
          <div className="spv-summary-card" key={item.title}>
            <div className="spv-summary-top">
              <span>{item.title}</span>
              <span className="spv-summary-icon">{item.icon}</span>
            </div>

            <h2>{formatNumber(item.value)}</h2>
            <p>{item.description}</p>
          </div>
        ))}
      </section>

      <div className="spv-dashboard-grid">
        <section className="spv-panel spv-priority-panel">
          <div className="spv-panel-heading">
            <div>
              <h2>{t('Kunjungan Terbaru')}</h2>
              <p>{t('Riwayat kunjungan member yang dicatat Staff')}</p>
            </div>
          </div>

          <div className="spv-table-wrapper">
            <table className="spv-priority-table">
              <thead>
                <tr>
                  <th>{t('Nama Member')}</th>
                  <th>{t('Waktu Kunjungan')}</th>
                  <th>{t('Dicatat Oleh')}</th>
                </tr>
              </thead>

              <tbody>
                {recentAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="3">
                      {t('Belum ada data kunjungan.')}
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
                <h2>{t('Kunjungan Staff Terbaru')}</h2>
                <p>{t('Catatan kunjungan terbaru dari Staff')}</p>
              </div>
            </div>

            <div className="spv-activity-list">
              {recentActivities.length === 0 ? (
                <p>{t('Belum ada aktivitas Staff.')}</p>
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
                        {t('Mencatat kunjungan')} {activity.customerName}
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
            <h2>{t('Perlu Perhatian')}</h2>

            <div className="spv-attention-item">
              <span className="spv-attention-dot" />
              <div>
                <strong>
                  {t('{{count}} member perlu ditinjau', {
                    count: formatNumber(reviewCustomers.length),
                  })}
                </strong>
                <p>
                  {t('Berdasarkan status data member.')}
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
