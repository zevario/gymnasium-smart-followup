import { ForgotPassword } from '../features/auth/pages/ForgotPassword.jsx';
import { useT } from '../shared/i18n/useLanguage.js';

import LoginPage from '../features/auth/pages/Login.jsx';

import { login, logout } from '../shared/api/pilotApi.js';
import { PilotWorkspace } from './layouts/PilotWorkspace.jsx';

import { usePilotSession } from '../features/auth/hooks/usePilotSession.js';

import { CustomerPortal } from '../features/customers/pages/CustomerPortal.jsx';

export default function App() {
  if (['/forgot-password', '/reset-password', '/activate-email'].includes(location.pathname))
    return <ForgotPassword />;
  const customerPortal =
    ['/customer', '/customer/'].includes(location.pathname) ||
    new URLSearchParams(location.search).has('customer');
  return customerPortal ? <CustomerPortal /> : <StaffApp />;
}

function StaffApp() {
  const t = useT();
  const { identity, setIdentity, restoring } = usePilotSession();
  const logoutPilot = () => {
    logout().catch(() => {});
    setIdentity(null);
  };
  const authenticate = async (email, password, setError) => {
    try {
      setIdentity(await login(email, password));
    } catch (error) {
      setError(error.status === 401 ? 'Email atau kata sandi tidak sesuai.' : error.message);
    }
  };

  if (restoring) return <p role="status">{t('Memuat sesi…')}</p>;
  if (identity) return <PilotWorkspace identity={identity} onLogout={logoutPilot} />;
  // Tidak ada akun demo: halaman login hanya menerima akun dari PostgreSQL.
  return <LoginPage authenticate={authenticate} />;
}
