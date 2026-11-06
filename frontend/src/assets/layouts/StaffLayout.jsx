import '../styles/staff/StaffLayout.css';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import { Bell } from 'lucide-react';
import ProfileDropdown from '../../components/ProfileDropdown.jsx';
import gymnasyumLogo from '../gallery/gymnasyum-logo.png';

function StaffLayout({
  children,
  currentUser,
  isDarkMode,
  onToggleTheme,
  onLogout,
  activePage,
  onNavigate,
  onOpenProfile,
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'absensi', label: 'Absensi Member' },
    { id: 'pelanggan', label: 'Data Pelanggan' },
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

        <button
          type="button"
          className="staff-logout"
          onClick={onLogout}
        >
          Keluar
        </button>
      </aside>

      <main className="staff-main">
        <header className="staff-topbar">
          <div className="staff-topbar-title">
            <h3>
              {activePage === 'absensi'
                ? 'Absensi Member'
                : activePage === 'pelanggan'
                  ? 'Data Pelanggan'
                  : 'Staff Dashboard'}
            </h3>
            <span>Gymnasyum Bintaro</span>
          </div>

          <div className="staff-topbar-actions">
            <button
              type="button"
              className="staff-notification-button"
              aria-label="Notifikasi"
              title="Notifikasi"
            >
              <Bell size={18} />
            </button>

            <ThemeToggle
              isDarkMode={isDarkMode}
              onToggleTheme={onToggleTheme}
            />

            <div className="staff-profile-avatar">
              <ProfileDropdown
                currentUser={currentUser}
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