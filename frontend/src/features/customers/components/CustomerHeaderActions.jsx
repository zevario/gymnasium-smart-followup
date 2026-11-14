import { Bell } from 'lucide-react';
import { ThemeToggle } from '../../../shared/components/ThemeToggle.jsx';
import LanguageSwitcher from '../../../shared/components/LanguageSwitcher.jsx';
import { useLanguage } from '../../../shared/i18n/useLanguage.js';
import { ProfileMenu } from '../../../app/components/ProfileMenu.jsx';
import { defaultProfilePhoto } from '../../profile/utils/profilePhoto.js';

export function CustomerHeaderActions({ person, demo, onProfile, onRequests, onLogout }) {
  const { language } = useLanguage();
  const updates = person.requests.filter((r) => r.response);
  return (
    <div className="customer-header-actions">
      {demo && (
        <small className="customer-demo-label">
          {language === 'en' ? 'Demo mode' : 'Mode demo'}
        </small>
      )}
      <button
        className="customer-notification"
        aria-label={language === 'en' ? 'View request updates' : 'Lihat pembaruan permintaan'}
        onClick={onRequests}
        title={language === 'en' ? 'Request updates' : 'Pembaruan permintaan'}
      >
        <Bell size={22} />
        {updates.length > 0 && <span className="customer-notification-dot" />}
      </button>
      <div className="customer-preferences">
        <LanguageSwitcher />
        <span aria-hidden="true" />
        <ThemeToggle />
      </div>
      <span className="customer-header-divider" aria-hidden="true" />
      <ProfileMenu
        photo={person.settings?.photo || defaultProfilePhoto}
        account={person}
        onProfile={onProfile}
        onLogout={onLogout}
      />
    </div>
  );
}
