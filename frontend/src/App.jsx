import { useState } from 'react';
import Login from './pages/Login.jsx';
import AdminLayout from './assets/layouts/AdminLayout.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activePage, setActivePage] = useState('settings');

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };
  
  const handleLogin = () => {
    setIsLoggedIn(true);
    setActivePage('settings');
  };


  const handleLogout = () => {
    setIsLoggedIn(false);
    setActivePage('settings');
  };

  if (!isLoggedIn) {
    return (
      <Login 
        onLogin= {handleLogin}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme} 
      />
    );
  }

  return (
    <AdminLayout
      isDarkMode={isDarkMode}
      onToggleTheme={handleToggleTheme}
      onLogout={handleLogout}
      onOpenProfile={() => setActivePage('profile')}
      onBackToSettings={() => setActivePage('settings')}
    >
      {activePage === 'profile' ? <Profile /> : <Settings />}
    </AdminLayout>
  );
}

export default App;