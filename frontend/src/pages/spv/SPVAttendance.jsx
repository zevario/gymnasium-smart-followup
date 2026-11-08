import { useEffect, useState } from 'react';
import { getAttendances } from '../../services/api';
import '../../assets/styles/spv/SPVAttendance.css';
import useI18n from '../../i18n/useI18n.js';

function SPVAttendance() {
  const { t, formatDateTime, formatNumber } = useI18n();
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({
    totalVisits: 0,
    uniqueMembers: 0,
    recordingStaff: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getAttendances({ search: searchTerm })
      .then((data) => {
        if (!active) return;
        setAttendance(data.attendances || []);
        setSummary(data.summary || {
          totalVisits: 0,
          uniqueMembers: 0,
          recordingStaff: 0,
        });
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
  }, [searchTerm]);

  return (
    <div className="spv-attendance">
      <div className="spv-attendance-heading">
        <div>
          <h1>{t('Monitoring Absensi')}</h1>
          <p>{t('Pantau seluruh aktivitas kunjungan member Gymnasyum.')}</p>
        </div>
        <span className="spv-attendance-label">
          <span className="spv-attendance-live-dot" />
          {t('Data Kunjungan')}
        </span>
      </div>

      {error && <p role="alert">{t(error)}</p>}

      <section className="spv-attendance-summary">
        <div className="spv-attendance-card">
          <div className="spv-attendance-card-top">
            <span>{t('Total Kunjungan')}</span>
            <span className="spv-attendance-icon">📋</span>
          </div>
          <h2>{formatNumber(summary.totalVisits)}</h2>
          <p>{t('Seluruh kunjungan tercatat')}</p>
        </div>

        <div className="spv-attendance-card">
          <div className="spv-attendance-card-top">
            <span>{t('Member Berkunjung')}</span>
            <span className="spv-attendance-icon">👥</span>
          </div>
          <h2>{formatNumber(summary.uniqueMembers)}</h2>
          <p>{t('Jumlah member unik')}</p>
        </div>

        <div className="spv-attendance-card">
          <div className="spv-attendance-card-top">
            <span>{t('Staff Pencatat')}</span>
            <span className="spv-attendance-icon">👤</span>
          </div>
          <h2>{formatNumber(summary.recordingStaff)}</h2>
          <p>{t('Staff yang pernah mencatat kunjungan')}</p>
        </div>
      </section>

      <section className="spv-attendance-panel">
        <div className="spv-attendance-panel-heading">
          <div>
            <h2>{t('Riwayat Kunjungan Member')}</h2>
            <p>{t('Daftar seluruh kunjungan yang dicatat oleh Staff.')}</p>
          </div>
          <span className="spv-attendance-total">
            {loading ? t('Memuat...') : `${formatNumber(attendance.length)} ${t('data')}`}
          </span>
        </div>

        <div className="spv-attendance-toolbar">
          <div className="spv-attendance-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder={t('Cari nama member atau Staff...')}
              value={searchTerm}
              onChange={(event) => {
                setLoading(true);
                setSearchTerm(event.target.value);
              }}
            />
          </div>
        </div>

        <div className="spv-attendance-table-wrapper">
          <table className="spv-attendance-table">
            <thead>
              <tr>
                <th>{t('Nama Member')}</th>
                <th>{t('Waktu Kunjungan')}</th>
                <th>{t('Dicatat Oleh')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" className="spv-attendance-empty">{t('Memuat data...')}</td></tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan="3" className="spv-attendance-empty">
                    {error
                      ? t('Data kunjungan tidak dapat dimuat.')
                      : searchTerm
                        ? t('Data kunjungan tidak ditemukan.')
                        : t('Belum ada data kunjungan.')}
                  </td>
                </tr>
              ) : attendance.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.customerName}</strong></td>
                  <td>
                    {formatDateTime(item.visitAt)}
                  </td>
                  <td>
                    <span className="spv-attendance-staff">
                      <span className="spv-attendance-avatar">
                        {item.recordedBy?.charAt(0) || '?'}
                      </span>
                      {item.recordedBy || t('Tidak diketahui')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default SPVAttendance;
