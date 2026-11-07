import { useEffect, useState } from 'react';
import {
  getCustomers,
  getUsers,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
} from '../../services/api.js';
import '../../assets/styles/spv/SPVCustomer.css';
import useI18n from '../../i18n/useI18n.js';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  gender: '',
  address: '',
  notes: '',
  membership_package: '',
  membership_start: '',
  membership_end: '',
  contact_permission: 'true',
  pic_id: '',
  status: 'active',
};

const picRoles = new Set(['spv', 'staff']);

const formatRole = (role) => role.toUpperCase();

function SPVCustomer() {
  const { t, formatDate, formatNumber } = useI18n();
  const [customers, setCustomers] = useState([]);
  const [picOptions, setPicOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [picErrorMessage, setPicErrorMessage] = useState('');

  // Mengambil data Customer dari PostgreSQL melalui Express API.
  useEffect(() => {
    let isMounted = true;

    const loadCustomers = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const result = await getCustomers({
          page: 1,
          limit: 100,
          search: searchTerm.trim(),
        });

        if (isMounted) {
          setCustomers(result.customers || []);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, [searchTerm]);

  useEffect(() => {
    let isMounted = true;

    const loadPicOptions = async () => {
      try {
        const users = await getUsers();
        if (isMounted) {
          setPicOptions(
            users.filter(
              (user) => user.is_active && picRoles.has(user.role)
            )
          );
        }
      } catch (error) {
        if (isMounted) {
          setPicErrorMessage(error.message);
        }
      }
    };

    loadPicOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingId(customer.id);

    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      gender: customer.gender || '',
      address: customer.address || '',
      notes: customer.notes || '',
      membership_package: customer.membership_package || '',
      membership_start: customer.membership_start
        ? customer.membership_start.slice(0, 10)
        : '',
      membership_end: customer.membership_end
        ? customer.membership_end.slice(0, 10)
        : '',
      contact_permission: customer.contact_permission ? 'true' : 'false',
      pic_id: picOptions.some(
        (user) => user.id === customer.pic_id
      )
        ? customer.pic_id
        : '',
      status: customer.status || 'active',
    });

    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (picErrorMessage) {
      setErrorMessage(t(
        'Daftar PIC gagal dimuat. Muat ulang halaman sebelum menyimpan.'
      ));
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMessage(t('Nama dan nomor WhatsApp wajib diisi.'));
      return;
    }

    if (
      formData.membership_start &&
      formData.membership_start > formData.membership_end
    ) {
      setErrorMessage(
        t('Tanggal mulai membership harus sebelum tanggal berakhir.')
      );
      return;
    }

    const customerData = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim(),
      gender: formData.gender || null,
      address: formData.address.trim() || null,
      notes: formData.notes.trim() || null,
      membership_package: formData.membership_package.trim(),
      membership_start: formData.membership_start || null,
      membership_end: formData.membership_end,
      contact_permission: formData.contact_permission === 'true',
      pic_id: picOptions.some((user) => user.id === formData.pic_id)
        ? formData.pic_id
        : null,
    };

    try {
      setIsSaving(true);
      setErrorMessage('');

      if (editingId) {
        await updateCustomer(editingId, {
          ...customerData,
          status: formData.status,
        });
      } else {
        await createCustomer(customerData);
      }

      const result = await getCustomers({
        page: 1,
        limit: 100,
        search: searchTerm.trim(),
      });

      setCustomers(result.customers || []);
      setIsFormOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    const confirmed = window.confirm(t(
      'Apakah kamu yakin ingin menonaktifkan pelanggan ini?'
    ));

    if (!confirmed) return;

    try {
      setErrorMessage('');

      await deactivateCustomer(id);

      const result = await getCustomers({
        page: 1,
        limit: 100,
        search: searchTerm.trim(),
      });

      setCustomers(result.customers || []);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const filteredCustomers = customers;

  const getStatusLabel = (customer) => {
    if (customer.status !== 'active') return t('Tidak aktif');
    if (!customer.membership_end) return t('Aktif');

    const endOfMembership = new Date(
      `${customer.membership_end.slice(0, 10)}T23:59:59`
    );
    return endOfMembership < new Date() ? t('Kedaluwarsa') : t('Aktif');
  };

  const getStatusClass = (customer) => {
    return getStatusLabel(customer) === t('Aktif')
      ? 'status-active'
      : 'status-inactive';
  };

  // JSX return tetap di bawah sini.

return (
    <div className="spv-customers">
      <div className="spv-customers-heading">
        <div>
          <span className="spv-eyebrow">{t('DATA MEMBER GYMNASYUM')}</span>
          <h1>{t('Data Pelanggan')}</h1>
          <p>
            {t('Kelola informasi pelanggan dan status keanggotaan Gymnasyum.')}
          </p>
        </div>

        <div className="spv-customer-total">
          <span>{t('Total Pelanggan')}</span>
          <strong>{formatNumber(customers.length)}</strong>
        </div>
      </div>

      <section className="spv-customer-section">
        <div className="spv-customer-section-heading">
          <div>
            <h2>{t('Daftar Pelanggan')}</h2>
            <p>{t('Data pelanggan yang dikelola oleh Supervisor.')}</p>
          </div>

          <button
            type="button"
            className="spv-add-button"
            onClick={handleOpenAdd}
          >
            + {t('Tambah Pelanggan')}
          </button>
        </div>

        <div className="spv-customer-toolbar">
          <input
            type="search"
            placeholder={t('Cari nama, nomor WhatsApp, paket, atau PIC...')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <span>{formatNumber(filteredCustomers.length)} {t('pelanggan ditampilkan')}</span>
        </div>

        <div className="spv-customer-table-wrapper">
          {errorMessage && (
            <p className="spv-pic-warning">{t(errorMessage)}</p>
          )}

          {isLoading && (
            <p>{t('Memuat data pelanggan...')}</p>
          )}
          <table className="spv-customer-table">
            <thead>
              <tr>
                <th>{t('PELANGGAN')}</th>
                <th>{t('PAKET MEMBERSHIP')}</th>
                <th>{t('STATUS')}</th>
                <th>{t('KUNJUNGAN TERAKHIR')}</th>
                <th>{t('MASA MEMBERSHIP')}</th>
                <th>{t('IZIN KONTAK')}</th>
                <th>{t('PIC')}</th>
                <th>{t('AKSI')}</th>
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

                  <td>{customer.membership_package || t('Belum ditentukan')}</td>

                  <td>
                    <span className={`spv-status ${getStatusClass(customer)}`}>
                      {getStatusLabel(customer)}
                    </span>
                  </td>

                  <td>{formatDate(customer.last_visit)}</td>

                  <td>
                    <div className="spv-membership-dates">
                      <span>
                        {t('Mulai')}: {formatDate(customer.membership_start)}
                      </span>
                      <span>
                        {t('Berakhir')}: {formatDate(customer.membership_end)}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`spv-contact ${
                        customer.contact_permission
                          ? 'contact-active'
                          : 'contact-rejected'
                      }`}
                    >
                      ● {customer.contact_permission
                        ? t('Diizinkan')
                        : t('Tidak diizinkan')}
                    </span>
                  </td>

                  <td>{customer.pic_name || t('Belum ditugaskan')}</td>

                  <td>
                    <div className="spv-customer-actions">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(customer)}
                      >
                        {t('Edit')}
                      </button>

                      <button
                        type="button"
                        className="delete-action"
                        disabled={customer.status === 'inactive'}
                        onClick={() => handleDeactivate(customer.id)}
                      >
                        {t('Nonaktifkan')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="8" className="spv-empty-state">
                    {t('Belum ada data pelanggan atau pelanggan tidak ditemukan.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="spv-customer-footer">
          {t('Menampilkan {{shown}} dari {{total}} pelanggan.', {
            shown: formatNumber(filteredCustomers.length),
            total: formatNumber(customers.length),
          })}
        </div>
      </section>

      <div className="spv-customer-info">
        <strong>{t('Informasi Pengelolaan')}</strong>
        <p>
          {t('Data pelanggan dikelola oleh Supervisor. Kunjungan terakhir diperbarui otomatis berdasarkan riwayat absensi Staff.')}
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
                    ? t('Edit Pelanggan')
                    : t('Tambah Pelanggan')}
                </h2>
                <p>{t('Lengkapi informasi keanggotaan pelanggan.')}</p>
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
                {t('Nama Lengkap')}
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('Masukkan nama lengkap')}
                  required
                />
              </label>

              <label>
                {t('Email')}
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('Masukkan email')}
                />
              </label>

              <label>
                {t('Nomor WhatsApp')}
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t('Contoh: 081234567890')}
                  required
                />
              </label>

              <label>
                {t('Paket Membership')}
                <select
                  name="membership_package"
                  value={formData.membership_package}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t('-- Pilih Paket --')}</option>
                  <option value="Open Gym Bulanan">{t('Open Gym Bulanan')}</option>
                  <option value="Open Gym 3 Bulan">{t('Open Gym 3 Bulan')}</option>
                  <option value="Open Gym Tahunan">{t('Open Gym Tahunan')}</option>
                  <option value="Personal Training">{t('Personal Training')}</option>
                  <option value="Trial Open Gym">{t('Trial Open Gym')}</option>
                  <option value="Trial Group Class">{t('Trial Group Class')}</option>
                  <option value="Yoga Bulanan">{t('Yoga Bulanan')}</option>
                </select>
              </label>

              <label>
                {t('Tanggal Mulai Membership')}
                <input
                  type="date"
                  name="membership_start"
                  value={formData.membership_start}
                  onChange={handleChange}
                />
              </label>

              <label>
                {t('Tanggal Berakhir Membership')}
                <input
                  type="date"
                  name="membership_end"
                  value={formData.membership_end}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                {t('Izin Kontak')}
                <select
                  name="contact_permission"
                  value={formData.contact_permission}
                  onChange={handleChange}
                >
                  <option value="true">{t('Diizinkan')}</option>
                  <option value="false">{t('Tidak diizinkan')}</option>
                </select>
              </label>

              <label>
                {t('PIC (Penanggung Jawab)')}
                <select
                  name="pic_id"
                  value={formData.pic_id}
                  onChange={handleChange}
                >
                  <option value="">{t('Belum ditugaskan')}</option>
                  {picOptions.map((user) => (
                    <option
                      key={user.id}
                      value={user.id}
                    >
                      {user.name} ({formatRole(user.role)})
                    </option>
                  ))}
                </select>
              </label>

              {picErrorMessage && (
                <p className="spv-pic-warning">{t(picErrorMessage)}</p>
              )}

              {!picErrorMessage &&
                !picOptions.some(
                  (user) => picRoles.has(user.role)
                ) && (
                <p className="spv-pic-warning">
                  {t('Belum ada akun SPV atau Staff aktif yang dapat ditugaskan sebagai PIC.')}
                </p>
              )}

              <label>
                {t('Jenis Kelamin')}
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">{t('-- Pilih Jenis Kelamin --')}</option>
                  <option value="male">{t('Laki-laki')}</option>
                  <option value="female">{t('Perempuan')}</option>
                  <option value="other">{t('Lainnya')}</option>
                </select>
              </label>

              <label>
                {t('Alamat')}
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={t('Masukkan alamat pelanggan')}
                />
              </label>

              <label>
                {t('Catatan')}
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder={t('Catatan tambahan')}
                />
              </label>

              {editingId && (
                <label>
                  {t('Status Pelanggan')}
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">{t('Aktif')}</option>
                    <option value="inactive">{t('Tidak aktif')}</option>
                  </select>
                </label>
              )}

              {errorMessage && (
                <p className="spv-pic-warning">{t(errorMessage)}</p>
              )}

              <div className="spv-modal-actions">
                <button
                  type="button"
                  className="spv-cancel-button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSaving}
                >
                  {t('Batal')}
                </button>

                <button
                  type="submit"
                  className="spv-save-button"
                  disabled={isSaving}
                >
                  {isSaving
                    ? t('Menyimpan...')
                    : editingId
                      ? t('Simpan Perubahan')
                      : t('Tambah Pelanggan')}
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