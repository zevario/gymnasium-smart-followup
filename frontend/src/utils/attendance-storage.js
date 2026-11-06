import { notifyStorageChange } from './storage-sync';
const STORAGE_KEY = 'gymnasyum_visits';

// Mengambil seluruh data absensi
export const getAttendance = () => {
  try {
    const savedAttendance = localStorage.getItem(STORAGE_KEY);

    return savedAttendance ? JSON.parse(savedAttendance) : [];
  } catch (error) {
    console.error('Gagal membaca data absensi:', error);
    return [];
  }
};

// Mengambil tanggal kunjungan terakhir untuk satu pelanggan.
export const getLastVisit = (customerId, attendance = getAttendance()) => {
  const latestVisit = attendance
    .filter(
      (item) =>
        String(item.customerId) === String(customerId) &&
        item.visitAt
    )
    .reduce((latest, current) => {
      if (!latest) return current;

      return new Date(current.visitAt) > new Date(latest.visitAt)
        ? current
        : latest;
    }, null);

  if (!latestVisit) return '-';

  return new Date(latestVisit.visitAt).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Menyimpan seluruh data absensi
export const saveAttendance = (attendance) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attendance));

    notifyStorageChange(STORAGE_KEY);
  } catch (error) {
    console.error('Gagal menyimpan data absensi:', error);
  }
};

// Menambahkan catatan kunjungan
export const addAttendance = (attendanceData) => {
  const attendance = getAttendance();

  const newAttendance = {
    id: Date.now(),
    ...attendanceData,
    createdAt: new Date().toISOString(),
  };

  const updatedAttendance = [newAttendance, ...attendance];

  saveAttendance(updatedAttendance);

  return newAttendance;
};
