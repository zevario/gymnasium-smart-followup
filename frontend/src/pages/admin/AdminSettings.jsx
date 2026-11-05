import { useEffect, useState } from 'react';
import "../../assets/styles/admin/AdminSettings.css";

const initialAccounts = [
  {
    id: 1,
    name: 'Alya Putri',
    email: 'alya.putri@gymnasyum.id',
    role: 'Admin/CS & Sales',
    description:
      'Tawarkan promo, follow-up member yang tertarik, bantu pembelian atau perpanjangan, dan catat hasilnya.',
    active: true,
  },
  {
    id: 2,
    name: 'Fajar Nugraha',
    email: 'fajar.nugraha@gymnasyum.id',
    role: 'Admin/CS & Sales',
    description:
      'Tawarkan promo, follow-up member yang tertarik, bantu pembelian atau perpanjangan, dan catat hasilnya.',
    active: true,
  },
  {
    id: 3,
    name: 'Nisa Amalia',
    email: 'nisa.amalia@gymnasyum.id',
    role: 'Supervisor / Manajer Operasional',
    description:
      'Atur jeda follow-up up 3–7 hari, tentukan petugas dan izin kontak member, serta beri catatan arahan.',
    active: true,
  },
  {
    id: 4,
    name: 'Raka Kurnia',
    email: 'raka.kurnia@gymnasyum.id',
    role: 'Administrator Sistem',
    description:
      'Buat akun karyawan, ubah peran, dan nonaktifkan akun yang tidak lagi digunakan.',
    active: true,
  },
];

const roles = [
  'Admin/CS & Sales',
  'Supervisor / Manajer Operasional',
  'Administrator Sistem',
];

function Settings() {
  const [accounts, setAccounts] = useState(() => {
    const savedAccounts = localStorage.getItem('gymnasyum_accounts');

    return savedAccounts
      ? JSON.parse(savedAccounts)
      : initialAccounts;
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(roles[0]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    localStorage.setItem(
      'gymnasyum_accounts',
      JSON.stringify(accounts)
    );
  }, [accounts]);

  const handleCreateAccount = (event) => {
    event.preventDefault();

    const emailExists = accounts.some(
      (account) =>
        account.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (emailExists) {
      alert('Email sudah terdaftar.');
      return;
    }

    const newAccount = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      description: 'Akun karyawan Gymnasyum.',
      active: true,
    };

    setAccounts((previousAccounts) => [
      ...previousAccounts,
      newAccount,
    ]);

    setName('');
    setEmail('');
    setPassword('');
    setRole(roles[0]);
  };

  const handleEditAccount = (account) => {
  setEditingId(account.id);
  setName(account.name);
  setEmail(account.email);
  setRole(account.role);

  // Password tidak ditampilkan kembali.
  setPassword('');
  };

  const handleUpdateAccount = (event) => {
  event.preventDefault();

  const emailExists = accounts.some(
    (account) =>
      account.id !== editingId &&
      account.email.toLowerCase() === email.trim().toLowerCase()
  );

  if (emailExists) {
    alert('Email sudah digunakan akun lain.');
    return;
  }

  setAccounts((previousAccounts) =>
    previousAccounts.map((account) =>
      account.id === editingId
        ? {
            ...account,
            name: name.trim(),
            email: email.trim(),
            role,
            ...(password ? { password } : {}),
          }
        : account
    )
  );

  setEditingId(null);
  setName('');
  setEmail('');
  setPassword('');
  setRole(roles[0]);
  };

  const handleDeleteAccount = (id) => {
  const confirmed = window.confirm(
    'Apakah kamu yakin ingin menghapus akun ini secara permanen?'
  );

  if (!confirmed) return;

  setAccounts((previousAccounts) =>
    previousAccounts.filter((account) => account.id !== id)
  );
  };

  const handleChangeRole = (id, newRole) => {
    setAccounts((previousAccounts) =>
      previousAccounts.map((account) =>
        account.id === id
          ? { ...account, role: newRole }
          : account
      )
    );
  };

  const handleToggleStatus = (id) => {
    setAccounts((previousAccounts) =>
      previousAccounts.map((account) =>
        account.id === id
          ? { ...account, active: !account.active }
          : account
      )
    );
  };





  return (
    <section className="settings-page">
      <div className="settings-heading">
        <span className="settings-eyebrow">
          ADMINISTRATOR SISTEM
        </span>

        <h1>Administrasi sistem</h1>
      </div>

      <section className="settings-card">
        <div className="settings-card-heading">
          <h2>Akun dan hak akses</h2>

          <p>
            Administrator membuat akun, mengubah peran, dan
            menonaktifkan akses karyawan. 
          </p>
          <p>
            Supervisor/Manajer Operasional mengatur follow-up
          </p>
          <p>
            Admin/CS dan Sales
            menggunakan Promosi dan Notifikasi.
          </p>
        </div>

        <form
          className="account-form"
          onSubmit={editingId ? handleUpdateAccount : handleCreateAccount}
        >
          <div className="settings-field">
            <label htmlFor="account-name">
              Nama lengkap
            </label>

            <input
              id="account-name"
              type="text"
              placeholder="Masukkan nama lengkap"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="settings-field">
            <label htmlFor="account-email">
              Email
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
              Password
            </label>

            <input
              id="account-password"
              type="password"
              placeholder="Buat password akun"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>

          <div className="settings-field">
            <label htmlFor="account-role">
              Peran
            </label>

            <select
              id="account-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="create-account-button"
          >
            {editingId ? 'Simpan Perubahan' : 'Buat akun'}
          </button>
            
          {editingId && (
            <button
              type="button"
              className="toggle-account-button"
              onClick={() => {
                setEditingId(null);
                setName('');
                setEmail('');
                setPassword('');
                setRole(roles[0]);
              }}
            >
              Batal
            </button>
        )}
        </form>

        <div className="account-list">
          {accounts.map((account) => (
            <article
              className="account-item"
              key={account.id}
            >
              <div className="account-avatar">
                {account.name
                  .split(' ')
                  .map((word) => word[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>

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
                    aria-label={`Peran ${account.name}`}
                  >
                    {roles.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <span
                    className={`account-status ${
                      account.active ? 'active' : 'inactive'
                    }`}
                  >
                    {account.active ? 'Aktif' : 'Nonaktif'}
                  </span>

                  <button
                    type="button"
                    className="toggle-account-button"
                    onClick={() => handleEditAccount(account)}
                  >
                    {account.active
                      ? 'Nonaktifkan'
                      : 'Aktifkan'}
                  </button>
                  
                  <button
                    type="button"
                    className="toggle-account-button"
                    onClick={() => handleEditAccount(account)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="toggle-account-button delete-account-button"
                    onClick={() => handleDeleteAccount(account.id)}
                  >
                    Hapus
                  </button>

                </div>

                <p className="account-description">
                  {account.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default Settings;
