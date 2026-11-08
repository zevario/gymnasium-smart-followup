# Gymnasyum Smart Reminder & Follow-up

Aplikasi lokal untuk petugas Gymnasyum Bintaro. Antarmuka React berada di `frontend/`. API Express, migrasi PostgreSQL dan pengujian berada di `backend/`. Jalur operasional ini menggunakan rancangan pilot trial dan perpanjangan dari PRD versi 2.

## Menjalankan aplikasi

Gunakan Node.js 24 dan PostgreSQL dengan database khusus aplikasi. Pada instalasi baru, salin `backend/.env.example` ke `backend/.env`, isi koneksi PostgreSQL, dua rahasia JWT berbeda dan akun administrator awal. Pertahankan konfigurasi yang sudah ada pada instalasi lama. Jalankan dari akar proyek.

```sh
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
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix backend run test:pilot
```

Uji HTTP membuat skema PostgreSQL sementara, menjalankan migrasi dan API untuk akun sintetis, lalu menghapus skema uji. Gunakan database pengembangan dengan hak membuat skema. Uji kebijakan memeriksa batas waktu, cooldown, cap dan penanganan balasan. Endpoint `/api/health` memeriksa koneksi dan tabel pilot.
