import { useT } from '../../../shared/i18n/useLanguage.js';

export function ProfileIdentity({ photo, user, setEditingPhoto }) {
  const t = useT();
  return (
    <div className="account-profile-identity">
      <div className="profile-photo-container">
        <img
          className="profile-photo"
          src={photo}
          alt={t(`Foto profil ${user.name}`)}
          width={104}
          height={104}
        />
        <button
          className="profile-photo-camera"
          type="button"
          aria-label={t('Edit foto profil')}
          title={t('Edit foto profil')}
          onClick={() => setEditingPhoto(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 3 6 6H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2l-2-3H8Zm4 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
          </svg>
        </button>
      </div>
      <div className="profile-photo-info">
        <h3>{t(user.name)}</h3>
        <p>{t(user.email)}</p>
        <button className="profile-photo-link" type="button" onClick={() => setEditingPhoto(true)}>
          {t('Pilih Avatar / Upload Foto')}
        </button>
        <small className="profile-photo-hint">{t('Mendukung JPG, PNG, dan WEBP')}</small>
      </div>
    </div>
  );
}
