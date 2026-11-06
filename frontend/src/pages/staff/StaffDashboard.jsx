
import { useEffect, useMemo, useState } from 'react';
import { getAttendance } from '../../utils/attendance-storage';
import { subscribeToStorage } from '../../utils/storage-sync';
import '../../assets/styles/staff/StaffDashboard.css';

const CUSTOMER_STORAGE_KEY = 'gymnasyum_customers';
const ATTENDANCE_STORAGE_KEY = 'gymnasyum_visits';

const getCustomers = () => {
  try {
    return JSON.parse(
      localStorage.getItem(CUSTOMER_STORAGE_KEY) || '[]'
    );
  } catch {
    return [];
  }
};

const formatDate = (value) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function StaffDashboard() {
  const [customers, setCustomers] = useState(getCustomers);
  const [attendance, setAttendance] = useState(getAttendance);

  useEffect(() => {
    const loadCustomers = () => {
      setCustomers(getCustomers());
    };

    const loadAttendance = () => {
      setAttendance(getAttendance());
    };

    const unsubscribeCustomers = subscribeToStorage(
      CUSTOMER_STORAGE_KEY,
      loadCustomers
    );

    const unsubscribeAttendance = subscribeToStorage(
      ATTENDANCE_STORAGE_KEY,
      loadAttendance
    );

    return () => {
      unsubscribeCustomers();
      unsubscribeAttendance();
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
      <div className="staff-dashboard-heading">
        <div>
          <span className="staff-dashboard-eyebrow">
            OVERVIEW
          </span>
          <h1>Staff Dashboard</h1>
          <p>
            Ringkasan aktivitas pelanggan dan kunjungan Gymnasyum.
          </p>
        </div>

        <div className="staff-dashboard-date">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      <section className="staff-dashboard-stats">
        <article className="staff-stat-card">
          <span>Total Pelanggan</span>
          <strong>{customers.length}</strong>
          <small>Data pelanggan terdaftar</small>
        </article>

        <article className="staff-stat-card">
          <span>Kunjungan Hari Ini</span>
          <strong>{todayVisits.length}</strong>
          <small>Total catatan kunjungan hari ini</small>
        </article>

        <article className="staff-stat-card">
          <span>Member Hadir</span>
          <strong>{uniqueVisitors}</strong>
          <small>Pelanggan berbeda hari ini</small>
        </article>

        <article className="staff-stat-card">
          <span>Total Kunjungan</span>
          <strong>{attendance.length}</strong>
          <small>Seluruh riwayat kunjungan</small>
        </article>
      </section>

      <section className="staff-dashboard-section">
        <div className="staff-section-heading">
          <div>
            <h2>Aktivitas Kunjungan Terbaru</h2>
            <p>Catatan kunjungan pelanggan terakhir.</p>
          </div>

          <span>{attendance.length} kunjungan</span>
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
                    {visit.customerName || 'Pelanggan'}
                  </strong>
                  <span>
                    Dicatat oleh {visit.recordedBy || 'Staff'}
                  </span>
                </div>

                <time>{formatDate(visit.visitAt)}</time>
              </article>
            ))}
          </div>
        ) : (
          <div className="staff-dashboard-empty">
            <strong>Belum ada kunjungan</strong>
            <p>
              Riwayat kunjungan pelanggan akan muncul di sini.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

export default StaffDashboard;
