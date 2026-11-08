import '../../assets/styles/spv/SPVLayout.css';
import ProfileDropdown from '../../components/ProfileDropdown.jsx';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import { Bell } from 'lucide-react';
import gymnasyumLogo from '../gallery/gymnasyum-logo.png';
import LanguageSwitcher from '../../components/LanguageSwitcher.jsx';
import useI18n from '../../i18n/useI18n.js';

function SPVLayout({
  children,
  currentUser,
  profilePhotoUrl,
  onLogout,
  isDarkMode,
  onToggleTheme,
  activePage,
  onNavigate,
  onOpenProfile,
}) {
  const { t } = useI18n();

  return (
    <div className={`spv-layout ${isDarkMode ? 'dark' : 'light'}`}>
      <aside className="spv-sidebar">
        <div className="sidebar-brand">
          <img src={gymnasyumLogo} alt="Gymnasyum Logo" />
        </div>

        <nav className="spv-navigation">
          <button
            type="button"
            className={`spv-nav-item ${
              activePage === 'dashboard' ? 'active' : ''
            }`}
            onClick={() => onNavigate('dashboard')}
          >
            {t('Dashboard')}
          </button>

          <button
            type="button"
            className={`spv-nav-item ${
              activePage === 'followups' ? 'active' : ''
            }`}
            onClick={() => onNavigate('followups')}
          >
            {t('Semua Follow-up')}
          </button>

          <button
            type="button"
            className={`spv-nav-item ${
              activePage === 'pelanggan' ? 'active' : ''
            }`}
            onClick={() => onNavigate('pelanggan')}
          >
            {t('Pelanggan')}
          </button>

          <button
            type="button"
            className={`spv-nav-item ${
              activePage === 'absensi' ? 'active' : ''
            }`}
            onClick={() => onNavigate('absensi')}
          >
            {t('Monitoring Absensi')}
          </button>

          <button
            type="button"
            className={`spv-nav-item ${
              activePage === 'schedule' ? 'active' : ''
            }`}
            onClick={() => onNavigate('schedule')}
          >
            {t('Schedule / Class')}
          </button>

          <button
            type="button"
            className={`spv-nav-item ${
              activePage === 'laporan' ? 'active' : ''
            }`}
            onClick={() => onNavigate('laporan')}
          >
            {t('Laporan')}
          </button>
        </nav>

        <div className="SPV-sidebar-footer">
          <button
            type="button"
            className="spv-logout"
            onClick={onLogout}
          >
            {t('Keluar dari akun')}
          </button>
        </div>
      </aside>

      <main className="spv-main">
        <header className="spv-topbar">
          <div className="spv-topbar-title">
            <h3>{t('Supervisor Dashboard')}</h3>
            <span>{t('Gymnasyum Bintaro')}</span>
          </div>

          <div className="spv-topbar-actions">
            <button
              type="button"
              className="spv-notification-button"
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

            <div className="spv-profile-avatar">
              <ProfileDropdown
                currentUser={currentUser}
                photoUrl={profilePhotoUrl}
                onOpenProfile={onOpenProfile}
                onLogout={onLogout}
              />
            </div>
          </div>
        </header>

        <section className="spv-content">
          {children}
        </section>
      </main>
    </div>
  );
}

export default SPVLayout;