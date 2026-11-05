import { useState } from 'react';
import Login from './pages/login/Login.jsx';
import AdminLayout from './assets/layouts/AdminLayout.jsx';
import Settings from './pages/admin/AdminSettings.jsx';
import Profile from './pages/Profile.jsx';
import SPVLayout from './assets/layouts/SPVLayout.jsx';
import SPVDashboard from './pages/spv/SPVDashboard.jsx';
import SPVFollowUps from './pages/spv/SPVFollowUps.jsx';
import SPVCustomer from './pages/spv/SPVCustomer.jsx';

function App() {
  const [session, setSession] = useState(() => {
    const savedSession = localStorage.getItem('gymnasyum_session');

    return savedSession ? JSON.parse(savedSession) : null;
  });

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const activeRole = session?.role;

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleLogin = ({ email, password }) => {
    const savedAccounts = localStorage.getItem('gymnasyum_accounts');
    const accounts = savedAccounts ? JSON.parse(savedAccounts) : [];

    const account = accounts.find(
      (item) =>
        item.email.toLowerCase() === email.trim().toLowerCase() &&
        item.password === password &&
        item.active
    );

    if (!account) {
      alert('Email atau password salah, atau akun tidak aktif.');
      return;
    }

    const roleMap = {
      'Administrator Sistem': 'admin',
      'Supervisor / Manajer Operasional': 'spv',
      'Admin/CS & Sales': 'staff',
    };

    const role = roleMap[account.role];

    if (!role) {
      alert('Role akun tidak dikenali.');
      return;
    }

    const loggedInUser = {
      id: account.id,
      name: account.name,
      email: account.email,
      role,
      accountRole: account.role,
    };

    localStorage.setItem(
      'gymnasyum_session',
      JSON.stringify(loggedInUser)
    );

    setSession(loggedInUser);
    setActivePage(role === 'admin' ? 'settings' : 'dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('gymnasyum_session');
    setSession(null);
    setActivePage('dashboard');
  };

  if (!session) {
    return (
      <Login
        onLogin={handleLogin}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  if (activeRole === 'spv') {
    return (
      <SPVLayout
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
        activePage={activePage}
        onNavigate={setActivePage}
      >
        {activePage === 'dashboard' && <SPVDashboard />}
        {activePage === 'pelanggan' && <SPVCustomer />}
        {activePage === 'followups' && <SPVFollowUps />}
        {activePage === 'aktivitas' && <h1>Aktivitas Tim</h1>}
        {activePage === 'laporan' && <h1>Laporan</h1>}
      </SPVLayout>
    );
  }

  if (activeRole === 'staff') {
    return (
      <div>
        <h1>Staff Dashboard</h1>
        <p>Selamat datang, {session.name}</p>
        <button onClick={handleLogout}>Keluar</button>
      </div>
    );
  }

  return (
    <AdminLayout
      currentUser={session}
      isDarkMode={isDarkMode}
      onToggleTheme={handleToggleTheme}
      onLogout={handleLogout}
      onOpenProfile={() => setActivePage('profile')}
      onBackToSettings={() => setActivePage('settings')}
    >
      {activePage === 'profile'
      ? <Profile currentUser={session} />
      : <Settings />}
    </AdminLayout>
  );
}

export default App;