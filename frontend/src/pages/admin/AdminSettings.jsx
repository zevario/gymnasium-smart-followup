import { useEffect, useState } from 'react';
import "../../assets/styles/admin/AdminSettings.css";
import {
  createUser,
  deleteUser,
  getUsers,
  getUserProfilePhoto,
  updateUser,
} from '../../services/api.js';
import useI18n from '../../i18n/useI18n.js';

function AccountAvatar({ account }) {
  const { t } = useI18n();
  const [photoUrl, setPhotoUrl] = useState(null);
  const initials = account.name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  useEffect(() => {
    let active = true;
    let objectUrl;

    getUserProfilePhoto(account.id)
      .then((photoBlob) => {
        if (!active || !photoBlob) return;
        objectUrl = URL.createObjectURL(photoBlob);
        setPhotoUrl(objectUrl);
      })
      .catch((error) => {
        console.error(`Gagal memuat foto akun ${account.id}:`, error);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [account.id]);

  if (photoUrl) {
    return (
      <img
        className="account-avatar"
        src={photoUrl}
        alt={t('Foto profil {{name}}', { name: account.name })}
      />
    );
  }

  return <div className="account-avatar">{initials}</div>;
}

const roles = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Kelola akun karyawan dan hak akses sistem.',
  },
  {
    value: 'spv',
    label: 'SPV',
    description: 'Kelola operasional, membership, dan follow-up pelanggan.',
  },
  {
    value: 'staff',
    label: 'Staff',
    description: 'Kelola aktivitas operasional dan kehadiran pelanggan.',
  },
];

function Settings() {
  const { t } = useI18n();
  const [accounts, setAccounts] = useState([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(roles[0].value);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    getUsers()
      .then((users) => {
        if (isMounted) setAccounts(users);
      })
      .catch((error) => {
        if (isMounted) setErrorMessage(error.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole(roles[0].value);
    setEditingId(null);
  };

  const handleEditAccount = (account) => {
    setEditingId(account.id);
    setName(account.name);
    setEmail(account.email);
    setRole(account.role);
    setPassword('');
    setErrorMessage('');
  };

  const handleSubmitAccount = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    try {
      const accountData = {
        name: name.trim(),
        email: email.trim(),
        role,
      };

      if (password) accountData.password = password;

      if (editingId) {
        await updateUser(editingId, accountData);
      } else {
        await createUser({ ...accountData, password });
      }

      setAccounts(await getUsers());
      resetForm();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeRole = async (id, newRole) => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      await updateUser(id, { role: newRole });
      setAccounts(await getUsers());
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (account) => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      await updateUser(account.id, { is_active: !account.is_active });
      setAccounts(await getUsers());
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async (account) => {
    const confirmed = window.confirm(t(
      'Hapus akun {{name}} secara permanen? Data pelanggan tetap ada, tetapi penugasan PIC ke akun ini akan dikosongkan.',
      { name: account.name },
    ));

    if (!confirmed) return;

    setIsSaving(true);
    setErrorMessage('');

    try {
      await deleteUser(account.id);
      setAccounts(await getUsers());
      if (editingId === account.id) resetForm();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="settings-page">
      <div className="settings-heading">
        <span className="settings-eyebrow">
          {t('ADMINISTRATOR SISTEM')}
        </span>

        <h1>{t('Administrasi sistem')}</h1>
      </div>

      <section className="settings-card">
        <div className="settings-card-heading">
          <h2>{t('Akun dan hak akses')}</h2>

          <p>
            {t('Administrator membuat akun, mengubah peran, dan menonaktifkan akses karyawan.')}
          </p>
          <p>
            {t('Supervisor/Manajer Operasional mengatur follow-up pelanggan.')}
          </p>
          <p>
            {t('Admin/CS dan Sales menggunakan Promosi dan Notifikasi.')}
          </p>
        </div>

        <form
          className="account-form"
          onSubmit={handleSubmitAccount}
        >
          <div className="settings-field">
            <label htmlFor="account-name">
              {t('Nama lengkap')}
            </label>

            <input
              id="account-name"
              type="text"
              placeholder={t('Masukkan nama lengkap')}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="settings-field">
            <label htmlFor="account-email">
              {t('Email')}
            </label>

            <input
              id="account-email"
              type="email"
              placeholder="nama@gymnasyum.id"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="settings-field">
            <label htmlFor="account-password">
              {t('Kata sandi')}
            </label>

            <input
              id="account-password"
              type="password"
              placeholder={
                editingId
                  ? t('Kosongkan jika tidak ingin mengubah')
                  : t('Buat password akun')
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required={!editingId}
            />
          </div>

          <div className="settings-field">
            <label htmlFor="account-role">
              {t('Peran')}
            </label>

            <select
              id="account-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {roles.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.label)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="create-account-button"
            disabled={isSaving}
          >
            {isSaving
              ? t('Menyimpan...')
              : editingId
                ? t('Simpan Perubahan')
                : t('Buat akun')}
          </button>
            
          {editingId && (
            <button
              type="button"
              className="toggle-account-button"
              onClick={resetForm}
              disabled={isSaving}
            >
              {t('Batal')}
            </button>
        )}
        </form>

        {errorMessage && (
          <p className="account-description" role="alert">
            {t(errorMessage)}
          </p>
        )}

        <div className="account-list">
          {isLoading ? (
            <p className="account-description">{t('Memuat akun...')}</p>
          ) : accounts.map((account) => (
            <article
              className="account-item"
              key={account.id}
            >
              <AccountAvatar account={account} />

              <div className="account-details">
                <h3>{account.name}</h3>
                <p className="account-email">
                  {account.email}
                </p>

                <div className="account-controls">
                  <select
                    value={account.role}
                    onChange={(event) =>
                      handleChangeRole(
                        account.id,
                        event.target.value
                      )
                    }
                    aria-label={t('role_of', { name: account.name })}
                    disabled={isSaving}
                  >
                    {roles.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.label)}
                      </option>
                    ))}
                  </select>

                  <span
                    className={`account-status ${
                      account.is_active ? 'active' : 'inactive'
                    }`}
                  >
                    {account.is_active ? t('Aktif') : t('Nonaktif')}
                  </span>

                  <button
                    type="button"
                    className="toggle-account-button"
                    onClick={() => handleToggleStatus(account)}
                    disabled={isSaving}
                  >
                    {account.is_active
                      ? t('Nonaktifkan')
                      : t('Aktifkan')}
                  </button>
                  
                  <button
                    type="button"
                    className="toggle-account-button"
                    onClick={() => handleEditAccount(account)}
                    disabled={isSaving}
                  >
                    {t('Edit')}
                  </button>

                  <button
                    type="button"
                    className="toggle-account-button delete-account-button"
                    onClick={() => handleDeleteAccount(account)}
                    disabled={isSaving}
                  >
                    {t('Hapus')}
                  </button>

                </div>

                <p className="account-description">
                  {t(roles.find((item) => item.value === account.role)?.description || '')}
                </p>
              </div>
            </article>
          ))}
          {!isLoading && accounts.length === 0 && !errorMessage && (
            <p className="account-description">{t('Belum ada akun pengguna.')}</p>
          )}
        </div>
      </section>
    </section>
  );
}

export default Settings;
