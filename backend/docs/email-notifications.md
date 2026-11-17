# Antrean pemberitahuan perubahan email

Sebelum menjalankan backend versi ini, jalankan `npm run db:migrate` dari akar proyek. Migrasi `1794055029670_account_email_notices.js` menambahkan antrean notifikasi terpisah dan memindahkan kebutuhan notifikasi untuk permintaan ganti email yang masih menunggu.

Permintaan perubahan email menyimpan tujuan lama, tujuan baru, dan waktu permintaan dalam transaksi yang sama dengan antrean tautan konfirmasi. Dua pengiriman memiliki status dan percobaan ulang sendiri:

- Penolakan SMTP alamat lama tidak menghalangi konfirmasi alamat baru.
- Percobaan ulang konfirmasi tidak mengirim ulang notifikasi yang telah berhasil dicatat.
- Notifikasi gagal dicoba ulang dengan exponential backoff sampai umur permintaan 24 jam. Baris yang belum berhasil tetap tersedia untuk pemeriksaan operasional.
- Seperti pengiriman SMTP pada umumnya, crash setelah penyedia menerima pesan tetapi sebelum transaksi commit masih dapat menghasilkan duplikasi. Tidak ada jaminan exactly-once.

Tes HTTP memakai SMTP lokal dan skema database sementara, termasuk penolakan alamat lama dan alamat baru secara terpisah. Tidak mengirim ke Gmail nyata.
