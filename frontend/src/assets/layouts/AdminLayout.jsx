import '../styles/admin/AdminLayout.css';
import gymnasyumLogo from '../gallery/gymnasyum-logo.png';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import ProfileDropdown from '../../components/ProfileDropdown.jsx';
import LanguageSwitcher from '../../components/LanguageSwitcher.jsx';
import useI18n from '../../i18n/useI18n.js';
import { Bell } from 'lucide-react';

function AdminLayout({
  children,
  isDarkMode,
  onToggleTheme,
  onLogout,
  onOpenProfile,
  onBackToSettings,
  currentUser,
  profilePhotoUrl,
  activePage,
  onNavigate
}) {
  const { t } = useI18n();

  return (
    <div className={`admin-layout ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <img src={gymnasyumLogo} alt="Gymnasyum Logo" />
        </div>

        <div className="sidebar-location">
          <span>📍 {t('Lokasi aktif')}</span>
          <strong>{t('Gymnasyum Bintaro')}</strong>
        </div>

        <nav className="sidebar-navigation">
          <button
              type="button"
               className={activePage === 'settings' ? 'active' : ''}
               onClick={onBackToSettings}
          >
               ⚙ {t('Pengaturan')}
          </button>

            <button
              type="button"
              className={activePage === 'schedule' ? 'active' : ''}
              onClick={() => onNavigate('schedule')}
            >
              📅 {t('Schedule / Class')}
            </button>
            <button
              type="button"
              className={activePage === 'followups' ? 'active' : ''}
              onClick={() => onNavigate('followups')}
            >
              {t('Follow-up')}
            </button>
            <button
              type="button"
              className={activePage === 'laporan' ? 'active' : ''}
              onClick={() => onNavigate('laporan')}
            >
              {t('Laporan')}
            </button>
        </nav>

        <div className="sidebar-footer">
        <button
            type="button"
            className="sidebar-logout"
            onClick={onLogout}
        >
            <span>{t('Keluar dari akun')}</span>
        </button>

        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="breadcrumb">
            <span>{t('Smart Follow-up')}</span>
            <span>›</span>
            <strong>
              {activePage === 'followups'
                ? t('Follow-up')
                : activePage === 'laporan'
                  ? t('Laporan')
                  : activePage === 'schedule'
                    ? t('Schedule / Class')
                    : t('Pengaturan')}
            </strong>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="admin-notification-button"
              aria-label={t('Notifikasi')}
              title={t('Notifikasi')}
            >
              <Bell size={18} />
            </button>

            <ThemeToggle
                isDarkMode={isDarkMode}
                onToggleTheme={onToggleTheme}
            />
            <LanguageSwitcher />

            <div className="admin-avatar">
                <ProfileDropdown
                    currentUser={currentUser}
                    photoUrl={profilePhotoUrl}
                    onOpenProfile={onOpenProfile}
                    onLogout={onLogout}
                />
            </div>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;