import { useCallback, useEffect, useRef, useState } from 'react';
import Login from './pages/login/Login.jsx';

import Settings from './pages/admin/AdminSettings.jsx';
import Profile from './pages/Profile.jsx';

import AdminLayout from './assets/layouts/AdminLayout.jsx';
import AdminSchedule from './pages/admin/AdminSchedule.jsx';

import SPVLayout from './assets/layouts/SPVLayout.jsx';
import SPVDashboard from './pages/spv/SPVDashboard.jsx';
import SPVFollowUps from './pages/spv/SPVFollowUps.jsx';
import SPVCustomer from './pages/spv/SPVCustomer.jsx';
import SPVAttendance from './pages/spv/SPVAttendance.jsx';
import SPVSchedule from './pages/spv/SPVSchedule.jsx';
import SPVReports from './pages/spv/SPVReports.jsx';

import StaffLayout from './assets/layouts/StaffLayout.jsx';
import StaffAttendance from './pages/staff/StaffAttendance.jsx';
import StaffCustomer from './pages/staff/StaffCustomer.jsx';
import StaffDashboard from './pages/staff/StaffDashboard.jsx';
import StaffSchedule from './pages/staff/StaffSchedule.jsx';
import StaffFollowUps from './pages/staff/StaffFollowUps.jsx';

import {
  loginRequest as apiLogin,
  getCurrentUser as getMe,
  getOwnProfilePhoto,
  logoutRequest as apiLogout,
} from './services/api.js';
import useI18n from './i18n/useI18n.js';

function App() {
  const { t } = useI18n();
  const [session, setSession] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const profilePhotoUrlRef = useRef(null);
  const profilePhotoRequestVersionRef = useRef(0);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('gymnasyum_theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  const [activePage, setActivePage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const handleNavigate = (page) => {
  setActivePage(page);

  if (session?.role) {
    localStorage.setItem(
      `gymnasyum_active_page_${session.role}`,
      page
    );
  }
  };

  const handleProfileUpdated = (updatedUser) => {
    setSession((previous) => ({ ...previous, ...updatedUser }));
  };

  const handleProfilePhotoUpdated = useCallback(async (photoBlob) => {
    const requestVersion = ++profilePhotoRequestVersionRef.current;

    if (photoBlob === undefined) {
      photoBlob = await getOwnProfilePhoto();
      if (requestVersion !== profilePhotoRequestVersionRef.current) {
        return null;
      }
    }

    if (profilePhotoUrlRef.current) {
      URL.revokeObjectURL(profilePhotoUrlRef.current);
    }

    const nextPhotoUrl = photoBlob ? URL.createObjectURL(photoBlob) : null;
    profilePhotoUrlRef.current = nextPhotoUrl;
    setProfilePhotoUrl(nextPhotoUrl);
    return photoBlob;
  }, []);

  useEffect(() => {
    let active = true;

    if (!session?.id) return undefined;
    handleProfilePhotoUpdated()
      .catch((error) => {
        if (active) console.error('Gagal memuat foto profil:', error);
      });

    return () => {
      active = false;
    };
  }, [session?.id, handleProfilePhotoUpdated]);

  useEffect(() => () => {
    profilePhotoRequestVersionRef.current += 1;
    if (profilePhotoUrlRef.current) {
      URL.revokeObjectURL(profilePhotoUrlRef.current);
      profilePhotoUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const result = await getMe();
        const user = result.user;

        setSession(user);

        const savedPage = localStorage.getItem(
        `gymnasyum_active_page_${user.role}`
        );

        setActivePage(
          user.role === 'spv' && savedPage === 'aktivitas'
            ? 'laporan'
            : savedPage || (user.role === 'admin' ? 'settings' : 'dashboard')
        );
      } catch {
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

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

  const handleLogin = async ({ email, password }) => {
  setLoginError('');
  setIsLoading(true);

  try {
    const user = await apiLogin({ email, password });

    handleProfilePhotoUpdated(null);
    setSession(user);

    const savedPage = localStorage.getItem(
      `gymnasyum_active_page_${user.role}`
    );

    setActivePage(
      user.role === 'spv' && savedPage === 'aktivitas'
        ? 'laporan'
        : savedPage || (user.role === 'admin' ? 'settings' : 'dashboard')
    );
  } catch (error) {
    setLoginError(
      t(error.message || 'Login gagal. Periksa email dan password.')
    );
  } finally {
    setIsLoading(false);
  }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      handleProfilePhotoUpdated(null);
      setSession(null);
      setActivePage('dashboard');
    }
  };

  if (isLoading && !session) {
    return (
      <main className="login-page">
        <p>{t('Memeriksa sesi akun...')}</p>
      </main>
    );
  }

  if (!session) {
    return (
      <Login
        onLogin={handleLogin}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        isLoading={isLoading}
        errorMessage={loginError}
      />
    );
  }

  if (activeRole === 'spv') {
    return (
      <SPVLayout
        currentUser={session}
        profilePhotoUrl={profilePhotoUrl}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
        activePage={activePage}
        onNavigate={handleNavigate}
        onOpenProfile={() => handleNavigate('profile')}
      >
        {activePage === 'dashboard' && <SPVDashboard />}
        {activePage === 'pelanggan' && <SPVCustomer />}
        {activePage === 'followups' && <SPVFollowUps />}
        {activePage === 'absensi' && <SPVAttendance />}
        {activePage === 'schedule' && <SPVSchedule />}
        {activePage === 'laporan' && <SPVReports />}

        {activePage === 'profile' && (
          <Profile
            currentUser={session}
            photoUrl={profilePhotoUrl}
            onProfileUpdated={handleProfileUpdated}
            onProfilePhotoUpdated={handleProfilePhotoUpdated}
          />
        )}
      </SPVLayout>
    );
  }

  if (activeRole === 'staff') {
    return (
      <StaffLayout
        currentUser={session}
        profilePhotoUrl={profilePhotoUrl}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
        activePage={activePage}
        onNavigate={handleNavigate}
        onOpenProfile={() => handleNavigate('profile')}
      >
        {activePage === 'dashboard' && <StaffDashboard />}
        {activePage === 'absensi' && (
          <StaffAttendance currentUser={session} />
        )}
        {activePage === 'pelanggan' && <StaffCustomer />}
        {activePage === 'followups' && <StaffFollowUps />}
        {activePage === 'profile' && (
          <Profile
            currentUser={session}
            photoUrl={profilePhotoUrl}
            onProfileUpdated={handleProfileUpdated}
            onProfilePhotoUpdated={handleProfilePhotoUpdated}
          />
        )}
        {activePage === 'schedule' && <StaffSchedule />}
      </StaffLayout>
    );
  }

  return (
    <AdminLayout
      currentUser={session}
      profilePhotoUrl={profilePhotoUrl}
      isDarkMode={isDarkMode}
      onToggleTheme={handleToggleTheme}
      onLogout={handleLogout}
      onOpenProfile={() => handleNavigate('profile')}
      onBackToSettings={() => handleNavigate('settings')}
      activePage={activePage}
      onNavigate={handleNavigate}
    >
      {activePage === 'profile' ? (
        <Profile
          currentUser={session}
          photoUrl={profilePhotoUrl}
          onProfileUpdated={handleProfileUpdated}
          onProfilePhotoUpdated={handleProfilePhotoUpdated}
        />
      ) : activePage === 'schedule' ? (
        <AdminSchedule />
      ) : activePage === 'followups' ? (
        <SPVFollowUps />
      ) : activePage === 'laporan' ? (
        <SPVReports />
      ) : (
        <Settings />
      )}
    </AdminLayout>
  );
}

export default App;
