# Gymnasyum | Smart Follow-up

Frontend React untuk pengelolaan pelanggan dan follow-up. Untuk menjalankan frontend bersama API, ikuti [panduan proyek](../README.md).

## Perintah

Jalankan dari folder `frontend`: `npm ci`, lalu `npm run dev`. Gunakan `npm run lint` untuk pemeriksaan kode dan `npm run build` untuk build produksi. Dari akar proyek, `npm run check` memeriksa format, frontend, dan backend sekaligus. Gunakan `npm run format` dari akar proyek untuk format kode yang konsisten.

## Penempatan kode

| Lokasi                    | Tanggung jawab                                                      |
| ------------------------- | ------------------------------------------------------------------- |
| `src/main.jsx`            | Entry point React dan provider global                               |
| `src/app/`                | Penyusunan aplikasi, navigasi, header, sidebar, workspace           |
| `src/features/auth/`      | Login, sesi, konteks akun, aturan akses                             |
| `src/features/accounts/`  | Administrasi akun dan pengaturan sistem                             |
| `src/features/customers/` | Halaman pelanggan, komponen baris, data demo                        |
| `src/features/dashboard/` | Dashboard dan antrean hari ini                                      |
| `src/features/followups/` | Halaman follow-up, detail tugas, riwayat, aturan dan label tindakan |
| `src/features/profile/`   | Halaman profil dan editor foto                                      |
| `src/features/reports/`   | Halaman laporan demo dan pilot                                      |
| `src/features/settings/`  | Pengaturan operasional dan impor pilot                              |
| `src/shared/api/`         | HTTP client, token sesi, dan helper respons API                     |
| `src/shared/components/`  | Tombol, modal, kontrol, dan pemilih bahasa                          |
| `src/shared/i18n/`        | Kamus terjemahan, provider, dan hook bahasa                         |
| `src/shared/styles/`      | CSS global, polish, dan pilot                                       |
| `src/assets/images/`      | Gambar yang dibundel Vite                                           |
| `public/`                 | Favicon dan avatar dengan alamat publik tetap                       |

Setiap fitur memakai subfolder `pages`, `components`, `hooks`, `services`, `constants`, `context`, `data`, atau `utils` sesuai kebutuhan. CSS khusus halaman tetap berdekatan dengan halaman, misalnya `features/auth/pages/Login.css`. Halaman berdasarkan peran kini berada di fitur masing-masing; hak akses tetap diperiksa saat navigasi dan melalui API.

Jangan mengimpor modul fitur ke `shared`; kode umum tidak perlu mengetahui domain aplikasi. Komposisi lintas fitur berada di `app`. Gunakan nama PascalCase untuk komponen dan camelCase untuk hook serta utilitas.

## Pembagian komponen

Semua halaman di `features/*/pages` menyusun komponen fitur, bukan menampung seluruh markup. Pembagiannya:

| Fitur        | Bagian tampilan                                                                  |
| ------------ | -------------------------------------------------------------------------------- |
| Login        | Cerita/benefit, tautan, preferensi, formulir, pemilih akun, dan kolom password   |
| Dashboard    | Statistik, antrean dengan filter, rekomendasi, aktivitas tim, dan pemberitahuan  |
| Pelanggan    | Daftar pelanggan pilot dan baris pelanggan demo                                  |
| Follow-up    | Filter, tab status, identitas/kontak, editor pesan, riwayat, dan modal tindakan  |
| Laporan      | Filter, statistik, funnel, grafik harian, tabel petugas, dan kartu laporan pilot |
| Pengaturan   | Aturan kontak, siklus follow-up, kebijakan pilot, dan formulir impor             |
| Administrasi | Formulir akun, daftar/baris akun, dan status koneksi                             |
| Profil       | Tab akun, identitas, detail profil, keamanan, pemilih avatar, dan unggah foto    |

State formulir login berada di `features/auth/hooks/useLoginForm.js`. Filter antrean dimiliki `DashboardQueue`, sedangkan interaksi menu akun dimiliki `app/components/ProfileMenu.jsx`. Data statis login dan laporan berada di subfolder `data` fitur masing-masing. Pisahkan komponen berdasarkan fungsi tampilan; jangan memecah setiap elemen hanya untuk mengejar jumlah baris.

- `app/App.jsx`: pemulihan sesi, login, dan pemilihan workspace.
- `app/hooks/useDemoWorkspace.js`: state demo yang tetap tersimpan selama perpindahan sesi, navigasi, pelanggan, dan foto profil.
- `app/layouts/DemoWorkspace.jsx`: susunan sidebar, header, konten, drawer, dan toast. `DemoPageContent.jsx` memilih halaman.
- `app/components/Notifications.jsx` dan `LocationDialog.jsx`: interaksi notifikasi serta informasi lokasi.
- `features/followups/components/DetailDrawer.jsx`: menghubungkan ringkasan, editor draft, riwayat, dan modal demo. Tampilan dipisahkan ke `FollowUpSummary`, `FollowUpComposer`, `History`, `ReviewModal`, `ActionModal`, dan `ResultModal`.
- `features/followups/hooks/useDemoDraft.js`: state nada pesan dan penyusunan draft demo, tetap hidup saat pengguna berganti tab drawer.
- `features/followups/components/PilotTask.jsx`: koordinasi tugas pilot dan pemeriksaan versi. `PilotTaskSummary`, `PilotTaskComposer`, `PilotTaskActions`, `PilotTaskActionForm`, dan `PilotTaskHistory` menangani bagian tampilannya.
- `shared/components/`: satu komponen per file, termasuk `Icon`, `Badge`, `Avatar`, `Field`, `PageIntro`, `ThemeToggle`, dan `LocationPin`.

Gunakan props data dan callback untuk menghubungkan komponen. Pertahankan state bersama pada parent atau hook agar tidak ter-reset ketika bagian tampilan berganti. Komponen tampilan tidak mengambil alih pemeriksaan izin, versi tugas, atau proses penyimpanan milik parent. Import komponen langsung dari file masing-masing, tanpa file agregasi `Controls.jsx`.

Autentikasi dimulai dari `features/auth/pages/Login.jsx`. Header hanya tersedia setelah login; modal login dan signup lama di header sudah dihapus.
