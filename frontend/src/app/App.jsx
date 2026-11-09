import { useDemoWorkspace } from './hooks/useDemoWorkspace.js';
import { DemoWorkspace } from './layouts/DemoWorkspace.jsx';
import { useT } from '../shared/i18n/useLanguage.js';

import {
  demoAccounts,
  accountRoles,
  demoPassword,
  authenticateDemo,
} from '../features/auth/services/demoAccounts.js';

import { permissions } from '../features/auth/services/access.js';

import LoginPage from '../features/auth/pages/Login.jsx';

import { hasSession, login, logout } from '../shared/api/pilotApi.js';
import { PilotWorkspace } from './layouts/PilotWorkspace.jsx';

import { usePilotSession } from '../features/auth/hooks/usePilotSession.js';
import { useDemoAccount } from '../features/auth/hooks/useDemoAccount.js';

export default function App() {
  const t = useT();
  const { identity, setIdentity, restoring } = usePilotSession();
  const { account, setLoginSession } = useDemoAccount();
  const workspace = useDemoWorkspace(account);
  const { setPage } = workspace;
  const logoutPilot = () => {
    logout().catch(() => {});
    setIdentity(null);
    setLoginSession(null);
  };
  const authenticate = async (email, password, setError, demo) => {
    if (demo) {
      if (hasSession()) await logout().catch(() => {});
      authenticateDemo(
        email,
        password,
        (user) => {
          setLoginSession(user);
          setPage(permissions(user).system ? 'Pengaturan' : 'Dashboard');
        },
        setError,
      );
      return;
    }
    try {
      const user = await login(email, password);
      setLoginSession(null);
      setIdentity(user);
    } catch (error) {
      setError(error.status === 401 ? 'Email atau kata sandi tidak sesuai.' : error.message);
    }
  };

  if (restoring) return <p role="status">{t('Memuat sesi…')}</p>;
  if (identity) return <PilotWorkspace identity={identity} onLogout={logoutPilot} />;
  if (!account) {
    return (
      <LoginPage
        accounts={accountRoles.flatMap(
          (role) => demoAccounts.find((user) => user.role === role) ?? [],
        )}
        demoPassword={demoPassword}
        authenticate={authenticate}
      />
    );
  }
  return (
    <DemoWorkspace account={account} setLoginSession={setLoginSession} workspace={workspace} />
  );
}
