import { useEffect, useMemo, useState } from 'react';
import {
  createAttendance,
  getAllCustomers,
  getAttendances,
  getSchedules,
} from '../../services/api';
import '../../assets/styles/staff/StaffAttendance.css';
import useI18n from '../../i18n/useI18n.js';

function StaffAttendance({ currentUser }) {
  const { t, formatDateTime, formatNumber } = useI18n();
  const [attendance, setAttendance] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentStaff = currentUser?.name || 'Staff';

  const loadData = async () => {
    try {
      const [customerData, scheduleData, attendanceData] = await Promise.all([
        getAllCustomers({ status: 'active' }),
        getSchedules({ upcoming: 'true' }),
        getAttendances(),
      ]);
      setCustomers(customerData.customers || []);
      setSchedules(scheduleData.schedules || []);
      setAttendance(attendanceData.attendances || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      getAllCustomers({ status: 'active' }),
      getSchedules({ upcoming: 'true' }),
      getAttendances(),
    ])
      .then(([customerData, scheduleData, attendanceData]) => {
        if (!active) return;
        setCustomers(customerData.customers || []);
        setSchedules(scheduleData.schedules || []);
        setAttendance(attendanceData.attendances || []);
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

  const selectedSchedule = useMemo(
    () => schedules.find((schedule) => schedule.id === scheduleId),
    [schedules, scheduleId],
  );

  const myAttendance = attendance;

  const handleScheduleChange = (nextScheduleId) => {
    setScheduleId(nextScheduleId);
    const schedule = schedules.find((item) => item.id === nextScheduleId);
    setCustomerId(
      schedule?.type === 'personal_training'
        ? schedule.customerId
        : '',
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedSchedule || !customerId) {
      setError(t('Pilih jadwal dan member terlebih dahulu.'));
      return;
    }

    setSaving(true);
    setError('');
    try {
      await createAttendance({
        schedule_id: scheduleId,
        customer_id: customerId,
      });
      setCustomerId('');
      setScheduleId('');
      setLoading(true);
      await loadData();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="staff-attendance">
      <div className="staff-attendance-heading">
        <div>
          <h1>{t('Absensi Member')}</h1>
          <p>{t('Catat dan pantau kunjungan member Gymnasyum.')}</p>
        </div>
        <div className="staff-attendance-user">
          <span>{t('Petugas pencatat')}</span>
          <strong>{currentStaff}</strong>
        </div>
      </div>

      {error && <p role="alert">{t(error)}</p>}

      <div className="attendance-summary">
        <div className="attendance-summary-card">
          <span>{t('Total Kunjungan Saya')}</span>
          <strong>{formatNumber(myAttendance.length)}</strong>
          <small>{t('Kunjungan yang dicatat oleh Anda')}</small>
        </div>
        <div className="attendance-summary-card">
          <span>{t('Total Member Terdaftar')}</span>
          <strong>{formatNumber(customers.length)}</strong>
          <small>{t('Member dalam sistem Gymnasyum')}</small>
        </div>
      </div>

      <section className="attendance-panel">
        <div className="attendance-panel-heading">
          <h2>{t('Catat Kunjungan')}</h2>
          <p>{t('Pilih jadwal dan member yang datang ke Gymnasyum.')}</p>
        </div>

        <form onSubmit={handleSubmit} className="attendance-form">
          <div className="attendance-form-group">
            <label htmlFor="attendance-schedule">{t('Jadwal')}</label>
            <select
              id="attendance-schedule"
              value={scheduleId}
              onChange={(event) => handleScheduleChange(event.target.value)}
              required
            >
              <option value="">{t('-- Pilih Jadwal --')}</option>
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.title}
                  {' — '}
                  {formatDateTime(schedule.startsAt)}
                </option>
              ))}
            </select>
          </div>

          <div className="attendance-form-group">
            <label htmlFor="attendance-customer">{t('Nama Member')}</label>
            <select
              id="attendance-customer"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              required
              disabled={
                selectedSchedule?.type === 'personal_training'
                || !customers.length
              }
            >
              <option value="">{t('-- Pilih Member --')}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={
              loading
              || saving
              || !customers.length
              || !schedules.length
            }
          >
            {saving ? t('Menyimpan...') : t('Catat Kunjungan')}
          </button>
        </form>
        {!loading && !schedules.length && (
          <p className="attendance-empty">
            {t('Belum ada jadwal mendatang untuk dicatat.')}
          </p>
        )}
      </section>

      <section className="attendance-panel">
        <div className="attendance-panel-heading">
          <h2>{t('Riwayat Kunjungan Saya')}</h2>
          <p>{t('Daftar kunjungan yang telah Anda catat.')}</p>
        </div>

        {loading ? (
          <div className="attendance-empty">{t('Memuat riwayat kunjungan...')}</div>
        ) : myAttendance.length === 0 ? (
          <div className="attendance-empty">
            <p>{t('Belum ada kunjungan yang dicatat.')}</p>
          </div>
        ) : (
          <div className="attendance-table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>{t('Nama Member')}</th>
                  <th>{t('Waktu Kunjungan')}</th>
                  <th>{t('Dicatat Oleh')}</th>
                </tr>
              </thead>
              <tbody>
                {myAttendance.map((item) => (
                  <tr key={item.id}>
                    <td>{item.customerName}</td>
                    <td>
                      {formatDateTime(item.visitAt)}
                    </td>
                    <td>
                      <span className="attendance-staff-badge">
                        {item.recordedBy || currentStaff}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default StaffAttendance;
