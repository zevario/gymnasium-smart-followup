# Aturan Label dan Fitur: Prioritas Follow-up Customer

**Proyek:** Smart Reminder & Follow-up (Gymnasyum)
**Penyusun:** Lalu Abiyu Tsani (Machine Learning)
**Versi:** 0.5
**Tanggal:** 17 November 2026

## 1. Tujuan

Dokumen ini menetapkan cara menentukan label prioritas follow-up (Low, Medium, High) dan fitur apa saja yang dipakai model. Karena data operasional Gymnasyum tidak disediakan, dataset dibuat secara sintetis dan label ditentukan dengan aturan poin pada dokumen ini.

Sejak v0.5, **fitur model sama persis dengan 8 kolom yang sudah dihitung backend website** (`collectFeatures()` di `backend/src/modules/predictions/prediction.repository.js`, commit `3a95e87`). Backend mengirim kolom itu apa adanya ke Inference API, jadi tidak ada perhitungan fitur ganda di dua tempat.

## 2. Definisi dasar

| Istilah | Definisi |
|---|---|
| Unit data | Satu baris = satu customer pada satu tanggal acuan. |
| Tanggal acuan | Saat prioritas dihitung ("sekarang"). Backend mengklasifikasi **semua** customer aktif yang memberi izin kontak setiap siklus penjadwal, jadi tanggal acuan diambil acak sepanjang masa keanggotaan, termasuk sampai 30 hari setelah aktivitas terakhir. Data setelah tanggal acuan tidak boleh dipakai. |
| Paket | Paket bersesi dari tabel `packages` (6 paket). Sesi berkurang saat kehadiran `present`/`late`. Paket reguler mulai berlaku pada sesi pertama, paket trial sejak dibeli. Paket `used_up` saat sesi habis, `expired` setelah `expires_at`. |
| Paket aktif | Paket berstatus `active`. Jika ada lebih dari satu, dipilih yang paling cepat berakhir (sama dengan backend). |
| Reschedule | Kehadiran berstatus `excused` (definisi backend). |
| Respons | Reminder berstatus Responded. No Response bila tidak ada balasan **48 jam** setelah Sent (`reminder-scheduler.service.js`). |
| Reminder | Reminder jadwal 24 jam sebelum kelas (reminder 2 jam nonaktif secara default) dan pengingat paket H-7 bila masih ada sisa sesi. |

## 3. Fitur (input model)

| Nama fitur | Tipe | Cara menghitung (sama dengan backend) | Nilai kosong (`null`) |
|---|---|---|---|
| `visits30Days` | bulat ≥ 0 | Kehadiran `present`/`late` dalam 30 hari terakhir | tidak pernah |
| `daysSinceLastVisit` | bulat ≥ 0 | Hari sejak kehadiran `present`/`late` terakhir | belum pernah hadir |
| `attendanceRatio` | 0–1 | (`present` + `late`) ÷ semua booking (termasuk `absent` dan `excused`), sepanjang waktu | belum ada booking |
| `reschedules` | bulat ≥ 0 | Jumlah kehadiran `excused`, sepanjang waktu | tidak pernah |
| `noResponses` | bulat ≥ 0 | Jumlah reminder No Response, sepanjang waktu | tidak pernah |
| `responseRatio` | 0–1 | Responded ÷ reminder yang sudah terkirim (termasuk yang belum berstatus akhir) | belum ada reminder terkirim |
| `remainingSessions` | bulat ≥ 0 | `total_sessions − used_sessions` paket aktif | tidak ada paket aktif |
| `daysToExpiry` | bulat | `expires_at − hari ini` paket aktif | tidak ada paket aktif, atau paket reguler belum dipakai |

Nilai kosong diisi median data latih di dalam pipeline model, ditambah kolom indikator "kosong". Jadi model tetap bisa membedakan "belum pernah hadir" dari nilai yang diisi.

## 4. Data yang tidak dipakai sebagai fitur

| Data | Alasan |
|---|---|
| Usia | Batasan proyek: prioritas tidak ditentukan oleh usia. |
| Persona atau segmen (ibu-ibu, lansia, menengah ke atas) | Persona hanya memengaruhi gaya bahasa draft pesan, bukan prioritas. |
| Harga atau nominal paket | Dapat menjadi proksi kemampuan ekonomi. |
| Nama, nomor telepon, ID | Data pribadi dan tidak relevan untuk prediksi. |
| Kategori paket | Tidak dikirim backend. Tetap dicatat di dataset sebagai metadata EDA. |

## 5. Aturan poin

| Komponen | Kondisi | Poin |
|---|---|---|
| Aktivitas 30 hari | `visits30Days` = 0 | 2 |
| | 1 sampai 2 | 1 |
| | ≥ 3 | 0 |
| Lama tidak berkunjung | `daysSinceLastVisit` > 14 | 2 |
| | 7 sampai 14 | 1 |
| | < 7 | 0 |
| | Belum pernah hadir (`null`) | 1 |
| Kehadiran | `attendanceRatio` < 0,6 | 2 |
| | 0,6 sampai < 0,8 | 1 |
| | ≥ 0,8 atau `null` | 0 |
| Respons reminder | `responseRatio` < 0,30 | 3 |
| | 0,30 sampai 0,60 | 1 |
| | > 0,60 atau `null` | 0 |
| Banyak tidak merespons | `noResponses` ≥ 3 | 1 |
| Sering reschedule | `reschedules` ≥ 3 | 1 |
| Paket (pilih satu) | Tidak ada paket aktif | 2 |
| | Paket berakhir dalam 7 hari (`daysToExpiry` ≤ 7) dan masih ada sisa sesi | 3 |
| | Sisa sesi ≤ 1 | 1 |
| | Selain itu | 0 |

