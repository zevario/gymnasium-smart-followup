import { useEffect, useState } from 'react';
import '../assets/styles/Profile.css';

function Profile({ currentUser }) {
  const [activeTab, setActiveTab] = useState('profile');

 const [profile, setProfile] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    role: currentUser?.accountRole || '',
    location: 'Gymnasyum Bintaro',
  });

  useEffect(() => {
    setProfile((prev) => ({
      ...prev,
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      role: currentUser?.accountRole || '',
    }));
  }, [currentUser]);

  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSaveProfile = (event) => {
    event.preventDefault();
    alert('Data profil berhasil disimpan (simulasi).');
  };

  const handleUpdatePassword = (event) => {
    event.preventDefault();

    if (passwords.newPassword.length < 8) {
      alert('Password baru minimal 8 karakter.');
      return;
    }

    if (!/[a-z]/.test(passwords.newPassword)) {
      alert('Password harus memiliki huruf kecil.');
      return;
    }

    if (!/[A-Z]/.test(passwords.newPassword)) {
      alert('Password harus memiliki huruf besar.');
      return;
    }

    if (passwords.newPassword === passwords.oldPassword) {
      alert('Password baru harus berbeda dari password lama.');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('Konfirmasi password tidak cocok.');
      return;
    }

    alert('Password berhasil diperbarui (simulasi).');

    setPasswords({
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const passwordFields = [
    {
      name: 'oldPassword',
      label: 'Password Lama',
      placeholder: 'Masukkan password lama',
    },
    {
      name: 'newPassword',
      label: 'Password Baru',
      placeholder: 'Masukkan password baru',
    },
    {
      name: 'confirmPassword',
      label: 'Konfirmasi Password Baru',
      placeholder: 'Masukkan konfirmasi password baru',
    },
  ];

  return (
    <div className="profile-page">
      <div className="profile-heading">
        <span className="profile-eyebrow">AKUN SAYA</span>
        <h1>Profil saya</h1>
        <p>Informasi akun dan peran Anda di Gymnasyum.</p>
      </div>

      <div className="profile-tabs">
        <button
          type="button"
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profil
        </button>

        <button
          type="button"
          className={activeTab === 'security' ? 'active' : ''}
          onClick={() => setActiveTab('security')}
        >
          Keamanan
        </button>
      </div>

      {activeTab === 'profile' && (
        <section className="profile-card">
          <div className="profile-card-header">
            <div>
              <h2>Informasi akun &amp; profil</h2>
              <p>Kelola foto profil dan lihat informasi akun Anda.</p>
            </div>
            
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="profile-identity">
              <div className="profile-photo">
                {profile.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{profile.name}</strong>
                <span>{profile.email}</span>
                <small>Foto profil dapat ditambahkan pada integrasi berikutnya.</small>
              </div>
            </div>

            <h3>Informasi pribadi</h3>

            <div className="profile-form-grid">
              <div className="profile-field">
                <label htmlFor="profile-name">Nama lengkap</label>
                <input
                  id="profile-name"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  required
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-email">Email</label>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  required
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-role">Peran</label>
                <input
                  id="profile-role"
                  value={profile.role}
                  readOnly
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-location">Lokasi</label>
                <input
                  id="profile-location"
                  name="location"
                  value={profile.location}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            <div className="profile-card-footer">
              <span>Anda menggunakan profil demo untuk mencoba Smart Follow-up.</span>
              <button type="submit">Simpan Data Akun</button>
            </div>
          </form>
        </section>
      )}

      {activeTab === 'security' && (
        <section className="profile-card security-card">
          <div className="security-form">
            <h2>Ubah Password</h2>
            <p>Masukkan password lama dan password baru Anda.</p>

            <div className="security-demo-note">
              Mode demo: formulir ini hanya menyimulasikan perubahan password.
              Password login tetap sama.
            </div>

            <form onSubmit={handleUpdatePassword}>
              {passwordFields.map((field) => (
                <div className="profile-field" key={field.name}>
                  <label htmlFor={field.name}>{field.label}</label>

                  <div className="password-input-wrapper">
                    <input
                      id={field.name}
                      name={field.name}
                      type={showPasswords[field.name] ? 'text' : 'password'}
                      placeholder={field.placeholder}
                      value={passwords[field.name]}
                      onChange={handlePasswordChange}
                      required
                    />

                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(field.name)}
                      aria-label="Tampilkan atau sembunyikan password"
                    >
                      {showPasswords[field.name] ? 'Sembunyikan' : 'Lihat'}
                    </button>
                  </div>
                </div>
              ))}

              <button type="submit" className="update-password-button">
                Update Password
              </button>
            </form>
          </div>

          <aside className="password-requirements">
            <h3>Persyaratan Password</h3>
            <p>Gunakan password yang kuat dengan ketentuan berikut.</p>

            <ul>
              <li>Minimal 8 karakter</li>
              <li>Minimal satu huruf kecil</li>
              <li>Minimal satu huruf besar (kapital)</li>
              <li>Berbeda dari password sebelumnya</li>
            </ul>
          </aside>
        </section>
      )}
    </div>
  );
}

export default Profile;