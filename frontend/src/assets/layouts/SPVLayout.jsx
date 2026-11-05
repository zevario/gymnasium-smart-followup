import '../../assets/styles/spv/SPVLayout.css';
import ProfileDropdown from '../../components/ProfileDropdown.jsx';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import { Bell } from 'lucide-react';

function SPVLayout({
  children,
  currentUser,
  onLogout,
  isDarkMode,
  onToggleTheme,
  activePage,
  onNavigate,
  onOpenProfile,
}) {
  return (
    <div className={`spv-layout ${isDarkMode ? 'dark' : 'light'}`}>
      <aside className="spv-sidebar">
        <div className="spv-sidebar-brand">
          <h2>GYMNASYUM</h2>
          <span>Supervisor</span>
        </div>

        <nav className="spv-navigation">
          <button
            type="button"
            className={`spv-nav-item ${
              activePage === 'dashboard' ? 'active' : ''
            }`}
            onClick={() => onNavigate('dashboard')}
          >
            Dashboard
          </button>

          <button
            type="button"
            className={`spv-nav-item ${
              activePage === 'followups' ? 'active' : ''
            }`}
            onClick={() => onNavigate('followups')}
          >
            Semua Follow-up
          </button>

          <button
            type="button"
            className={`spv-nav-item ${
              activePage === 'pelanggan' ? 'active' : ''
            }`}
            onClick={() => onNavigate('pelanggan')}
          >
            Pelanggan
          </button>

          <button
            type="button"
            className={`spv-nav-item ${
              activePage === 'absensi' ? 'active' : ''
            }`}
            onClick={() => onNavigate('absensi')}
          >
            Monitoring Absensi
          </button>

          <button
            type="button"
            className={`spv-nav-item ${
              activePage === 'aktivitas' ? 'active' : ''
            }`}
            onClick={() => onNavigate('aktivitas')}
          >
            Aktivitas Tim
          </button>

          <button
            type="button"
            className={`spv-nav-item ${
              activePage === 'laporan' ? 'active' : ''
            }`}
            onClick={() => onNavigate('laporan')}
          >
            Laporan
          </button>
        </nav>

        <button
          type="button"
          className="spv-logout"
          onClick={onLogout}
        >
          Keluar
        </button>
      </aside>

      <main className="spv-main">
        <header className="spv-topbar">
          <div className="spv-topbar-title">
            <h3>Supervisor Dashboard</h3>
            <span>Gymnasyum Bintaro</span>
          </div>

          <div className="spv-topbar-actions">
            <button
              type="button"
              className="spv-notification-button"
              aria-label="Notifikasi"
              title="Notifikasi"
            >
              <Bell size={18} />
            </button>

            <ThemeToggle
              isDarkMode={isDarkMode}
              onToggleTheme={onToggleTheme}
            />

            <div className="spv-profile-avatar">
              <ProfileDropdown
                currentUser={currentUser}
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