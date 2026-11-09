import { Today } from '../../features/dashboard/pages/Dashboard.jsx';
import { AllFollowups } from '../../features/followups/pages/FollowUps.jsx';
import { Customers } from '../../features/customers/pages/Customers.jsx';
import { Reports } from '../../features/reports/pages/Reports.jsx';
import { SystemSettings } from '../../features/accounts/pages/SystemSettings.jsx';
import { Settings } from '../../features/settings/pages/Settings.jsx';
import { Profile } from '../../features/profile/pages/Profile.jsx';

export function DemoPageContent({
  activePage,
  customers,
  openCustomer,
  navigate,
  access,
  notify,
  currentUser,
  profilePhoto,
  saveProfilePhoto,
}) {
  return (
    <>
      {activePage === 'Dashboard' && (
        <Today
          customers={customers}
          onOpen={openCustomer}
          onAll={() => navigate('Semua follow-up')}
        />
      )}
      {activePage === 'Semua follow-up' && (
        <AllFollowups customers={customers} onOpen={openCustomer} />
      )}
      {activePage === 'Pelanggan' && <Customers customers={customers} onOpen={openCustomer} />}
      {activePage === 'Laporan' && <Reports />}
      {activePage === 'Pengaturan' &&
        (access.system ? <SystemSettings /> : <Settings notify={notify} />)}
      {activePage === 'Profil' && (
        <Profile
          key={currentUser.email}
          user={currentUser}
          photo={profilePhoto}
          onSavePhoto={saveProfilePhoto}
        />
      )}
    </>
  );
}
