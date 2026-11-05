
import { useEffect, useState } from 'react';
import { getAttendance } from '../../utils/attendance-storage';
import '../../assets/styles/spv/SPVAttendance.css';

function SPVAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setAttendance(getAttendance());
  }, []);

  const uniqueMembers = new Set(
    attendance.map((item) => item.customerId)
  );

  const uniqueStaff = new Set(
    attendance.map((item) => item.recordedBy)
  );

  const filteredAttendance = attendance.filter((item) => {
    const keyword = searchTerm.toLowerCase();

    return (
      item.customerName?.toLowerCase().includes(keyword) ||
      item.recordedBy?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="spv-attendance">
      <div className="spv-attendance-heading">
        <div>
          <h1>Monitoring Absensi</h1>
          <p>
            Pantau seluruh aktivitas kunjungan member Gymnasyum.
          </p>
        </div>

        <span className="spv-attendance-label">
          <span className="spv-attendance-live-dot" />
          Data Kunjungan
        </span>
      </div>

      <section className="spv-attendance-summary">
        <div className="spv-attendance-card">
          <div className="spv-attendance-card-top">
            <span>Total Kunjungan</span>
            <span className="spv-attendance-icon">📋</span>
          </div>
          <h2>{attendance.length}</h2>
          <p>Seluruh kunjungan tercatat</p>
        </div>

        <div className="spv-attendance-card">
          <div className="spv-attendance-card-top">
            <span>Member Berkunjung</span>
            <span className="spv-attendance-icon">👥</span>
          </div>
          <h2>{uniqueMembers.size}</h2>
          <p>Jumlah member unik</p>
        </div>

        <div className="spv-attendance-card">
          <div className="spv-attendance-card-top">
            <span>Staff Pencatat</span>
            <span className="spv-attendance-icon">👤</span>
          </div>
          <h2>{uniqueStaff.size}</h2>
          <p>Staff yang pernah mencatat kunjungan</p>
        </div>
      </section>

      <section className="spv-attendance-panel">
        <div className="spv-attendance-panel-heading">
          <div>
            <h2>Riwayat Kunjungan Member</h2>
            <p>
              Daftar seluruh kunjungan yang dicatat oleh Staff.
            </p>
          </div>

          <span className="spv-attendance-total">
            {filteredAttendance.length} data
          </span>
        </div>

        <div className="spv-attendance-toolbar">
          <div className="spv-attendance-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Cari nama member atau Staff..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        <div className="spv-attendance-table-wrapper">
          <table className="spv-attendance-table">
            <thead>
              <tr>
                <th>Nama Member</th>
                <th>Waktu Kunjungan</th>
                <th>Dicatat Oleh</th>
              </tr>
            </thead>

            <tbody>
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan="3" className="spv-attendance-empty">
                    {attendance.length === 0
                      ? 'Belum ada data kunjungan.'
                      : 'Data kunjungan tidak ditemukan.'}
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.customerName}</strong>
                    </td>
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
                      <span className="spv-attendance-staff">
                        <span className="spv-attendance-avatar">
                          {item.recordedBy?.charAt(0) || '?'}
                        </span>
                        {item.recordedBy || 'Tidak diketahui'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default SPVAttendance;
