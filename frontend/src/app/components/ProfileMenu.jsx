import { useEffect, useRef, useState } from 'react';
import { useT } from '../../shared/i18n/useLanguage.js';

export function ProfileMenu({ photo, account, onProfile, onLogout }) {
  const t = useT();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const avatarRef = useRef(null);
  useEffect(() => {
    const outside = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) setProfileMenuOpen(false);
    };
    document.addEventListener('pointerdown', outside);

    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  useEffect(() => {
    const close = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        if (profileMenuRef.current?.contains(document.activeElement)) avatarRef.current?.focus();
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  return (
    <div
      className="header-profile"
      ref={profileMenuRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setProfileMenuOpen(false);
      }}
    >
      <button
        ref={avatarRef}
        className="header-profile-avatar"
        onClick={() => setProfileMenuOpen((open) => !open)}
        aria-expanded={profileMenuOpen}
        aria-controls="header-profile-dropdown"
        aria-label={t('Menu profil')}
        title={t('Menu profil')}
      >
        <img src={photo} alt={t(`Foto profil ${account.name}`)} width={40} height={40} />
      </button>
      {profileMenuOpen && (
        <div
          id="header-profile-dropdown"
          className="header-profile-dropdown"
          aria-label={t('Menu akun')}
        >
          <div className="header-profile-identity">
            <strong>{t(account.name)}</strong>
            <span>{t(account.email)}</span>
          </div>
          <button
            onClick={() => {
              setProfileMenuOpen(false);
              onProfile();
            }}
          >
            {t('Lihat profil')}
          </button>
          <button
            className="profile-logout"
            onClick={() => {
              setProfileMenuOpen(false);
              onLogout();
            }}
          >
            {t('Keluar')}
          </button>
        </div>
      )}
    </div>
  );
}
