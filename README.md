# Gymnasyum Smart Reminder & Follow-up

Aplikasi lokal untuk petugas Gymnasyum Bintaro. Antarmuka React berada di `frontend/`. API Express, migrasi PostgreSQL dan pengujian berada di `backend/`. Jalur operasional ini menggunakan rancangan pilot trial dan perpanjangan dari PRD versi 2.

## Menjalankan aplikasi

Gunakan Node.js 24 dan PostgreSQL dengan database khusus aplikasi. Pada instalasi baru, salin `backend/.env.example` ke `backend/.env`, isi koneksi PostgreSQL, dua rahasia JWT berbeda dan akun administrator awal. Pertahankan konfigurasi yang sudah ada pada instalasi lama. Jalankan dari akar proyek.

```sh
npm ci
npm ci --prefix backend
npm ci --prefix frontend
npm --prefix backend run migrate:up
npm --prefix backend run seed:admin
npm --prefix frontend run build
npm --prefix backend run pilot
```

Buka [aplikasi lokal](http://127.0.0.1:3001). Server yang sama menyajikan halaman dan API. Saat mengedit React, jalankan juga `npm --prefix frontend run dev` dan buka URL dari Vite. Permintaan `/api` diteruskan ke port 3001. Jika port API berubah, atur `PILOT_PORT` di backend dan `PILOT_API_URL` saat menjalankan Vite. Perintah `start` lama di backend tetap menjalankan API aplikasi terdahulu.

## Alur pertama

1. Ketik email dan kata sandi karyawan pada halaman masuk. Pilihan akun demo di kolom email membuka simulasi lokal yang terpisah dari akun dan data PostgreSQL.
2. Administrator sistem membuka **Pengaturan** untuk membuat akun supervisor dan petugas. Akun yang dibuat melalui pilot terikat pada lokasi Bintaro. Migrasi awal mendaftarkan administrator aktif dari instalasi lama. Staf tanpa penugasan lokasi ditolak oleh API pilot. Administrator mengelola akun. Supervisor dan petugas menangani data pelanggan di cabang Bintaro.
3. Supervisor membuka **Pengaturan → Impor trial dan paket**. Pilih **Lihat contoh format** atau buka file JSON, periksa pratinjau lalu simpan. Contoh memakai izin yang belum diketahui dan nomor kosong. Tugasnya masuk daftar diblokir.
4. Petugas membuka **Semua follow-up**, memilih siklus dan mengambil tugas. Ia dapat membuat serta menyunting draft, mencatat balasan, menunda, menyelesaikan tugas, atau mencatat opt-out. Supervisor juga dapat mengalihkan PIC dan menjeda pengiriman.
5. Untuk kontak manual, periksa sumber transaksi, preferensi, inbox, penerima dan isi pesan. Catat referensi pemeriksaan saat menyetujui. Aplikasi menampilkan nomor dan teks untuk digunakan segera di kanal resmi. Sesudah itu catat bukti terkirim atau bukti gagal. Upaya yang hasilnya belum diketahui menahan upaya berikutnya, termasuk pada tujuan lain.
6. Supervisor membuka **Laporan** untuk melihat jumlah siklus, siklus yang pernah dihubungi, serta transaksi pada kohort eligible yang sudah matang.

## Data dan aturan operasional

Impor JSON bersifat inkremental, maksimal 500 record per permintaan dan 1 MB. Satu batch disimpan dalam satu transaksi. Lokasi yang diterima adalah `bintaro`. Gunakan identitas pelanggan dari sumber, ID siklus stabil, timestamp ISO dengan zona waktu, serta `goal` bernilai `trial` atau `renewal`. Setiap record mencantumkan hasil pemeriksaan transaksi. Pakai `transaction: null` jika belum ada pembelian terkonfirmasi. Izin `granted` memerlukan `consentRef` dan `consentAt`. Renewal juga memerlukan `membershipState`; hanya `renewable` yang dapat dihubungi. Untuk renewal, gunakan awal tanggal kedaluwarsa dalam WIB. `observedAt` adalah waktu pemeriksaan sumber. Catat transaksi terkonfirmasi dengan `transaction` (referensi unik) serta `transactionAt` (waktu transaksi). Pembelian atau perpanjangan dari catatan bebas petugas tidak menambah angka konversi.

Trial dibuka setelah 24 jam dan berakhir pada hari ke-14. Renewal dibuka H-7 dan berakhir saat H+8 dimulai. H-2 menggunakan tugas yang sama. Worker memeriksa siklus setiap menit dan setelah impor. Skor memisahkan urgensi, minat, aktivitas dan keterlambatan. Satu siklus dibatasi dua upaya, dengan jeda lintas tujuan minimal 48 jam, maksimal dua upaya per tujuan dan tiga upaya lintas tujuan dalam tujuh hari berjalan. Balasan pelanggan menahan kontak otomatis berikutnya.

Mode batch lokal menggunakan ambang umur sumber 24 jam serta verifikasi manual baru saat persetujuan. Jam kontak 09.00–18.00 WIB. Ambang batch dan prosedur manual ini perlu disepakati dengan operasional sebelum pilot pelanggan nyata. Pengiriman dilakukan oleh petugas di luar aplikasi. Aplikasi menyimpan persetujuan dan konfirmasi manual. Integrasi membership, transaksi, callback WhatsApp, multi-cabang dan model prediktif memerlukan pekerjaan lanjutan.

Draft standar memakai template dan fakta sumber. Untuk pemilihan frasa berbantuan model lokal, atur `PILOT_AI_URL` dan `PILOT_AI_MODEL` untuk Ollama yang sudah memiliki model. Server hanya mengirim jenis tujuan kepada model, memvalidasi pilihan frasa, lalu memasukkan fakta pelanggan sendiri. Jika model tidak tersedia, editor menampilkan **Template**. [Kontrak API Ollama](https://docs.ollama.com/api/generate)

## Verifikasi

```sh
npm run check
```

`npm run check` memeriksa format kode, menjalankan lint frontend dan backend, seluruh uji pilot, lalu build frontend. Masing-masing tahap juga tersedia melalui `npm run lint`, `npm test`, dan `npm run build` dari akar proyek. Database pengembangan harus aktif sesuai konfigurasi backend.

Uji HTTP membuat skema PostgreSQL sementara, menjalankan migrasi dan API untuk akun sintetis, lalu menghapus skema uji. Gunakan database pengembangan dengan hak membuat skema. Uji kebijakan memeriksa batas waktu, cooldown, cap dan penanganan balasan. Endpoint `/api/health` memeriksa koneksi dan tabel pilot.

## Struktur dan pedoman kode

```text
frontend/src/
  app/                 # App dan layout aplikasi
  features/            # auth, accounts, customers, dashboard, followups, profile, reports, settings
    <fitur>/
      pages/           # Halaman fitur (termasuk varian pilot)
      components/      # Komponen khusus fitur
      hooks/           # State dan efek React khusus fitur
      services/        # Aturan dan operasi fitur
      constants/       # Nilai tetap fitur
  shared/
    api/               # HTTP client dan sesi API
    components/        # Komponen UI lintas fitur
    i18n/              # Provider, hook, dan kamus bahasa
    styles/            # CSS lintas halaman
  assets/images/       # Gambar yang diimpor aplikasi
  main.jsx             # Entry point React
backend/
  src/
    modules/           # Modul berdasarkan domain
      <domain>/        # *.routes.js, *.controller.js, *.service.js, *.repository.js, *.schema.js
    database/
      pool.js          # Koneksi PostgreSQL aplikasi
      seeds/           # Seed untuk skema aplikasi saat ini
    middleware/        # Autentikasi, otorisasi, dan penanganan error
    routes/            # Penggabungan route API terdahulu
    utils/             # Utilitas lintas modul
    app.js             # Express API terdahulu
    server.js          # Startup API terdahulu
    pilot-app.js       # Express API pilot dan penyajian frontend
    pilot-server.js    # Startup API pilot dan lifecycle
  migrations/          # Migrasi node-pg-migrate
  test/                # Pengujian kebijakan dan HTTP
```

Folder fitur hanya dibuat jika diperlukan; tidak perlu membuat subfolder kosong. Halaman dikelompokkan berdasarkan fitur, sedangkan izin peran tetap ditangani oleh aturan akses dan middleware.

Di `backend/src/modules/pilot/`, `pilot.routes.js` menangani HTTP dan validasi, `pilot.service.js` mengatur alur serta batas transaksi, dan `pilot.repository.js` menangani akses data. `pilot.policy.js` berisi evaluasi aturan bisnis, `pilot.commands.js` menangani tindakan tugas, dan `pilot.lifecycle.js` merekonsiliasi siklus. Kontrak input berada di `pilot.schema.js`.

Gunakan nama `*.controller.js`, `*.repository.js`, `*.routes.js`, `*.schema.js`, dan `*.service.js` sesuai tanggung jawabnya. Simpan komponen khusus fitur di fitur tersebut; pindahkan ke `shared` hanya jika memang digunakan lintas fitur. Gunakan import langsung ke file tujuan agar dependensi terlihat jelas. Pertahankan urutan lock dan batas transaksi saat mengubah alur impor. Jalankan `npm run check` sebelum mengajukan perubahan.

Entry point Vite, Express, konfigurasi Vercel, lokasi migrasi, dan URL API tetap sama. Script `seed:admin` dan `seed:demo` menggunakan `src/database/seeds/`. Script `seed:spv` tersedia untuk bootstrap supervisor API terdahulu memakai `SPV_NAME`, `SPV_EMAIL`, dan `SPV_PASSWORD`. Untuk akun pilot, gunakan halaman administrasi agar akun mendapat penugasan lokasi.

## Menjaga kode tetap rapi

Jalankan `npm run format` setelah mengedit kode. Aturan Prettier dan EditorConfig di akar proyek menyamakan indentasi, kutip, dan panjang baris. `npm run format:check` memeriksa tanpa mengubah file; pemeriksaan ini juga menjadi bagian dari `npm run check`. Migrasi historis dan lockfile tidak diformat ulang.

Konfigurasi ignore dipusatkan di `.gitignore` akar. Folder `node_modules`, hasil build, coverage, serta konfigurasi lokal tidak masuk Git. Jangan menghapus migrasi hanya karena tidak diimpor oleh JavaScript: migrasi dijalankan CLI dan dibutuhkan instalasi database.

Prototipe CommonJS dengan skema lama dan perintah `npm run seed` yang mengarah ke prototipe tersebut sudah dihapus. Gunakan `seed:admin` untuk administrator awal dan `seed:demo` untuk data demo skema saat ini. API terdahulu (`npm start`) dan API pilot (`npm run pilot`) tetap tersedia; keduanya mempunyai entry point yang aktif.

## Keamanan

Pembatasan permintaan, validasi JWT, rotasi refresh atomik, pencabutan sesi, batas input/upload, dan header browser telah diterapkan. Sesi lama perlu login ulang setelah pembaruan format token. Lihat [panduan keamanan](docs/SECURITY.md) untuk konfigurasi produksi, batas perlindungan, dan langkah verifikasi.
