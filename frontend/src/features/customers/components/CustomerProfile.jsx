import ProfilePhotoEditor from '../../profile/components/ProfilePhotoEditor.jsx';
import { ProfileIdentity } from '../../profile/components/ProfileIdentity.jsx';
import { defaultProfilePhoto, isProfilePhoto } from '../../profile/utils/profilePhoto.js';
import { demoPassword } from '../../auth/services/demoAccounts.js';
import { useState } from 'react';
import { Eye, EyeOff, UserRound, ShieldCheck } from 'lucide-react';

function PasswordField({ name, label }) {
  const [visible, setVisible] = useState(false);
  return (
    <label>
      {label}
      <span className="customer-password">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          placeholder={'Masukkan ' + label.toLowerCase()}
          required
          minLength={10}
          autoComplete={name === 'current' ? 'current-password' : 'new-password'}
        />
        <button
          type="button"
          className="secondary"
          aria-label={(visible ? 'Sembunyikan ' : 'Tampilkan ') + label}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </span>
    </label>
  );
}
export function CustomerProfile({ person, settings, save, busy, demo, commit }) {
  const [securityMessage, setSecurityMessage] = useState('');
  const [editingPhoto, setEditingPhoto] = useState(false);
  const photo = isProfilePhoto(settings.photo) ? settings.photo : defaultProfilePhoto;
  const [tab, setTab] = useState('profile');
  return (
    <>
      <p className="customer-subtitle">Kelola informasi pribadi, kontak, dan keamanan akun Anda.</p>
      <div
        className="member-tabs segmented customer-profile-tabs"
        role="group"
        aria-label="Bagian profil"
      >
        <button
          className={tab === 'profile' ? 'selected' : undefined}
          aria-pressed={tab === 'profile'}
          onClick={() => setTab('profile')}
        >
          Profil
        </button>
        <button
          className={tab === 'security' ? 'selected' : undefined}
          aria-pressed={tab === 'security'}
          onClick={() => setTab('security')}
        >
          Keamanan
        </button>
      </div>
      {tab === 'profile' ? (
        <section className="customer-profile-card">
          <header className="customer-card-heading">
            <span className="customer-heading-icon">
              <UserRound />
            </span>
            <div>
              <h2>Informasi akun & profil</h2>
              <p>Kelola foto profil dan informasi akun Anda.</p>
            </div>
            {demo && <small className="customer-demo-label">Akun demo</small>}
          </header>
          <div className="customer-profile-body">
            {editingPhoto && (
              <ProfilePhotoEditor
                photo={photo}
                name={person.name}
                onClose={() => setEditingPhoto(false)}
                onSave={async (value) => {
                  await commit('settings', 'PATCH', { photo: value });
                }}
              />
            )}
            <ProfileIdentity photo={photo} user={person} setEditingPhoto={setEditingPhoto} />
            <h3>Informasi pribadi</h3>
            <form
              className="customer-form-grid"
              onSubmit={save('me', 'PUT', ({ birth, gender, country, address, ...d }) => ({
                ...d,
                contact: !!d.contact,
                settings: { birth, gender, country, address },
              }))}
            >
              <label>
                Nama lengkap
                <input
                  name="name"
                  defaultValue={person.name}
                  minLength={2}
                  maxLength={100}
                  required
                />
              </label>
              <label>
                Nomor kontak
                <input
                  name="phone"
                  defaultValue={person.phone}
                  pattern={'\\+[1-9][0-9]{7,14}'}
                  required
                  onInvalid={(e) =>
                    e.currentTarget.setCustomValidity(
                      'Gunakan kode negara tanpa angka 0 di depan, contoh +628123456789.',
                    )
                  }
                  onInput={(e) => e.currentTarget.setCustomValidity('')}
                />
                <small>Gunakan kode negara, contoh +628123456789.</small>
              </label>
              <label>
                Email
                <input type="email" value={person.email} readOnly />
              </label>
              <label>
                Lokasi
                <input value="Gymnasyum Bintaro" readOnly />
              </label>
              <label>
                Peran
                <input value="Customer" readOnly />
              </label>
              <label className="customer-full customer-consent">
                <input type="checkbox" name="contact" defaultChecked={person.contact} /> Izinkan
                follow-up paket dan trial
              </label>
              <h3 className="customer-full">Detail tambahan</h3>
              <label>
                Tanggal lahir
                <input name="birth" type="date" defaultValue={settings.birth?.slice(0, 10)} />
              </label>
              <label>
                Jenis kelamin
                <select name="gender" defaultValue={settings.gender || ''}>
                  <option value="">Tidak diisi</option>
                  {['Laki-laki', 'Perempuan', 'Lainnya'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Negara
                <input name="country" maxLength={80} defaultValue={settings.country} />
              </label>
              <label>
                Alamat
                <input name="address" maxLength={300} defaultValue={settings.address} />
              </label>
              <div className="customer-form-footer customer-full">
                <button disabled={busy}>Simpan profil</button>
              </div>
            </form>
          </div>
        </section>
      ) : (
        <section className="customer-security">
          <div>
            {!demo && (
              <details className="customer-email-editor">
                <summary>Ubah alamat email</summary>
                <form onSubmit={save('credentials', 'PUT', (d) => ({ ...d, password: '' }))}>
                  <label>
                    Email baru
                    <input name="email" type="email" defaultValue={person.email} required />
                  </label>
                  <PasswordField name="current" label="Kata sandi saat ini" />
                  <p>Konfirmasikan alamat baru melalui tautan yang dikirim ke email tersebut.</p>
                  <button disabled={busy}>Kirim konfirmasi email</button>
                </form>
              </details>
            )}
            <h2>Ubah kata sandi</h2>
            <p>Masukkan kata sandi saat ini dan kata sandi baru Anda.</p>
            {demo && (
              <p className="customer-demo-note">
                Mode demo: formulir ini menyimulasikan perubahan kata sandi. Kata sandi login tetap
                sama.
              </p>
            )}
            <p role="status">{securityMessage}</p>
            <form
              onSubmit={
                demo
                  ? (e) => {
                      e.preventDefault();
                      const data = Object.fromEntries(new FormData(e.currentTarget));
                      if (data.current !== demoPassword) {
                        setSecurityMessage('Kata sandi saat ini salah.');
                        return;
                      }
                      if (data.password !== data.confirm) {
                        setSecurityMessage('Konfirmasi kata sandi belum cocok.');
                        return;
                      }
                      if (data.password === data.current) {
                        setSecurityMessage('Gunakan kata sandi baru yang berbeda.');
                        return;
                      }
                      e.currentTarget.reset();
                      setSecurityMessage('Simulasi perubahan kata sandi berhasil.');
                    }
                  : save('credentials', 'PUT', (d) => {
                      if (d.password !== d.confirm)
                        throw new Error('Konfirmasi kata sandi belum cocok.');
                      if (d.password === d.current)
                        throw new Error('Gunakan kata sandi baru yang berbeda.');
                      return { email: person.email, current: d.current, password: d.password };
                    })
              }
            >
              <PasswordField name="current" label="Kata sandi saat ini" />
              <PasswordField name="password" label="Kata sandi baru" />
              <PasswordField name="confirm" label="Konfirmasi kata sandi baru" />
              <button disabled={busy}>Perbarui kata sandi</button>
            </form>
          </div>
          <div className="customer-security-help">
            <ShieldCheck />
            <h3>Persyaratan kata sandi</h3>
            <p>Gunakan kata sandi yang memenuhi ketentuan berikut.</p>
            <ul>
              <li>Minimal 10 karakter</li>
              <li>Berbeda dari kata sandi saat ini</li>
              <li>Konfirmasi sama dengan kata sandi baru</li>
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
