import { useEffect, useRef, useState } from 'react';
import '../assets/styles/Profile.css';
import useI18n from '../i18n/useI18n.js';
import {
  changeOwnPassword,
  deleteOwnProfilePhoto,
  updateOwnProfile,
  uploadOwnProfilePhoto,
} from '../services/api.js';

const MAX_PROFILE_PHOTO_SIZE = 2 * 1024 * 1024;
const MAX_PROFILE_PHOTO_DIMENSION = 512;
const PROFILE_PHOTO_QUALITY = 0.88;

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Foto tidak dapat diproses di browser ini.'));
      }
    }, type, quality);
  });

const loadPhotoImage = async (file) => {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    return {
      image: bitmap,
      dispose: () => bitmap.close(),
    };
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = sourceUrl;
    await image.decode();
    return {
      image,
      dispose: () => URL.revokeObjectURL(sourceUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(sourceUrl);
    throw error;
  }
};

const compressProfilePhoto = async (file) => {
  const { image, dispose } = await loadPhotoImage(file);

  try {
    const scale = Math.min(
      1,
      MAX_PROFILE_PHOTO_DIMENSION / image.width,
      MAX_PROFILE_PHOTO_DIMENSION / image.height,
    );
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Foto tidak dapat diproses di browser ini.');
    context.drawImage(image, 0, 0, width, height);

    let blob = await canvasToBlob(
      canvas,
      'image/webp',
      PROFILE_PHOTO_QUALITY,
    );
    if (blob.type !== 'image/webp') {
      const fallbackType = file.type === 'image/png'
        ? 'image/png'
        : 'image/jpeg';
      blob = await canvasToBlob(
        canvas,
        fallbackType,
        fallbackType === 'image/jpeg' ? PROFILE_PHOTO_QUALITY : undefined,
      );
    }

    if (blob.size > MAX_PROFILE_PHOTO_SIZE) {
      throw new Error('Ukuran hasil foto melebihi batas maksimal 2 MB.');
    }

    const extension = blob.type === 'image/webp'
      ? 'webp'
      : blob.type === 'image/png'
        ? 'png'
        : 'jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'profile-photo';
    return new File([blob], `${baseName}.${extension}`, {
      type: blob.type,
      lastModified: Date.now(),
    });
  } finally {
    dispose();
  }
};

function Profile({
  currentUser,
  photoUrl,
  onProfileUpdated,
  onProfilePhotoUpdated,
}) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    role: currentUser?.role || '',
  });
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
  const [profileMessage, setProfileMessage] = useState(null);
  const [securityMessage, setSecurityMessage] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState(null);
  const photoPreviewUrlRef = useRef(null);
  const photoSelectionRequestRef = useRef(0);

  useEffect(() => {
    return () => {
      if (photoPreviewUrlRef.current) {
        URL.revokeObjectURL(photoPreviewUrlRef.current);
      }
    };
  }, []);

  const setProfilePhotoSelection = (file) => {
    if (photoPreviewUrlRef.current) {
      URL.revokeObjectURL(photoPreviewUrlRef.current);
    }

    const previewUrl = file ? URL.createObjectURL(file) : null;
    photoPreviewUrlRef.current = previewUrl;
    setPhotoPreviewUrl(previewUrl);
    setSelectedPhoto(file);
  };

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

  const handlePhotoSelection = async (event) => {
    const file = event.target.files?.[0] || null;
    const requestId = ++photoSelectionRequestRef.current;
    setPhotoMessage(null);

    if (!file) {
      setProfilePhotoSelection(null);
      return;
    }

    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      setProfilePhotoSelection(null);
      setPhotoMessage({
        type: 'error',
        text: t('Pilih foto berformat JPG, PNG, atau WebP.'),
      });
      event.target.value = '';
      return;
    }

    setProcessingPhoto(true);
    setProfilePhotoSelection(null);
    try {
      const compressedPhoto = await compressProfilePhoto(file);
      if (requestId === photoSelectionRequestRef.current) {
        setProfilePhotoSelection(compressedPhoto);
      }
    } catch (compressionError) {
      if (requestId === photoSelectionRequestRef.current) {
        setPhotoMessage({
          type: 'error',
          text: t(compressionError.message),
        });
        event.target.value = '';
      }
    } finally {
      if (requestId === photoSelectionRequestRef.current) {
        setProcessingPhoto(false);
      }
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedPhoto) return;

    setSavingPhoto(true);
    setPhotoMessage(null);
    try {
      await uploadOwnProfilePhoto(selectedPhoto);
      const photoBlob = await onProfilePhotoUpdated?.();
      if (!photoBlob) throw new Error('Foto profil tidak dapat dimuat kembali.');
      setProfilePhotoSelection(null);
      const photoInput = document.getElementById('profile-photo-file');
      if (photoInput) photoInput.value = '';
      setPhotoMessage({
        type: 'success',
        text: t('Foto profil berhasil diunggah.'),
      });
    } catch (uploadError) {
      setPhotoMessage({
        type: 'error',
        text: t(uploadError.message),
      });
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    setDeletingPhoto(true);
    setPhotoMessage(null);
    try {
      await deleteOwnProfilePhoto();
      onProfilePhotoUpdated?.(null);
      setProfilePhotoSelection(null);
      setPhotoMessage({
        type: 'success',
        text: t('Foto profil berhasil dihapus.'),
      });
    } catch (deleteError) {
      setPhotoMessage({
        type: 'error',
        text: t(deleteError.message),
      });
    } finally {
      setDeletingPhoto(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const user = await updateOwnProfile({
        name: profile.name.trim(),
        email: profile.email.trim(),
      });
      setProfile({
        name: user.name,
        email: user.email,
        role: user.role,
      });
      onProfileUpdated?.(user);
      setProfileMessage({
        type: 'success',
        text: t('Data profil berhasil disimpan.'),
      });
    } catch (saveError) {
      setProfileMessage({
        type: 'error',
        text: t(saveError.message),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();

    if (passwords.newPassword.length < 8) {
      setSecurityMessage({ type: 'error', text: t('Password baru minimal 8 karakter.') });
      return;
    }

    if (!/[a-z]/.test(passwords.newPassword)) {
      setSecurityMessage({ type: 'error', text: t('Password harus memiliki huruf kecil.') });
      return;
    }

    if (!/[A-Z]/.test(passwords.newPassword)) {
      setSecurityMessage({ type: 'error', text: t('Password harus memiliki huruf besar.') });
      return;
    }

    if (passwords.newPassword === passwords.oldPassword) {
      setSecurityMessage({
        type: 'error',
        text: t('Password baru harus berbeda dari password lama.'),
      });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setSecurityMessage({ type: 'error', text: t('Konfirmasi password tidak cocok.') });
      return;
    }

    setSavingPassword(true);
    setSecurityMessage(null);
    try {
      await changeOwnPassword({
        currentPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword,
      });
      setPasswords({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setSecurityMessage({
        type: 'success',
        text: t('Password berhasil diperbarui.'),
      });
    } catch (updateError) {
      setSecurityMessage({
        type: 'error',
        text: t(updateError.message),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const passwordFields = [
    {
      name: 'oldPassword',
      label: t('Password Lama'),
      placeholder: t('Masukkan password lama'),
    },
    {
      name: 'newPassword',
      label: t('Password Baru'),
      placeholder: t('Masukkan password baru'),
    },
    {
      name: 'confirmPassword',
      label: t('Konfirmasi Password Baru'),
      placeholder: t('Masukkan konfirmasi password baru'),
    },
  ];

  return (
    <div className="profile-page">
      <div className="profile-heading">
        <span className="profile-eyebrow">{t('AKUN SAYA')}</span>
        <h1>{t('Profil saya')}</h1>
        <p>{t('Informasi akun dan peran Anda di Gymnasyum.')}</p>
      </div>

      <div className="profile-tabs">
        <button
          type="button"
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          {t('Profil')}
        </button>

        <button
          type="button"
          className={activeTab === 'security' ? 'active' : ''}
          onClick={() => setActiveTab('security')}
        >
          {t('Keamanan')}
        </button>
      </div>

      {activeTab === 'profile' && (
        <section className="profile-card">
          <div className="profile-card-header">
            <div>
              <h2>{t('Informasi akun & profil')}</h2>
              <p>{t('Kelola foto profil dan lihat informasi akun Anda.')}</p>
            </div>
            
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="profile-identity">
              {photoPreviewUrl || photoUrl ? (
                <img
                  className="profile-photo"
                  src={photoPreviewUrl || photoUrl}
                  alt={t('Foto profil')}
                />
              ) : (
                <div className="profile-photo">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <strong>{profile.name}</strong>
                <span>{profile.email}</span>
                <small>{t('Pilih JPG, PNG, atau WebP dengan ukuran maksimal 2 MB.')}</small>
                <div className="profile-photo-actions">
                  <input
                    id="profile-photo-file"
                    className="profile-photo-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg"
                    onChange={handlePhotoSelection}
                    disabled={processingPhoto || savingPhoto || deletingPhoto}
                  />
                  <label className="profile-photo-button" htmlFor="profile-photo-file">
                    {t('Pilih Foto')}
                  </label>
                  <button
                    type="button"
                    className="profile-photo-button"
                    onClick={handleUploadPhoto}
                    disabled={!selectedPhoto || processingPhoto || savingPhoto || deletingPhoto}
                  >
                    {processingPhoto
                      ? t('Memproses foto...')
                      : savingPhoto
                        ? t('Mengunggah...')
                        : t('Upload Foto')}
                  </button>
                  {photoUrl && (
                    <button
                      type="button"
                      className="profile-photo-button secondary"
                      onClick={handleDeletePhoto}
                      disabled={savingPhoto || deletingPhoto}
                    >
                      {deletingPhoto ? t('Menghapus...') : t('Hapus Foto')}
                    </button>
                  )}
                </div>
                {photoMessage && (
                  <span
                    className={`profile-message ${photoMessage.type}`}
                    role={photoMessage.type === 'error' ? 'alert' : 'status'}
                  >
                    {photoMessage.text}
                  </span>
                )}
              </div>
            </div>

            <h3>{t('Informasi pribadi')}</h3>

            <div className="profile-form-grid">
              <div className="profile-field">
                <label htmlFor="profile-name">{t('Nama lengkap')}</label>
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
                <label htmlFor="profile-role">{t('Peran')}</label>
                <input
                  id="profile-role"
                  value={profile.role}
                  readOnly
                />
              </div>

            </div>

            <div className="profile-card-footer">
              {profileMessage && (
                <span
                  className={`profile-message ${profileMessage.type}`}
                  role={profileMessage.type === 'error' ? 'alert' : 'status'}
                >
                  {profileMessage.text}
                </span>
              )}
              <button type="submit" disabled={savingProfile}>
                {savingProfile ? t('Menyimpan...') : t('Simpan Data Akun')}
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === 'security' && (
        <section className="profile-card security-card">
          <div className="security-form">
            <h2>{t('Ubah Password')}</h2>
            <p>{t('Masukkan password lama dan password baru Anda.')}</p>

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
                      aria-label={t('Tampilkan atau sembunyikan password')}
                    >
                      {showPasswords[field.name] ? t('Sembunyikan') : t('Lihat')}
                    </button>
                  </div>
                </div>
              ))}

              {securityMessage && (
                <p
                  className={`profile-message ${securityMessage.type}`}
                  role={securityMessage.type === 'error' ? 'alert' : 'status'}
                >
                  {securityMessage.text}
                </p>
              )}
              <button
                type="submit"
                className="update-password-button"
                disabled={savingPassword}
              >
                {savingPassword ? t('Menyimpan...') : t('Update Password')}
              </button>
            </form>
          </div>

          <aside className="password-requirements">
            <h3>{t('Persyaratan Password')}</h3>
            <p>{t('Gunakan password yang kuat dengan ketentuan berikut.')}</p>

            <ul>
              <li>{t('Minimal 8 karakter')}</li>
              <li>{t('Minimal satu huruf kecil')}</li>
              <li>{t('Minimal satu huruf besar (kapital)')}</li>
              <li>{t('Berbeda dari password sebelumnya')}</li>
            </ul>
          </aside>
        </section>
      )}
    </div>
  );
}

export default Profile;