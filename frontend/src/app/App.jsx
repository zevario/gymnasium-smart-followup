import { ForgotPassword } from '../features/auth/pages/ForgotPassword.jsx';
import { useDemoWorkspace } from './hooks/useDemoWorkspace.js';
import { DemoWorkspace } from './layouts/DemoWorkspace.jsx';
import { useT } from '../shared/i18n/useLanguage.js';

import {
  demoAccounts,
  demoCustomer,
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

import { MemberPortal } from '../features/customers/pages/MemberPortal.jsx';

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
        accounts={[
          ...accountRoles.flatMap((role) => demoAccounts.find((user) => user.role === role) ?? []),
          demoCustomer,
        ]}
        demoPassword={demoPassword}
        authenticate={authenticate}
      />
    );
  }
  if (account === demoCustomer) {
    const member = workspace.customers.find((customer) => customer.id === account.memberId);
    return (
      <MemberPortal
        member={member}
        preferences={workspace.memberDemo}
        onChange={workspace.saveMemberDemo}
        onLogout={() => setLoginSession(null)}
      />
    );
  }
  return (
    <DemoWorkspace account={account} setLoginSession={setLoginSession} workspace={workspace} />
  );
}
