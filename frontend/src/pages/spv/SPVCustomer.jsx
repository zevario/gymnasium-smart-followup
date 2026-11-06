import { useEffect, useState } from 'react';

import {
  getAttendance,
} from '../../utils/attendance-storage';

import {
  notifyStorageChange,
  subscribeToStorage,
} from '../../utils/storage-sync';

import '../../assets/styles/spv/SPVCustomer.css';


const initialCustomers = [
  {
    id: 1,
    name: 'Rina Pramesti',
    phone: '081234567890',
    package: 'Open Gym Bulanan',
    status: 'Aktif',
    membershipStart: '2026-10-01',
    membershipEnd: '2026-10-31',
    contactPermission: 'Aktif',
    pic: 'Alya',
  },
  {
    id: 2,
    name: 'Dimas Saputra',
    phone: '081234567891',
    package: 'Trial Group Class',
    status: 'Trial aktif',
    membershipStart: '2026-10-10',
    membershipEnd: '2026-10-17',
    contactPermission: 'Aktif',
    pic: 'Belum ditugaskan',
  },
];

const emptyForm = {
  name: '',
  phone: '',
  package: '',
  status: 'Aktif',
  membershipStart: '',
  membershipEnd: '',
  contactPermission: 'Aktif',
  picId: '',
};

