import { useEffect, useState } from 'react';
import '../../assets/styles/spv/SPVCustomer.css';

const initialCustomers = [
  {
    id: 1,
    name: 'Rina Pramesti',
    package: 'Open Gym Bulanan',
    status: 'Aktif',
    lastVisit: '12 Okt 2026',
    contactPermission: 'Aktif',
    pic: 'Alya',
  },
  {
    id: 2,
    name: 'Dimas Saputra',
    package: 'Trial Group Class',
    status: 'Trial aktif',
    lastVisit: '13 Okt 2026',
    contactPermission: 'Aktif',
    pic: 'Belum ditugaskan',
  },
  {
    id: 3,
    name: 'Nadia Putri',
    package: 'Open Gym 3 Bulan',
    status: 'Aktif',
    lastVisit: '12 Okt 2026',
    contactPermission: 'Aktif',
    pic: 'Alya',
  },
  {
    id: 4,
    name: 'Bagas Wicaksono',
    package: 'Personal Training',
    status: 'Aktif',
    lastVisit: '13 Okt 2026',
    contactPermission: 'Aktif',
    pic: 'Fajar',
  },
  {
    id: 5,
    name: 'Sari Lestari',
    package: 'Trial Open Gym',
    status: 'Trial aktif',
    lastVisit: '12 Okt 2026',
    contactPermission: 'Aktif',
    pic: 'Fajar',
  },
  {
    id: 6,
    name: 'Arif Ramadhan',
    package: 'Open Gym Tahunan',
    status: 'Aktif',
    lastVisit: '13 Okt 2026',
    contactPermission: 'Aktif',
    pic: 'Alya',
  },
  {
    id: 7,
    name: 'Maya Laksmi',
    package: 'Yoga Bulanan',
    status: 'Perlu ditinjau',
    lastVisit: '12 Okt 2026',
    contactPermission: 'Ditolak',
    pic: 'Alya',
  },
  {
    id: 8,
    name: 'Farhan Hadi',
    package: 'Paket tidak terverifikasi',
    status: 'Perlu ditinjau',
    lastVisit: '13 Okt 2026',
    contactPermission: 'Aktif',
    pic: 'Fajar',
  },
];

const emptyForm = {
  name: '',
  package: '',
  status: 'Aktif',
  lastVisit: '-',
  contactPermission: 'Aktif',
  pic: 'Belum ditugaskan',
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

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    localStorage.setItem(
      'gymnasyum_customers',
      JSON.stringify(customers),
    );
  }, [customers]);

  const filteredCustomers = customers.filter((customer) =>
    `${customer.name} ${customer.package}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      package: customer.package,
      status: customer.status,
      lastVisit: customer.lastVisit,
      contactPermission: customer.contactPermission,
      pic: customer.pic,
    });
    setIsFormOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.package.trim()) {
      alert('Nama pelanggan dan paket wajib diisi.');
      return;
    }

    if (editingId !== null) {
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === editingId
            ? { ...customer, ...formData }
            : customer,
        ),
      );
    } else {
      const newCustomer = {
        id: Date.now(),
        ...formData,
      };

      setCustomers((prev) => [...prev, newCustomer]);
    }

    setIsFormOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      'Apakah kamu yakin ingin menghapus pelanggan ini?',
    );

    if (!confirmed) return;

    setCustomers((prev) =>
      prev.filter((customer) => customer.id !== id),
    );
  };

  return (
    <div className="spv-customers">
      <div className="spv-customers-heading">
        <div>
          <span className="spv-eyebrow">DATA PELANGGAN</span>
          <h1>Pelanggan</h1>
          <p>Kelola data dan status membership pelanggan Gymnasyum.</p>
        </div>

        <button
          className="spv-add-button"
          onClick={handleOpenAdd}
        >
          + Tambah Pelanggan
        </button>
      </div>

      <div className="spv-customer-toolbar">
        <input
          type="search"
          placeholder="Cari nama atau paket..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <span>{filteredCustomers.length} pelanggan ditampilkan</span>
      </div>

      <div className="spv-customer-table-wrapper">
        <table className="spv-customer-table">
          <thead>
            <tr>
              <th>MEMBER</th>
              <th>STATUS MEMBERSHIP</th>
              <th>KUNJUNGAN TERAKHIR</th>
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
                      <span>{customer.package}</span>
                    </div>
                  </div>
                </td>

                <td>
                  <span
                    className={`spv-status ${
                      customer.status === 'Perlu ditinjau'
                        ? 'status-review'
                        : 'status-active'
                    }`}
                  >
                    {customer.status}
                  </span>
                </td>

                <td>{customer.lastVisit}</td>

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

                <td>{customer.pic}</td>

                <td>
                  <div className="spv-customer-actions">
                    <button
                      onClick={() => handleOpenEdit(customer)}
                      title="Edit pelanggan"
                    >
                      Edit
                    </button>

                    <button
                      className="delete-action"
                      onClick={() => handleDelete(customer.id)}
                      title="Hapus pelanggan"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="6" className="spv-empty-state">
                  Pelanggan tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="spv-modal-backdrop">
          <div className="spv-customer-modal">
            <div className="spv-modal-heading">
              <div>
                <h2>
                  {editingId !== null
                    ? 'Edit Pelanggan'
                    : 'Tambah Pelanggan'}
                </h2>
                <p>Lengkapi informasi pelanggan berikut.</p>
              </div>

              <button
                className="spv-modal-close"
                onClick={() => setIsFormOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Nama Pelanggan
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Masukkan nama pelanggan"
                  required
                />
              </label>

              <label>
                Paket Membership
                <input
                  name="package"
                  value={formData.package}
                  onChange={handleChange}
                  placeholder="Contoh: Open Gym Bulanan"
                  required
                />
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
                Kunjungan Terakhir
                <input
                  name="lastVisit"
                  value={formData.lastVisit}
                  onChange={handleChange}
                  placeholder="Contoh: 12 Okt 2026"
                />
              </label>

              <label>
                Izin Kontak
                <select
                  name="contactPermission"
                  value={formData.contactPermission}
                  onChange={handleChange}
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </label>

              <label>
                PIC
                <select
                  name="pic"
                  value={formData.pic}
                  onChange={handleChange}
                >
                  <option value="Belum ditugaskan">
                    Belum ditugaskan
                  </option>
                  <option value="Alya">Alya</option>
                  <option value="Fajar">Fajar</option>
                </select>
              </label>

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