import { useEffect, useRef, useState } from 'react';
import '../assets/styles/ProfileDropdown.css';
import useI18n from '../i18n/useI18n.js';

function ProfileDropdown({
  currentUser,
  photoUrl,
  onOpenProfile,
  onLogout,
}) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOpenProfile = () => {
    setIsOpen(false);
    onOpenProfile();
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="profile-avatar-button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={t('Menu profil')}
        aria-expanded={isOpen}
      >
        {photoUrl ? (
          <img className="profile-avatar-image" src={photoUrl} alt="" />
        ) : (
          currentUser?.name?.charAt(0).toUpperCase() || 'U'
        )}
      </button>

      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="profile-dropdown-info">
            <strong>{currentUser?.name}</strong>
            <span>{currentUser?.email}</span>
          </div>

          <button
            type="button"
            className="profile-dropdown-item"
            onClick={handleOpenProfile}
          >
            <span>♙</span>
            {t('Lihat profil')}
          </button>

          <button
            type="button"
            className="profile-dropdown-item logout-item"
            onClick={handleLogout}
          >
            <span>↪</span>
            {t('Keluar')}
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
