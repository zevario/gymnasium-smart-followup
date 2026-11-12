import { useEffect, useState } from 'react';
import { initialCustomers } from '../../features/customers/data/demoCustomers.js';
import { demoAccounts } from '../../features/auth/services/demoAccounts.js';
import { permissions, mayEditTask } from '../../features/auth/services/access.js';
import { mayOpenPage } from '../../features/auth/services/pageAccess.js';
import { canContact } from '../../features/followups/services/followupRules.js';
import { isProfilePhoto, defaultProfilePhoto } from '../../features/profile/utils/profilePhoto.js';
import { profilePhotoStorageKey } from '../../shared/storage/keys.js';
import {
  DESKTOP_MEDIA_QUERY,
  isDesktopViewport,
  isMobileViewport,
} from '../../shared/utils/viewport.js';

export function useDemoWorkspace(account) {
  const [page, setPage] = useState('Dashboard');
  const [customers, setCustomers] = useState(initialCustomers);
  const [selected, setSelected] = useState(null);
  const [mobileNav, setMobileNav] = useState(isDesktopViewport);
  const [toast, setToast] = useState('');
  const [profilePhotos, setProfilePhotos] = useState(() => {
    const photos = {};
    for (const user of demoAccounts) {
      try {
        const saved = localStorage.getItem(profilePhotoStorageKey(user.email));
        if (saved && isProfilePhoto(saved)) photos[user.email] = saved;
      } catch {
        /* The default avatar remains available without browser storage. */
      }
    }
    return photos;
  });
  const profilePhoto = account
    ? (profilePhotos[account.email] ?? defaultProfilePhoto)
    : defaultProfilePhoto;
  const saveProfilePhoto = (photo) => {
    if (!account || !isProfilePhoto(photo)) return;
    localStorage.setItem(profilePhotoStorageKey(account.email), photo);
    setProfilePhotos((previous) => ({ ...previous, [account.email]: photo }));
    notify('Foto profil berhasil diperbarui');
  };
  const currentUser = account ?? demoAccounts[0];
  const access = permissions(account);
  const activePage = mayOpenPage(account, page) ? page : access.system ? 'Pengaturan' : 'Dashboard';
  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const syncSidebar = () => setMobileNav(desktop.matches);
    desktop.addEventListener('change', syncSidebar);
    return () => desktop.removeEventListener('change', syncSidebar);
  }, []);
  useEffect(() => {
    const escape = (e) => {
      if (e.key === 'Escape') {
        setSelected(null);
        setMobileNav(false);
      }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);
  useEffect(() => {
    document.querySelector('.main')?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [page]);
  const navigate = (p) => {
    if (!mayOpenPage(account, p)) return;
    setPage(p);
    if (isMobileViewport()) setMobileNav(false);
    setSelected(null);
  };
  const updateCustomer = (id, patch) => {
    const apply = (c) => {
      const claiming =
        access.operational &&
        c.owner === 'Belum ditugaskan' &&
        patch.owner === account?.name.split(' ')[0] &&
        Object.keys(patch).every((key) => key === 'owner');
      if (!claiming && !mayEditTask(account, c.owner)) return c;
      if (patch.owner && !claiming && !access.supervisor) return c;
      if (patch.lastContact && !canContact(c)) return c;
      return { ...c, ...patch };
    };
    setCustomers((c) => c.map((x) => (x.id === id ? apply(x) : x)));
    setSelected((s) => (s?.id === id ? apply(s) : s));
  };
  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  };
  const openCustomer = (customer) => {
    if (access.operational) setSelected(customer);
  };
  return {
    activePage,
    setPage,
    customers,
    selected,
    setSelected,
    mobileNav,
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
  };
}
