# Asumsi Pembuatan Dataset Sintetis

**Proyek:** Smart Reminder & Follow-up (Gymnasyum)
**Penyusun:** Lalu Abiyu Tsani (Machine Learning)
**Versi data:** 0.5 (mengikuti website tim pada commit `3a95e87`). Versi sebelumnya diarsipkan di `archive/v0.2/`–`archive/v0.4/`.
**Sumber:** `src/generate_data.py`. Angka pada dokumen ini adalah parameter yang dipakai di sana.

Data operasional Gymnasyum tidak disediakan, jadi riwayat customer disimulasikan. Aturan label dan definisi fitur ada di [aturan_label.md](aturan_label.md). Dokumen ini menjelaskan bagaimana *riwayat* customer dibuat. Bentuk datanya mengikuti tabel website (`packages`, `customer_packages`, `attendances`, `reminders`), dan fiturnya dihitung dengan definisi yang sama dengan backend (lihat [kebutuhan_data.md](kebutuhan_data.md)).

## 1. Cakupan simulasi

| Parameter | Nilai |
|---|---|
| Jumlah customer | 1.200 |
| Periode simulasi | 1 Maret – 31 Oktober 2026 |
| Customer terakhir bergabung | 15 September 2026 |
| Seed acak | 42 (hasil selalu sama setiap dijalankan) |

## 2. Tipe keterlibatan customer (laten)

Setiap customer diberi satu tipe keterlibatan. Tipe ini **tidak dijadikan fitur**: model hanya melihat akibatnya, yaitu kehadiran, reschedule, dan respons.

| Tipe | Porsi | Peluang tidak hadir | Peluang izin (`excused`) | Peluang membalas reminder | Booking per minggu | Rata-rata jam membalas | Peluang membeli paket berikutnya |
|---|---|---|---|---|---|---|---|
| Rajin | 45% | 4% | 5% | 88% | 2,4 | 3 | 92% |
| Sedang | 35% | 16% | 12% | 60% | 1,6 | 10 | 75% |
| Kurang | 20% | 38% | 22% | 30% | 0,9 | 24 | 45% |

Supaya customer dengan tipe yang sama tidak identik, peluang tiap customer divariasikan ±25%, frekuensi booking ±20%, dan jam membalas −30% sampai +40%. Rata-rata jam membalas dinaikkan dari v0.4 karena batas No Response sekarang 48 jam.

## 3. Paket

Katalog = isi tabel `packages` di website (migrasi `1794055029669`):

| Paket | Kategori | Sesi | Masa berlaku | Bobot pembelian |
|---|---|---|---|---|
| Group Class Regular 4 Sesi | group_class | 4 | 45 hari | 20 |
| Group Class Regular 8 Sesi | group_class | 8 | 45 hari | 18 |
| Group Class Regular 12 Sesi | group_class | 12 | 60 hari | 10 |
| Personal Training Junior Coach 8 Sesi | personal_training | 8 | 45 hari | 15 |
| Trial Personal Training Junior Coach | trial | 1 | 7 hari | hanya paket pertama (35% customer baru) |
| Open Gym 4 Sesi | open_gym | 4 | 30 hari | 17 |

- **Masa berlaku** mengikuti `package.service.js`: paket reguler mulai berlaku pada sesi pertama yang dihadiri, paket trial sejak dibeli.
- **Sesi** berkurang hanya saat customer hadir (`present`/`late`). Paket `used_up` saat sesi habis, atau berakhir (`expired`) dengan sisa sesi yang hangus.
- **Pembelian berikutnya:** sesuai peluang profil, 0–10 hari setelah paket sebelumnya habis atau berakhir. Customer yang tidak membeli lagi tetap berstatus aktif dan masih ikut diklasifikasi selama 30 hari (tanpa paket aktif).
- **Harga** tidak dipakai sebagai fitur.
- Hasil: 4.217 paket dibeli (group_class 2.312, open_gym 783, personal_training 696, trial 426); 75,8% di antaranya habis terpakai.

## 4. Booking dan kehadiran

- Booking berlangsung selama paket masih punya sesi dan belum berakhir. Jarak antar-booking diambil acak dari distribusi eksponensial sesuai frekuensi booking per minggu (minimal 1 hari).
- **Status kehadiran** mengikuti enum `attendances.status`:

  | Status | Peluang | Hasil di data |
  |---|---|---|
  | `excused` (izin/reschedule) | sesuai profil | 8,5% |
  | `absent` | sesuai profil | 11,0% |
  | `late` | 8% dari yang hadir | 6,4% |
  | `present` | sisanya | 74,2% |

  Backend menghitung `excused` sebagai reschedule (`reschedules`) dan menghitung semua status sebagai booking (penyebut `attendanceRatio`).

## 5. Reminder

Mengikuti `reminder-scheduler.service.js`:

- **Reminder jadwal:** satu per booking, dikirim sehari sebelum kelas pukul 09.00 ditambah 0–45 menit (`lead_minutes = 1440`). Reminder 2 jam tidak disimulasikan karena nonaktif secara default.
- **Pengingat paket H-7:** dikirim 7 hari sebelum `expires_at` bila paket masih aktif dan masih punya sisa sesi.
- **Status:** `responded` jika customer membalas dalam 48 jam, selain itu `no_response` (sama dengan backend dan Project Plan).
- Hasil: 26.729 reminder jadwal dan 1.118 pengingat paket; 72,1% responded, 27,9% no_response.

## 6. Pembentukan baris dataset

- **Tanggal acuan** diambil acak sepanjang masa keanggotaan customer, dari 3 hari setelah bergabung sampai 30 hari setelah aktivitas terakhir. Ini meniru backend, yang mengklasifikasi semua customer aktif setiap siklus.
- **Jumlah baris per customer:** maksimal 3, dengan jarak antar tanggal acuan minimal 10 hari.
- **"Sekarang" = pukul 12.00 tanggal acuan.** Semua fitur hanya memakai data sebelum saat itu. Reminder dihitung sebagai No Response hanya jika 48 jam sudah lewat, supaya tidak ada kebocoran data dari masa depan.
- **Paket aktif** dipilih seperti backend: paket yang belum habis dan belum berakhir, yang paling cepat berakhir. `daysToExpiry` kosong untuk paket reguler yang belum pernah dipakai.
- **Label** dihitung dengan aturan poin v0.5, lalu **6,5%** label digeser satu tingkat (lihat aturan label bagian 8).

## 7. Hasil dan keterbatasan

- **Hasil:** 3.549 baris dari 1.200 customer (semua customer mendapat minimal 1 baris).
  - Distribusi label: Low 49,0%, Medium 34,4%, High 16,5%.
  - Paket aktif pada tanggal acuan: group_class 43,8%, tanpa paket aktif 31,2%, personal_training 14,4%, open_gym 9,4%, trial 1,0%.
- **Asumsi perilaku** adalah asumsi tim, bukan hasil pengamatan di Gymnasyum. Pola musiman, hari libur, atau perubahan jadwal oleh pelatih tidak disimulasikan.
- **Perlu dilatih ulang dengan data asli.** Setelah website mencatat kehadiran dan status reminder yang sebenarnya, model perlu dilatih ulang dengan data tersebut.
