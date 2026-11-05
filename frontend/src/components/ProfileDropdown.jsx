import { useEffect, useRef, useState } from 'react';
import '../assets/styles/ProfileDropdown.css';

function ProfileDropdown({ onOpenProfile, onLogout }) {
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
        aria-label="Menu profil"
        aria-expanded={isOpen}
      >
        A
      </button>

      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="profile-dropdown-info">
            <strong>Administrator</strong>
            <span>admin@gymnasyum.id</span>
          </div>

          <button
            type="button"
            className="profile-dropdown-item"
            onClick={handleOpenProfile}
          >
            <span>♙</span>
            Lihat profil
          </button>

          <button
            type="button"
            className="profile-dropdown-item logout-item"
            onClick={handleLogout}
          >
            <span>↪</span>
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;