import { permissions } from './access.js';

export function mayOpenPage(user, page) {
  if (!user) return false;
  if (page === 'Profil') return true;
  const access = permissions(user);
  if (page === 'Pengaturan') return access.operational || access.system;
  if (user.live && page === 'Laporan') return access.supervisor;
  return access.operational;
}
