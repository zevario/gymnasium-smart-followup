import { useState } from 'react';
import Login from './pages/login/Login.jsx';

import AdminLayout from './assets/layouts/AdminLayout.jsx';
import Settings from './pages/admin/AdminSettings.jsx';
import Profile from './pages/Profile.jsx';

import SPVLayout from './assets/layouts/SPVLayout.jsx';
import SPVDashboard from './pages/spv/SPVDashboard.jsx';
import SPVFollowUps from './pages/spv/SPVFollowUps.jsx';
import SPVCustomer from './pages/spv/SPVCustomer.jsx';
import SPVAttendance from './pages/spv/SPVAttendance.jsx';

import StaffLayout from './assets/layouts/StaffLayout.jsx';
import StaffAttendance from './pages/staff/StaffAttendance.jsx';
import StaffCustomer from './pages/staff/StaffCustomer.jsx';
import StaffDashboard from './pages/staff/StaffDashboard';


function App() {
  const [session, setSession] = useState(() => {
    const savedSession = localStorage.getItem('gymnasyum_session');

    return savedSession ? JSON.parse(savedSession) : null;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
  const savedTheme = localStorage.getItem('gymnasyum_theme');

    return savedTheme ? savedTheme === 'dark' : true;
  });

  const [activePage, setActivePage] = useState('dashboard');

  const activeRole = session?.role;

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const nextTheme = !prev;

      localStorage.setItem(
        'gymnasyum_theme',
        nextTheme ? 'dark' : 'light'
      );

      return nextTheme;
    });
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
        currentUser={session}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
        activePage={activePage}
        onNavigate={setActivePage}
        onOpenProfile={() => setActivePage('profile')}
      >
        {activePage === 'dashboard' && <SPVDashboard />}

        {activePage === 'pelanggan' && <SPVCustomer />}

        {activePage === 'followups' && <SPVFollowUps />}

        {activePage === 'absensi' && <SPVAttendance />}

        {activePage === 'aktivitas' && <h1>Aktivitas Tim</h1>}

        {activePage === 'laporan' && <h1>Laporan</h1>}

        {activePage === 'profile' && (
          <Profile currentUser={session} />
        )}
      </SPVLayout>
    );
  }

  if (activeRole === 'staff') {
    return (
      <StaffLayout
        currentUser={session}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
        activePage={activePage}
        onNavigate={setActivePage}
        onOpenProfile={() => setActivePage('profile')}
      >
        {activePage === 'dashboard' && (
           <StaffDashboard />
        )}

        {activePage === 'absensi' && (
          <StaffAttendance currentUser={session} />
        )}

        {activePage === 'pelanggan' && <StaffCustomer />}

        {activePage === 'profile' && (
          <Profile currentUser={session} />
        )}
      </StaffLayout>
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
      {activePage === 'profile' ? (
        <Profile currentUser={session} />
      ) : (
        <Settings />
      )}
    </AdminLayout>
  );
}

export default App;
