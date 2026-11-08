
import { useEffect, useMemo, useState } from 'react';
import { getAllCustomers, getAttendances } from '../../services/api';
import '../../assets/styles/staff/StaffDashboard.css';
import useI18n from '../../i18n/useI18n.js';

function StaffDashboard() {
  const { t, formatDateTime, formatDate, formatNumber } = useI18n();
  const [customers, setCustomers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      getAllCustomers({ status: 'active' }),
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

  const todayVisits = useMemo(() => {
    const today = new Date();

    return attendance.filter((item) => {
      if (!item.visitAt) return false;

      const visitDate = new Date(item.visitAt);

      return (
        !Number.isNaN(visitDate.getTime()) &&
        visitDate.getFullYear() === today.getFullYear() &&
        visitDate.getMonth() === today.getMonth() &&
        visitDate.getDate() === today.getDate()
      );
    });
  }, [attendance]);

  const uniqueVisitors = new Set(
    todayVisits.map((item) => String(item.customerId))
  ).size;

  const recentVisits = [...attendance]
    .sort(
      (a, b) =>
        new Date(b.visitAt).getTime() -
        new Date(a.visitAt).getTime()
    )
    .slice(0, 5);

  return (
    <main className="staff-dashboard">
      {error && <p role="alert">{t(error)}</p>}
      <div className="staff-dashboard-heading">
        <div>
          <span className="staff-dashboard-eyebrow">
            {t('OVERVIEW')}
          </span>
          <h1>{t('Staff Dashboard')}</h1>
          <p>
            {t('Ringkasan aktivitas pelanggan dan kunjungan Gymnasyum.')}
          </p>
        </div>

        <div className="staff-dashboard-date">
          {formatDate(new Date(), {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      <section className="staff-dashboard-stats">
        <article className="staff-stat-card">
          <span>{t('Total Pelanggan')}</span>
          <strong>{formatNumber(customers.length)}</strong>
          <small>{t('Data pelanggan terdaftar')}</small>
        </article>

        <article className="staff-stat-card">
          <span>{t('Kunjungan Hari Ini')}</span>
          <strong>{formatNumber(todayVisits.length)}</strong>
          <small>{t('Total catatan kunjungan hari ini')}</small>
        </article>

        <article className="staff-stat-card">
          <span>{t('Member Hadir')}</span>
          <strong>{formatNumber(uniqueVisitors)}</strong>
          <small>{t('Pelanggan berbeda hari ini')}</small>
        </article>

        <article className="staff-stat-card">
          <span>{t('Total Kunjungan')}</span>
          <strong>{formatNumber(attendance.length)}</strong>
          <small>{t('Seluruh riwayat kunjungan')}</small>
        </article>
      </section>

      <section className="staff-dashboard-section">
        <div className="staff-section-heading">
          <div>
            <h2>{t('Aktivitas Kunjungan Terbaru')}</h2>
            <p>{t('Catatan kunjungan pelanggan terakhir.')}</p>
          </div>

          <span>{formatNumber(attendance.length)} {t('kunjungan')}</span>
        </div>

        {recentVisits.length > 0 ? (
          <div className="staff-recent-list">
            {recentVisits.map((visit) => (
              <article
                className="staff-recent-item"
                key={visit.id}
              >
                <div className="staff-recent-avatar">
                  {(visit.customerName || '?')
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="staff-recent-info">
                  <strong>
                    {visit.customerName || t('Pelanggan')}
                  </strong>
                  <span>
                    {t('Dicatat oleh')} {visit.recordedBy || t('Staff')}
                  </span>
                </div>

                <time>{formatDateTime(visit.visitAt)}</time>
              </article>
            ))}
          </div>
        ) : (
          <div className="staff-dashboard-empty">
            <strong>{t('Belum ada kunjungan')}</strong>
            <p>
              {t('Riwayat kunjungan pelanggan akan muncul di sini.')}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

export default StaffDashboard;
