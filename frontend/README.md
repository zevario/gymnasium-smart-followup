# Gymnasyum | Smart Follow-up

Frontend aplikasi staf untuk mengelola pelanggan dan tindak lanjut, dibangun dengan React, JavaScript/JSX, dan Vite.

## Menjalankan aplikasi

Untuk menjalankan frontend dan backend bersama, ikuti [panduan di akar proyek](../README.md). Untuk mengembangkan tampilan, jalankan `npm ci` untuk memasang dependensi, lalu `npm run dev` untuk membuka server lokal. Gunakan `npm run lint` untuk memeriksa kode dan `npm run build` untuk membuat versi produksi.

## Struktur proyek

| Lokasi | Isi |
| --- | --- |
| `public/` | Favicon dan avatar dengan alamat publik tetap |
| `src/assets/` | Gambar yang diimpor aplikasi dan gaya yang berlaku lintas halaman |
| `src/components/` | Komponen antarmuka bersama, seperti tombol, dialog, dan pemilih bahasa |
| `src/features/auth/` | Akun demo, konteks akun, dan hak akses |
| `src/features/customers/` | Data pelanggan demo dan komponen baris pelanggan |
| `src/features/followups/` | Detail follow-up, aturan prioritas, dan antrean kontak |
| `src/features/profile/` | Editor dan fungsi pengelolaan foto profil |
| `src/i18n/` | Kamus terjemahan, pengaturan bahasa, dan hook EN/ID |
| `src/layouts/` | Header dan sidebar aplikasi |
| `src/pages/` | Halaman login beserta CSS-nya, profil, dan halaman kerja dalam folder staff, spv, dan admin |
| `src/routes/` | Aturan akses halaman berdasarkan peran |

Vite memuat `index.html` di akar proyek. React dimulai dari `src/main.jsx`, sedangkan `src/App.jsx` menyusun tampilan utama.
