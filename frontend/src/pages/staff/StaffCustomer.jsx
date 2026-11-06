import { useEffect, useMemo, useState } from 'react';
import { subscribeToStorage } from '../../utils/storage-sync';
import '../../assets/styles/staff/StaffCustomer.css';
import { openWhatsApp } from '../../utils/whatsapp';

const CUSTOMER_STORAGE_KEY = 'gymnasyum_customers';

const readCustomers = () => {
  try {
    const saved = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Gagal membaca data pelanggan:', error);
    return [];
  }
};

const formatDate = (value) => {
  if (!value) return 'Belum ditentukan';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Belum ditentukan';

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const getMembershipStatus = (customer) => {
  const endDate = customer.membershipEnd
    ?? customer.membershipEndDate
    ?? customer.endDate
    ?? customer.expiresAt;

  if (!endDate) return 'Belum ditentukan';

  const expiry = new Date(endDate);
  if (Number.isNaN(expiry.getTime())) return 'Belum ditentukan';

  expiry.setHours(23, 59, 59, 999);

  return expiry < new Date() ? 'Kedaluwarsa' : 'Aktif';
};

function StaffCustomer() {
  const [customers, setCustomers] = useState(readCustomers);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    const loadCustomers = () => {
      setCustomers(readCustomers());
    };

    const unsubscribe = subscribeToStorage(
      CUSTOMER_STORAGE_KEY,
      loadCustomers
    );

    return unsubscribe;
  }, []);

  const filteredCustomers = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return customers.filter((customer) => {
      return [
        customer.name,
        customer.phone,
        customer.package,
        customer.status,
      ].some((value) =>
        String(value ?? '').toLowerCase().includes(keyword)
      );
    });
  }, [customers, search]);

  return (
    <main className="staff-customer-page">
      <header className="staff-customer-header">
        <div>
          <span className="staff-customer-eyebrow">MEMBER MANAGEMENT</span>
          <h1>Data Pelanggan</h1>
          <p>Lihat informasi pelanggan dan status membership Gymnasyum.</p>
        </div>

        <div className="staff-customer-total">
          <span>Total Pelanggan</span>
          <strong>{customers.length}</strong>
        </div>
      </header>

      <section className="staff-customer-panel">
        <div className="staff-customer-toolbar">
          <div>
            <h2>Daftar Pelanggan</h2>
            <p>Informasi pelanggan yang terdaftar dalam sistem.</p>
          </div>

          <input
            type="search"
            placeholder="Cari nama, nomor, atau paket..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="staff-customer-table-wrapper">
          <table className="staff-customer-table">
            <thead>
              <tr>
                <th>Pelanggan</th>
                <th>Nomor Telepon</th>
                <th>Paket</th>
                <th>Masa Berlaku</th>
                <th>Status Membership</th>
                <th>Detail</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer, index) => {
                  const membershipStatus =
                    getMembershipStatus(customer);

                  return (
                    <tr key={customer.id ?? customer.phone ?? index}>
                      <td>
                        <strong>{customer.name || 'Tanpa nama'}</strong>
                      </td>

                      <td>{customer.phone || '-'}</td>

                      <td>{customer.package || '-'}</td>

                      <td>
                        {formatDate(
                          customer.membershipEnd
                            ?? customer.membershipEndDate
                            ?? customer.endDate
                            ?? customer.expiresAt
                        )}
                      </td>

                      <td>
                        <span
                          className={`staff-membership-badge ${
                            membershipStatus === 'Aktif'
                              ? 'is-active'
                              : membershipStatus === 'Kedaluwarsa'
                                ? 'is-expired'
                                : 'is-unknown'
                          }`}
                        >
                          {membershipStatus}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="staff-customer-detail-button"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="staff-customer-empty">
                    {customers.length === 0
                      ? 'Belum ada pelanggan terdaftar.'
                      : 'Pelanggan tidak ditemukan.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedCustomer && (
        <div
          className="staff-customer-overlay"
          onClick={() => setSelectedCustomer(null)}
        >
          <section
            className="staff-customer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-customer-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="staff-customer-modal-header">
              <div>
                <span>INFORMASI MEMBER</span>
                <h2 id="staff-customer-modal-title">
                  Detail Pelanggan
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Tutup detail"
              >
                ×
              </button>
            </div>

            <div className="staff-customer-detail">
              <div>
                <span>Nama Pelanggan</span>
                <strong>{selectedCustomer.name || '-'}</strong>
              </div>

              <div>
                <span>Nomor Telepon</span>
                <strong>{selectedCustomer.phone || '-'}</strong>
              </div>

              <div>
                <span>Paket Membership</span>
                <strong>{selectedCustomer.package || '-'}</strong>
              </div>

              <div>
                <span>Tanggal Mulai</span>
                <strong>
                  {formatDate(selectedCustomer.membershipStart)}
                </strong>
              </div>

              <div>
                <span>Tanggal Berakhir</span>
                <strong>
                  {formatDate(
                    selectedCustomer.membershipEnd
                      ?? selectedCustomer.membershipEndDate
                      ?? selectedCustomer.endDate
                      ?? selectedCustomer.expiresAt
                  )}
                </strong>
              </div>

              <div>
                <span>Status Membership</span>
                <strong>
                  {getMembershipStatus(selectedCustomer)}
                </strong>
              </div>

              <div>
                <span>Status Pelanggan</span>
                <strong>{selectedCustomer.status || '-'}</strong>
              </div>

              <div>
                <span>Penanggung Jawab (PIC)</span>
                <strong>{selectedCustomer.pic || 'Belum ditugaskan'}</strong>
              </div>
            </div>

            <p className="staff-customer-readonly-note">
              Informasi ini hanya dapat dilihat oleh Staff.
              Perubahan data dilakukan melalui akun Supervisor.

              <button
              type="button"
              className="staff-customer-whatsapp-button"
              disabled={
                !selectedCustomer.phone ||
                selectedCustomer.contactPermission === 'Ditolak'
              }
              onClick={() =>
                openWhatsApp(
                  selectedCustomer.phone,
                  `Halo ${selectedCustomer.name}, kami dari Gymnasyum. Kami ingin menanyakan kabar dan aktivitas latihan Anda. Apakah ada yang bisa kami bantu?`
                )
              }
            >
              Hubungi via WhatsApp
            </button>
            </p>

            <button
              type="button"
              className="staff-customer-close-button"
              onClick={() => setSelectedCustomer(null)}
            >
              Tutup
            </button>
          </section>
        </div>
      )}

    </main>
  );
}

export default StaffCustomer;
