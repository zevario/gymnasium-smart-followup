import { useState } from 'react';
import '../assets/styles/Settings.css';

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
  const [accounts, setAccounts] = useState(initialAccounts);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(roles[0]);

  const handleCreateAccount = (event) => {
    event.preventDefault();

    const emailExists = accounts.some(
      (account) => account.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (emailExists) {
      alert('Email sudah terdaftar.');
      return;
    }

    const newAccount = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim(),
      role,
      description:
        'Akun karyawan Gymnasyum.',
      active: true,
    };

    setAccounts((previousAccounts) => [
      ...previousAccounts,
      newAccount,
    ]);

    setName('');
    setEmail('');
    setRole(roles[0]);
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

        <p>
          Kelola akses akun demo dan periksa kesiapan koneksi.
          Data pelanggan dibatasi untuk peran operasional.
        </p>
      </div>

      <section className="settings-card">
        <div className="settings-card-heading">
          <h2>Akun dan hak akses</h2>

          <p>
            Administrator membuat akun, mengubah peran, dan
            menonaktifkan akses karyawan. Admin/CS dan Sales
            menggunakan satu peran operasional.
          </p>
        </div>

        <form
          className="account-form"
          onSubmit={handleCreateAccount}
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
            Buat akun
          </button>
        </form>

        <p className="demo-password">
          Akun demo tersimpan di browser ini.
          Kata sandi demo: GymnasyumDemo123!
        </p>

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
                    onClick={() =>
                      handleToggleStatus(account.id)
                    }
                  >
                    {account.active
                      ? 'Nonaktifkan'
                      : 'Aktifkan'}
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
