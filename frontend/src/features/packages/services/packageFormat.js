/** Label kategori paket dalam bahasa yang dipakai antarmuka. */
export const categoryLabels = {
  group_class: 'Group Class',
  personal_training: 'Personal Training',
  trial: 'Trial',
  open_gym: 'Open Gym',
};

/** Label status paket milik pelanggan. */
export const statusLabels = {
  active: 'Aktif',
  used_up: 'Sesi habis',
  expired: 'Kedaluwarsa',
  cancelled: 'Dibatalkan',
};

export function formatPrice(value) {
  return 'Rp' + Number(value).toLocaleString('id-ID');
}

export function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Masa berlaku paket non-trial baru mulai saat sesi pertama dipakai, sehingga
 * tanggalnya memang belum ada. Keadaan itu dinyatakan dengan kalimat, bukan
 * tanggal kosong, agar petugas tidak mengira datanya hilang.
 */
export function formatPeriod(customerPackage) {
  const { startedAt, expiresAt } = customerPackage;
  if (!startedAt || !expiresAt) return 'Belum berjalan, mulai saat sesi pertama dipakai';
  return formatDate(startedAt) + ' sampai ' + formatDate(expiresAt);
}

export function remainingLabel(customerPackage) {
  const { totalSessions, remainingSessions } = customerPackage;
  return remainingSessions + ' dari ' + totalSessions + ' sesi tersisa';
}

/** Sisa hari sampai paket berakhir; null bila masa berlakunya belum berjalan. */
export function daysUntilExpiry(expiresAt) {
  if (!expiresAt) return null;
  const end = new Date(expiresAt);
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end - today) / 86400000);
}

/** Paket yang perlu ditindaklanjuti: aktif, masih bersisa, berakhir dalam sepekan. */
export function isExpiringSoon(customerPackage) {
  if (customerPackage.status !== 'active' || customerPackage.remainingSessions <= 0) return false;
  const days = daysUntilExpiry(customerPackage.expiresAt);
  return days !== null && days >= 0 && days <= 7;
}
