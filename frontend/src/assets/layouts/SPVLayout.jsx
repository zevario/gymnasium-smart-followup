
import '../styles/spv/SPVLayout.css';

function SPVLayout({
  children,
  onLogout,
  isDarkMode,
  onToggleTheme,
  activePage,
  onNavigate,
}) {
  return (
    <div className={`spv-layout ${isDarkMode ? 'dark' : 'light'}`}>
      <aside className="spv-sidebar">
        <div className="spv-sidebar-brand">
          <h2>GYMNASYUM</h2>
          <span>Supervisor Panel</span>
        </div>

        <nav className="spv-navigation">
          <button
            className={`spv-nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            Dashboard
          </button>

          <button
            className={`spv-nav-item ${activePage === 'followups' ? 'active' : ''}`}
            onClick={() => onNavigate('followups')}
          >
            Semua Follow-up
          </button>

          <button
            className={`spv-nav-item ${activePage === 'pelanggan' ? 'active' : ''}`}
            onClick={() => onNavigate('pelanggan')}
          >
            Pelanggan
          </button>

          <button
            className={`spv-nav-item ${activePage === 'aktivitas' ? 'active' : ''}`}
            onClick={() => onNavigate('aktivitas')}
          >
            Aktivitas Tim
          </button>

          <button
            className={`spv-nav-item ${activePage === 'laporan' ? 'active' : ''}`}
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
          <div>
            <h3>Supervisor Dashboard</h3>
            <span>Gymnasyum Bintaro</span>
          </div>

          <div className="spv-user">
            <span>Supervisor</span>
            <div className="spv-avatar">S</div>
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
