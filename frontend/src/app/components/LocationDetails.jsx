import { LocationPin } from '../../shared/components/LocationPin.jsx';
import { useT } from '../../shared/i18n/useLanguage.js';

import { Icon } from '../../shared/components/Icon.jsx';

import { demoAccounts, accountRoles } from '../../features/auth/services/demoAccounts.js';

export function LocationDetails({ user, system, memberCount, followupCount }) {
  const t = useT();
  return (
    <div className="location-dialog-body">
      <div className="location-hero">
        <span className="location-hero-icon">
          <LocationPin />
        </span>
        <div>
          <h3>{t('Gymnasyum Bintaro')}</h3>
          <p>{t('Smart Follow-up · Member Relations')}</p>
        </div>
        <span className="location-selected">
          <Icon name="check" size={12} />
          {t('Aktif')}
        </span>
      </div>
      <p id="location-dialog-description" className="location-description">
        {user.live
          ? 'Gymnasyum Bintaro · Asia/Jakarta'
          : t(
              'Anda sedang bekerja di lokasi Bintaro. Seluruh aktivitas pada ruang kerja ini menggunakan data demo lokasi tersebut.',
            )}
      </p>
      {!user.live && (
        <div className="location-summary">
          <div>
            <span className="location-stat-icon">
              <Icon name="users" size={18} />
            </span>
            <span>
              <strong>{t(system ? demoAccounts.length : memberCount)}</strong>
              <small>{t(system ? 'Akun terdaftar' : 'Member dalam demo')}</small>
            </span>
          </div>
          <div>
            <span className="location-stat-icon">
              <Icon name={system ? 'settings' : 'list'} size={18} />
            </span>
            <span>
              <strong>{t(system ? accountRoles.length : followupCount)}</strong>
              <small>{t(system ? 'Peran pengguna' : 'Follow-up hari ini')}</small>
            </span>
          </div>
        </div>
      )}
      <div className="location-access">
        <span className="avatar">{t(user.initials)}</span>
        <div>
          <strong>{t(user.name)}</strong>
          <span>{t(user.role)}</span>
        </div>
        <Icon name="check" size={16} />
      </div>
      {!user.live && (
        <p className="location-demo-note">
          <LocationPin />
          {t('Saat ini tersedia satu lokasi demo. Lokasi lain belum ditambahkan.')}
        </p>
      )}
    </div>
  );
}
