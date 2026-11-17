export const priorityLabels = {
  high: 'Tinggi',
  medium: 'Sedang',
  low: 'Rendah',
};

export const statusLabels = {
  scheduled: 'Dijadwalkan',
  sent: 'Terkirim',
  responded: 'Dibalas',
  no_response: 'Tidak dibalas',
  cancelled: 'Dibatalkan',
};

export const typeLabels = {
  schedule: 'Pengingat jadwal',
  package: 'Pengingat paket',
  followup: 'Follow-up',
  general: 'Umum',
};

export function formatMoment(value) {
  if (!value) return null;
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
