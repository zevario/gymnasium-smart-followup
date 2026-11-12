import { DemoPageContent } from './DemoPageContent.jsx';
import { useT } from '../../shared/i18n/useLanguage.js';

import { todayQueue } from '../../features/followups/services/followupRules.js';

import { AccountContext } from '../../features/auth/context/AccountContext.js';
import { Sidebar } from './Sidebar.jsx';
import { Header } from './AppHeader.jsx';

import { DetailDrawer } from '../../features/followups/components/DetailDrawer.jsx';
import { Icon } from '../../shared/components/Icon.jsx';

export function DemoWorkspace({ account, setLoginSession, workspace }) {
  const t = useT();
  const {
    activePage,
    setPage,
    customers,
    selected,
    setSelected,
    mobileNav,
    drawerOpen,
    setMobileNav,
    toast,
    profilePhoto,
    saveProfilePhoto,
    currentUser,
    access,
    navigate,
    updateCustomer,
    notify,
    openCustomer,
  } = workspace;
  return (
    <AccountContext.Provider value={account}>
      <div className={`app-shell ${mobileNav ? 'sidebar-visible' : 'sidebar-hidden'}`}>
        <Sidebar
          page={activePage}
          navigate={navigate}
          open={mobileNav}
          drawerOpen={drawerOpen}
          onToggle={() => setMobileNav((open) => !open)}
          count={todayQueue(customers).length}
          memberCount={customers.length}
          user={currentUser}
          onLogout={() => {
            setLoginSession(null);
            setSelected(null);
            setPage('Dashboard');
          }}
        />
        {mobileNav && (
          <button
            className="nav-backdrop"
            aria-label={t('Tutup navigasi')}
            onClick={() => setMobileNav(false)}
          />
        )}
        <main className="main" inert={drawerOpen}>
          <Header
            navOpen={mobileNav}
            onToggleNav={() => setMobileNav((open) => !open)}
            page={activePage}
            photo={profilePhoto}
            customers={customers}
            onOpenNotification={openCustomer}
            account={account}
            onProfile={() => navigate('Profil')}
            onLogout={() => {
              setLoginSession(null);
              navigate('Dashboard');
              notify('Anda sudah keluar dari akun demo');
            }}
          />
          <div className={`content ${activePage === 'Profil' ? 'content-account' : ''}`}>
            <DemoPageContent
              activePage={activePage}
              customers={customers}
              openCustomer={openCustomer}
              navigate={navigate}
              access={access}
              notify={notify}
              currentUser={currentUser}
              profilePhoto={profilePhoto}
              saveProfilePhoto={saveProfilePhoto}
            />
          </div>
        </main>
        {selected && access.operational && (
          <DetailDrawer
            customer={selected}
            onClose={() => setSelected(null)}
            update={updateCustomer}
            notify={notify}
          />
        )}
        {toast && (
          <div className="toast">
            <span className="toast-icon">
              <Icon name="check" size={15} />
            </span>
            {t(toast)}
          </div>
        )}
      </div>
    </AccountContext.Provider>
  );
}
