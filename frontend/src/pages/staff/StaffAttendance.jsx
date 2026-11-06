
import { useEffect, useState } from 'react';
import {
  addAttendance,
  getAttendance,
} from '../../utils/attendance-storage';
import '../../assets/styles/staff/StaffAttendance.css';

function StaffAttendance({ currentUser }) {
  const [attendance, setAttendance] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');

  const currentStaff = currentUser?.name || 'Staff';

  useEffect(() => {
    try {
      const savedCustomers = localStorage.getItem('gymnasyum_customers');

      if (savedCustomers) {
        setCustomers(JSON.parse(savedCustomers));
      }
    } catch (error) {
      console.error('Gagal membaca data member:', error);
    }

    setAttendance(getAttendance());
  }, []);

  const myAttendance = attendance.filter(
    (item) => item.recordedBy === currentStaff
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    const selectedCustomer = customers.find(
      (customer) => String(customer.id) === customerId
    );

    if (!selectedCustomer) {
      alert('Pilih member terlebih dahulu.');
      return;
    }

    const newAttendance = addAttendance({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      visitAt: new Date().toISOString(),
      recordedBy: currentStaff,
    });

    setAttendance((previous) => [
      newAttendance,
      ...previous,
    ]);

    setCustomerId('');
    alert('Kunjungan berhasil dicatat.');
  };

  return (
    <div className="staff-attendance">
      <div className="staff-attendance-heading">
        <div>
          <h1>Absensi Member</h1>
          <p>Catat dan pantau kunjungan member Gymnasyum.</p>
        </div>

        <div className="staff-attendance-user">
          <span>Petugas pencatat</span>
          <strong>{currentStaff}</strong>
        </div>
      </div>

      <div className="attendance-summary">
        <div className="attendance-summary-card">
          <span>Total Kunjungan Saya</span>
          <strong>{myAttendance.length}</strong>
          <small>Kunjungan yang dicatat oleh Anda</small>
        </div>

        <div className="attendance-summary-card">
          <span>Total Member Terdaftar</span>
          <strong>{customers.length}</strong>
          <small>Member dalam sistem Gymnasyum</small>
        </div>
      </div>

      <section className="attendance-panel">
        <div className="attendance-panel-heading">
          <h2>Catat Kunjungan</h2>
          <p>Pilih member yang datang ke Gymnasyum.</p>
        </div>

        <form onSubmit={handleSubmit} className="attendance-form">
          <div className="attendance-form-group">
            <label htmlFor="attendance-customer">
              Nama Member
            </label>

            <select
              id="attendance-customer"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              required
            >
              <option value="">-- Pilih Member --</option>

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={!customers.length}>
            Catat Kunjungan
          </button>
        </form>
      </section>

      <section className="attendance-panel">
        <div className="attendance-panel-heading">
          <h2>Riwayat Kunjungan Saya</h2>
          <p>Daftar kunjungan yang telah Anda catat.</p>
        </div>

        {myAttendance.length === 0 ? (
          <div className="attendance-empty">
            <p>Belum ada kunjungan yang dicatat.</p>
          </div>
        ) : (
          <div className="attendance-table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Nama Member</th>
                  <th>Waktu Kunjungan</th>
                  <th>Dicatat Oleh</th>
                </tr>
              </thead>

              <tbody>
                {myAttendance.map((item) => (
                  <tr key={item.id}>
                    <td>{item.customerName}</td>
                    <td>
                      {new Date(item.visitAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <span className="attendance-staff-badge">
                        {item.recordedBy}
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
