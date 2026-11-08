import '../styles/staff/StaffLayout.css';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import { Bell } from 'lucide-react';
import ProfileDropdown from '../../components/ProfileDropdown.jsx';
import gymnasyumLogo from '../gallery/gymnasyum-logo.png';
import LanguageSwitcher from '../../components/LanguageSwitcher.jsx';
import useI18n from '../../i18n/useI18n.js';

function StaffLayout({
  children,
  currentUser,
  profilePhotoUrl,
  isDarkMode,
  onToggleTheme,
  onLogout,
  activePage,
  onNavigate,
  onOpenProfile,
}) {
  const { t } = useI18n();

  const navItems = [
    { id: 'dashboard', label: t('Dashboard') },
    { id: 'absensi', label: t('Absensi Member') },
    { id: 'pelanggan', label: t('Data Pelanggan') },
    { id: 'followups', label: t('Tugas Follow-up') },
    { id: 'schedule', label: t('Schedule / Class') },
  ];

  return (
    <div className={`staff-layout ${isDarkMode ? 'dark' : 'light'}`}>
      <aside className="staff-sidebar">
        <div className="sidebar-brand">
          <img src={gymnasyumLogo} alt="Gymnasyum Logo" />
        </div>

        <nav className="staff-navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`staff-nav-item ${
                activePage === item.id ? 'active' : ''
              }`}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="staff-sidebar-footer">
          <button
            type="button"
            className="staff-logout"
            onClick={onLogout}
          >
            {t('Keluar dari akun')}
          </button>
        </div>


      </aside>

      <main className="staff-main">
        <header className="staff-topbar">
          <div className="staff-topbar-title">
            <h3>
              {activePage === 'absensi'
                ? t('Absensi Member')
                : activePage === 'pelanggan'
                  ? t('Data Pelanggan')
                    : activePage === 'followups'
                      ? t('Tugas Follow-up')
                    : t('Staff Dashboard')}
            </h3>
            <span>{t('Gymnasyum Bintaro')}</span>
          </div>

          <div className="staff-topbar-actions">
            <button
              type="button"
              className="staff-notification-button"
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

            <div className="staff-profile-avatar">
              <ProfileDropdown
                currentUser={currentUser}
                photoUrl={profilePhotoUrl}
                onOpenProfile={onOpenProfile}
                onLogout={onLogout}
              />
            </div>
          </div>
        </header>

        <section className="staff-content">
          {children}
        </section>
      </main>
    </div>
  );
}

export default StaffLayout;