Skor maksimum: 14 poin. Komponen paket mengikuti tujuan reminder di Project Plan: sesi yang akan hangus (H-7) paling mendesak, lalu customer tanpa paket aktif (peluang perpanjangan), lalu paket yang hampir habis.

## 6. Ambang batas label

| Label | Total poin |
|---|---|
| High | 8 atau lebih |
| Medium | 4 sampai 7 |
| Low | 0 sampai 3 |

## 7. Contoh perhitungan

| | Customer A | Customer B |
|---|---|---|
| Hadir 30 hari | 0 kali (2) | 6 kali (0) |
| Hari sejak kunjungan terakhir | 20 hari (2) | 2 hari (0) |
| Rasio kehadiran | 0,50 (2) | 0,95 (0) |
| Rasio respons | 0,20 (3) | 0,90 (0) |
| No Response | 4 kali (1) | 0 kali (0) |
| Reschedule | 3 kali (1) | 0 kali (0) |
| Paket | 3 sesi, berakhir 5 hari lagi (3) | 5 sesi, berakhir 30 hari lagi (0) |
| **Total poin** | **14** | **0** |
| **Label** | **High** | **Low** |

Kedua contoh ini dipakai di `tests/test_ml.py`.

## 8. Menjaga label tidak terlalu mudah ditebak

1. Data dibuat dari perilaku acak per customer. Setiap customer memiliki tingkat keterlibatan laten (rajin, sedang, kurang aktif) yang tidak dimasukkan sebagai fitur.
2. Label dihitung dari aturan poin, lalu **5 sampai 8%** label digeser satu tingkat (Low ↔ Medium atau Medium ↔ High). Tidak ada pergeseran langsung Low ↔ High. Ini meniru penilaian manusia yang tidak selalu konsisten.
3. Hal ini dicatat sebagai keterbatasan pada hasil evaluasi.

## 9. Target distribusi kelas

| Label | Target proporsi | Hasil v0.5 (sebelum noise) | Hasil v0.5 (setelah noise) |
|---|---|---|---|
| Low | 50 sampai 60% | 51,7% | 49,0% |
| Medium | 25 sampai 30% | 31,3% | 34,4% |
| High | 10 sampai 20% | 17,0% | 16,5% |

Ambang 4/8 dipilih dari sebaran poin: dengan ambang 3/7, Low hanya 41% dan High 22%.

## 10. Keterbatasan

- Data bersifat sintetis dan aturan poin dibuat oleh tim, bukan berasal dari penilaian nyata admin Gymnasyum.
- Performa model mencerminkan konsistensi terhadap aturan ini, bukan kebenaran di dunia nyata.
- Fitur kehadiran, reschedule, dan respons dihitung **sepanjang waktu** oleh backend (kecuali `visits30Days`), jadi customer lama cenderung punya angka `reschedules` dan `noResponses` lebih besar. Ini mengikuti definisi backend dan dicatat sebagai keterbatasan.
- Aturan dapat direvisi apabila ada masukan dari mentor atau pihak mitra.

## 11. Riwayat revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 0.1 | 2 November 2026 | Draft awal aturan label dan fitur. |
| 0.2 | 8 November 2026 | `sessions_left` dikeluarkan dari input model agar selaras dengan backend tim (membership berbasis tanggal). Akurasi test 85,8%. |
| 0.3 | 8 November 2026 | Membership berbasis tanggal (7 paket dari form website), status kehadiran present/late/absent/excused, membership yang baru lewat (H+7) ikut dilatih. Akurasi test 91,0%. Arsip: `archive/v0.2/`. |
| 0.4 | 8 November 2026 | Reminder disamakan dengan scheduler saat itu: reminder jadwal 24 jam, No Response setelah 24 jam. Akurasi test 90,5%. Arsip: `archive/v0.3/`. |
| 0.5 | 17 November 2026 | **Fitur diganti total menjadi 8 kolom yang dihitung backend** (`visits30Days`, `daysSinceLastVisit`, `attendanceRatio`, `reschedules`, `noResponses`, `responseRatio`, `remainingSessions`, `daysToExpiry`), sehingga backend bisa langsung memakai model tanpa perubahan. Simulasi mengikuti website terbaru: 6 paket bersesi dari tabel `packages`, sesi berkurang saat hadir, pengingat paket H-7, No Response setelah 48 jam. Aturan poin dan ambang (4/8) disusun ulang untuk fitur baru. Model terpilih Random Forest: akurasi test 90,2% (95% CI 87,6–92,7%), macro F1 0,896, recall High 0,869. Arsip: `archive/v0.4/`. |
