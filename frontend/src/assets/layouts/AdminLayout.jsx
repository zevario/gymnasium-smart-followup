import '../styles/admin/AdminLayout.css';
import gymnasyumLogo from '../gallery/gymnasyum-logo.png';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import { LogOut, UserRound } from 'lucide-react';
import ProfileDropdown from '../../components/ProfileDropdown.jsx';

function AdminLayout({ children, isDarkMode, onToggleTheme, onLogout, onOpenProfile, onBackToSettings, currentUser }) {
  return (
    <div className={`admin-layout ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <img src={gymnasyumLogo} alt="Gymnasyum Logo" />
        </div>

        <div className="sidebar-location">
          <span>📍 Lokasi aktif</span>
          <strong>Gymnasyum Bintaro</strong>
        </div>

        <nav className="sidebar-navigation">
        <button
            type="button"
            className="active"
            onClick={onBackToSettings}
        >
            ⚙ Pengaturan
        </button>
        </nav>

        <div className="sidebar-footer">
        <div className="sidebar-profile">
            <div className="profile-avatar">
            <UserRound size={18} />
            </div>

            <div className="profile-info">
             <strong>{currentUser?.name || 'Administrator'}</strong>
              <span>{currentUser?.role || 'Administrator Sistem'}</span>
            </div>
        </div>

        <button
            type="button"
            className="sidebar-logout"
            onClick={onLogout}
        >
            <LogOut size={17} />
            <span>Keluar dari akun</span>
        </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="breadcrumb">
            <span>Smart Follow-up</span>
            <span>›</span>
            <strong>Pengaturan</strong>
          </div>

          <div className="topbar-actions">
            <button type="button" aria-label="Notifikasi">
              ♧
            </button>

            <ThemeToggle
                isDarkMode={isDarkMode}
                onToggleTheme={onToggleTheme}
            />

            <div className="admin-avatar">
                <ProfileDropdown
                    currentUser={currentUser}
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