function SPVCustomer() {
  const [customers, setCustomers] = useState(() => {
    try {
      const savedCustomers = localStorage.getItem('gymnasyum_customers');

      return savedCustomers
        ? JSON.parse(savedCustomers)
        : initialCustomers;
    } catch {
      return initialCustomers;
    }
  });

  const [picOptions, setPicOptions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
  const loadAccounts = () => {
    try {
      const savedAccounts = localStorage.getItem('gymnasyum_accounts');

      if (!savedAccounts) {
        setPicOptions([]);
        return;
      }

      const accounts = JSON.parse(savedAccounts);

      setPicOptions(
        accounts.filter(
          (account) =>
            account.role === 'Admin/CS & Sales' &&
            account.active === true
        )
      );
    } catch (error) {
      console.error('Gagal membaca data PIC:', error);
      setPicOptions([]);
    }
  };

  loadAccounts();

  return subscribeToStorage('gymnasyum_accounts', loadAccounts);
  }, []);

  useEffect(() => {
  try {
    localStorage.setItem(
      'gymnasyum_customers',
      JSON.stringify(customers)
    );

    notifyStorageChange('gymnasyum_customers');
  } catch (error) {
    console.error('Gagal menyimpan data pelanggan:', error);
  }
  }, [customers]);

  useEffect(() => {
  const loadAttendance = () => {
    setAttendance(getAttendance());
  };

  loadAttendance();

  return subscribeToStorage('gymnasyum_visits', loadAttendance);
  }, []);
  
  const getLastVisit = (customerId) => {
    const customerVisits = attendance
      .filter(
        (item) => String(item.customerId) === String(customerId)
      )
      .sort(
        (a, b) =>
          new Date(b.visitAt).getTime() -
          new Date(a.visitAt).getTime()
      );

    if (customerVisits.length === 0) {
      return '-';
    }

    return new Date(
      customerVisits[0].visitAt
    ).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPicName = (customer) => {
    if (customer.picId) {
      const assignedPic = picOptions.find(
        (account) => String(account.id) === String(customer.picId)
      );

      if (assignedPic) return assignedPic.name;
    }

    // Kompatibilitas dengan data pelanggan lama yang masih menyimpan nama PIC.
    return customer.pic || 'Belum ditugaskan';
  };

  const filteredCustomers = customers.filter((customer) =>
    `${customer.name} ${customer.package} ${customer.phone || ''} ${getPicName(customer)}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer) => {
    const existingPic = picOptions.find(
      (account) =>
        String(account.id) === String(customer.picId) ||
        account.name === customer.pic
    );

    setEditingId(customer.id);

    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      package: customer.package || '',
      status: customer.status || 'Aktif',
      membershipStart: customer.membershipStart || '',
      membershipEnd: customer.membershipEnd || '',
      contactPermission: customer.contactPermission || 'Aktif',
      picId: existingPic ? String(existingPic.id) : '',
    });

    setIsFormOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.package.trim() ||
      !formData.membershipEnd
    ) {
      alert(
        'Nama, nomor WhatsApp, paket, dan tanggal berakhir membership wajib diisi.'
      );
      return;
    }

    const selectedPic = picOptions.find(
      (account) => String(account.id) === String(formData.picId)
    );

    const customerData = {
      ...formData,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      package: formData.package.trim(),
      picId: selectedPic ? selectedPic.id : '',
      pic: selectedPic ? selectedPic.name : 'Belum ditugaskan',
    };

    if (editingId !== null) {
      setCustomers((previous) =>
        previous.map((customer) =>
          customer.id === editingId
            ? { ...customer, ...customerData }
            : customer
        )
      );
    } else {
      const newCustomer = {
        id: Date.now(),
        ...customerData,
      };

      setCustomers((previous) => [...previous, newCustomer]);
    }

    setIsFormOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      'Apakah kamu yakin ingin menghapus pelanggan ini?'
    );

    if (!confirmed) return;

    setCustomers((previous) =>
      previous.filter((customer) => customer.id !== id)
    );
  };

  return (
    <div className="spv-customers">
      <div className="spv-customers-heading">
        <div>
          <span className="spv-eyebrow">DATA MEMBER GYMNASYUM</span>
          <h1>Data Pelanggan</h1>
          <p>
            Kelola informasi pelanggan dan status keanggotaan Gymnasyum.
          </p>
        </div>

        <div className="spv-customer-total">
          <span>Total Pelanggan</span>
          <strong>{customers.length}</strong>
        </div>
      </div>

      <section className="spv-customer-section">
        <div className="spv-customer-section-heading">
          <div>
            <h2>Daftar Pelanggan</h2>
            <p>Data pelanggan yang dikelola oleh Supervisor.</p>
          </div>

          <button
            type="button"
            className="spv-add-button"
            onClick={handleOpenAdd}
          >
            + Tambah Pelanggan
          </button>
        </div>

        <div className="spv-customer-toolbar">
          <input
            type="search"
            placeholder="Cari nama, nomor WhatsApp, paket, atau PIC..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <span>{filteredCustomers.length} pelanggan ditampilkan</span>
        </div>

        <div className="spv-customer-table-wrapper">
          <table className="spv-customer-table">
            <thead>
              <tr>
                <th>PELANGGAN</th>
                <th>PAKET MEMBERSHIP</th>
                <th>STATUS</th>
                <th>KUNJUNGAN TERAKHIR</th>
                <th>MASA MEMBERSHIP</th>
                <th>IZIN KONTAK</th>
                <th>PIC</th>
                <th>AKSI</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="spv-customer-name">
                      <div className="spv-customer-avatar">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <strong>{customer.name}</strong>
                        <span>{customer.phone || '-'}</span>
                      </div>
                    </div>
                  </td>

                  <td>{customer.package}</td>

                  <td>
                    <span
                      className={`spv-status ${
                        customer.status === 'Perlu ditinjau'
                          ? 'status-review'
                          : customer.status === 'Tidak aktif'
                            ? 'status-inactive'
                            : 'status-active'
                      }`}
                    >
                      {customer.status}
                    </span>
                  </td>

                  <td>{getLastVisit(customer.id)}</td>

                  <td>
                    <div className="spv-membership-dates">
                      <span>
                        Mulai: {customer.membershipStart || '-'}
                      </span>
                      <span>
                        Berakhir: {customer.membershipEnd || '-'}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`spv-contact ${
                        customer.contactPermission === 'Aktif'
                          ? 'contact-active'
                          : 'contact-rejected'
                      }`}
                    >
                      ● {customer.contactPermission}
                    </span>
                  </td>

                  <td>{getPicName(customer)}</td>

                  <td>
                    <div className="spv-customer-actions">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(customer)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete-action"
                        onClick={() => handleDelete(customer.id)}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="8" className="spv-empty-state">
                    Belum ada data pelanggan atau pelanggan tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="spv-customer-footer">
          Menampilkan {filteredCustomers.length} dari {customers.length} pelanggan.
        </div>
      </section>

      <div className="spv-customer-info">
        <strong>Informasi Pengelolaan</strong>
        <p>
          Data pelanggan dikelola oleh Supervisor. Kunjungan terakhir
          diperbarui otomatis berdasarkan riwayat absensi Staff.
        </p>
      </div>

      {isFormOpen && (
        <div
          className="spv-modal-backdrop"
          onClick={() => setIsFormOpen(false)}
        >
          <div
            className="spv-customer-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="spv-modal-heading">
              <div>
                <h2>
                  {editingId !== null
                    ? 'Edit Pelanggan'
                    : 'Tambah Pelanggan'}
                </h2>
                <p>Lengkapi informasi keanggotaan pelanggan.</p>
              </div>

              <button
                type="button"
                className="spv-modal-close"
                onClick={() => setIsFormOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Nama Lengkap
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </label>

              <label>
                Nomor WhatsApp
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Contoh: 081234567890"
                  required
                />
              </label>

              <label>
                Paket Membership
                <select
                  name="package"
                  value={formData.package}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Pilih Paket --</option>
                  <option value="Open Gym Bulanan">Open Gym Bulanan</option>
                  <option value="Open Gym 3 Bulan">Open Gym 3 Bulan</option>
                  <option value="Open Gym Tahunan">Open Gym Tahunan</option>
                  <option value="Personal Training">Personal Training</option>
                  <option value="Trial Open Gym">Trial Open Gym</option>
                  <option value="Trial Group Class">Trial Group Class</option>
                  <option value="Yoga Bulanan">Yoga Bulanan</option>
                </select>
              </label>

              <label>
                Status Membership
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Trial aktif">Trial aktif</option>
                  <option value="Perlu ditinjau">Perlu ditinjau</option>
                  <option value="Tidak aktif">Tidak aktif</option>
                </select>
              </label>

              <label>
                Tanggal Mulai Membership
                <input
                  type="date"
                  name="membershipStart"
                  value={formData.membershipStart}
                  onChange={handleChange}
                />
              </label>

              <label>
                Tanggal Berakhir Membership
                <input
                  type="date"
                  name="membershipEnd"
                  value={formData.membershipEnd}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Izin Kontak
                <select
                  name="contactPermission"
                  value={formData.contactPermission}
                  onChange={handleChange}
                >
                  <option value="Aktif">Diizinkan</option>
                  <option value="Ditolak">Tidak diizinkan</option>
                </select>
              </label>

              <label>
                PIC (Admin/CS & Sales)
                <select
                  name="picId"
                  value={formData.picId}
                  onChange={handleChange}
                >
                  <option value="">Belum ditugaskan</option>

                  {picOptions.map((account) => (
                    <option key={account.id} value={String(account.id)}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>

              {picOptions.length === 0 && (
                <p className="spv-pic-warning">
                  Belum ada akun Admin/CS & Sales aktif. Tambahkan atau
                  aktifkan akun melalui Pengaturan Admin.
                </p>
              )}

              <div className="spv-modal-actions">
                <button
                  type="button"
                  className="spv-cancel-button"
                  onClick={() => setIsFormOpen(false)}
                >
                  Batal
                </button>

                <button type="submit" className="spv-save-button">
                  {editingId !== null
                    ? 'Simpan Perubahan'
                    : 'Tambah Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SPVCustomer;