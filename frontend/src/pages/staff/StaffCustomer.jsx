import { useEffect, useMemo, useState } from 'react';
import { getAllCustomers } from '../../services/api';
import '../../assets/styles/staff/StaffCustomer.css';
import useI18n from '../../i18n/useI18n.js';

const getMembershipEnd = (customer) => (
  customer.membershipEnd
    ?? customer.membership_end
    ?? customer.membershipEndDate
    ?? customer.endDate
    ?? customer.expiresAt
);

const getMembershipStart = (customer) => (
  customer.membershipStart ?? customer.membership_start
);

const getMembershipPackage = (customer) => (
  customer.membershipPackage ?? customer.membership_package
);

const getMembershipStatus = (customer, t) => {
  const endDate = getMembershipEnd(customer);
  if (!endDate) return t('Belum ditentukan');

  const expiry = new Date(endDate);
  if (Number.isNaN(expiry.getTime())) return t('Belum ditentukan');

  expiry.setHours(23, 59, 59, 999);

  return expiry < new Date() ? t('Kedaluwarsa') : t('Aktif');
};

function StaffCustomer() {
  const { t, formatDate, formatNumber } = useI18n();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getAllCustomers({ status: 'active' })
      .then((data) => {
        if (active) setCustomers(data.customers || []);
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

  const filteredCustomers = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return customers.filter((customer) => {
      return [
        customer.name,
        customer.phone,
        getMembershipPackage(customer),
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
          <span className="staff-customer-eyebrow">{t('MEMBER MANAGEMENT')}</span>
          <h1>{t('Data Pelanggan')}</h1>
          <p>{t('Lihat informasi pelanggan dan status membership Gymnasyum.')}</p>
        </div>

        <div className="staff-customer-total">
          <span>{t('Total Pelanggan')}</span>
          <strong>{formatNumber(customers.length)}</strong>
        </div>
      </header>

      <section className="staff-customer-panel">
        {error && <p role="alert">{t(error)}</p>}
        <div className="staff-customer-toolbar">
          <div>
            <h2>{t('Daftar Pelanggan')}</h2>
            <p>{t('Informasi pelanggan yang terdaftar dalam sistem.')}</p>
          </div>

          <input
            type="search"
            placeholder={t('Cari nama, nomor, atau paket...')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="staff-customer-table-wrapper">
          <table className="staff-customer-table">
            <thead>
              <tr>
                <th>{t('Pelanggan')}</th>
                <th>{t('Nomor Telepon')}</th>
                <th>{t('Paket')}</th>
                <th>{t('Masa Berlaku')}</th>
                <th>{t('Status Membership')}</th>
                <th>{t('Detail')}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="staff-customer-empty">
                    {t('Memuat data pelanggan...')}
                  </td>
                </tr>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer, index) => {
                  const membershipStatus =
                    getMembershipStatus(customer, t);

                  return (
                    <tr key={customer.id ?? customer.phone ?? index}>
                      <td>
                        <strong>{customer.name || t('Tanpa nama')}</strong>
                      </td>

                      <td>{customer.phone || '-'}</td>

                      <td>{getMembershipPackage(customer) || '-'}</td>

                      <td>
                        {getMembershipStart(customer)
                          ? `${formatDate(getMembershipStart(customer))} – `
                          : ''}
                        {formatDate(getMembershipEnd(customer))}
                      </td>

                      <td>
                        <span
                          className={`staff-membership-badge ${
                            membershipStatus === t('Aktif')
                              ? 'is-active'
                              : membershipStatus === t('Kedaluwarsa')
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
                          {t('Lihat Detail')}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="staff-customer-empty">
                    {customers.length === 0
                      ? t('Belum ada pelanggan terdaftar.')
                      : t('Pelanggan tidak ditemukan.')}
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
                <span>{t('INFORMASI MEMBER')}</span>
                <h2 id="staff-customer-modal-title">
                  {t('Detail Pelanggan')}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                aria-label={t('Tutup detail')}
              >
                ×
              </button>
            </div>

            <div className="staff-customer-detail">
              <div>
                <span>{t('Nama Pelanggan')}</span>
                <strong>{selectedCustomer.name || '-'}</strong>
              </div>

              <div>
                <span>{t('Nomor Telepon')}</span>
                <strong>{selectedCustomer.phone || '-'}</strong>
              </div>

              <div>
                <span>{t('Paket Membership')}</span>
                <strong>{getMembershipPackage(selectedCustomer) || '-'}</strong>
              </div>

              <div>
                <span>{t('Tanggal Mulai')}</span>
                <strong>
                  {formatDate(getMembershipStart(selectedCustomer))}
                </strong>
              </div>

              <div>
                <span>{t('Tanggal Berakhir')}</span>
                <strong>
                  {formatDate(getMembershipEnd(selectedCustomer))}
                </strong>
              </div>

              <div>
                <span>{t('Status Membership')}</span>
                <strong>
                  {getMembershipStatus(selectedCustomer, t)}
                </strong>
              </div>

              <div>
                <span>{t('Status Pelanggan')}</span>
                <strong>{selectedCustomer.status || '-'}</strong>
              </div>

              <div>
                <span>{t('Penanggung Jawab (PIC)')}</span>
                <strong>{selectedCustomer.picName || t('Belum ditugaskan')}</strong>
              </div>
            </div>

            <p className="staff-customer-readonly-note">
              {t('Informasi ini hanya dapat dilihat oleh Staff. Perubahan data dilakukan melalui akun Supervisor.')}

            </p>

            <button
              type="button"
              className="staff-customer-close-button"
              onClick={() => setSelectedCustomer(null)}
            >
              {t('Tutup')}
            </button>
          </section>
        </div>
      )}

    </main>
  );
}

export default StaffCustomer;
