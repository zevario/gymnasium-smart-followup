# Keamanan aplikasi

## Perlindungan yang diterapkan

- Login dibatasi 10 permintaan gagal per IP dalam 15 menit. Permintaan berhasil tidak menghabiskan kuota. Refresh/logout dibatasi 60 permintaan per IP dalam 15 menit; perubahan kata sandi dibatasi 10 permintaan dalam 15 menit. API memiliki batas umum 300 permintaan per menit per IP.
- JWT hanya menerima HS256, issuer `gymnasyum`, audience `gymnasyum-api`, jenis token yang sesuai, dan ID pengguna valid. Access token berumur 15 menit dan terikat pada sesi aktif di PostgreSQL; refresh token berumur 7 hari dan hanya hash SHA-256-nya yang disimpan.
- Rotasi refresh memakai transaksi dan penguncian pengguna. Hanya satu permintaan paralel dapat memakai refresh token yang sama. Logout membatalkan sesi meskipun access token sudah kedaluwarsa. Perubahan/reset kata sandi, perubahan peran, dan perubahan status akun membatalkan sesi terkait.
- Otorisasi peran dan pembatasan lokasi tetap diperiksa backend. Input pengguna diteruskan ke query terparameterisasi; nama kolom untuk pembaruan dinamis memakai allowlist.
- Body JSON dibatasi 1 MB. Input login/token memiliki batas panjang. Kata sandi baru dibatasi 72 byte UTF-8 untuk menghindari pemotongan bcrypt. Upload foto dibatasi satu file, 2 MB, tanpa field tambahan, dan diperiksa MIME serta signature file.
- Respons API tidak di-cache. Error internal tidak mengungkap query, stack trace, atau detail konfigurasi. Header Express dihapus. Helmet melindungi respons backend; CSP dan header browser untuk frontend Vercel didefinisikan di `vercel.json`.
- Startup produksi menolak JWT secret kosong, sama, pendek, atau placeholder, serta origin frontend yang bukan HTTPS.

## Menjalankan dan merilis

Gunakan `npm run check` untuk format, lint, tes alur HTTP, tes keamanan, dan build. Audit dependensi dengan `npm --prefix backend audit` serta `npm --prefix frontend audit`. Override `glob` dan `minimatch` memakai versi yang telah diperbaiki; uji migrasi dan lint harus tetap lulus saat override diperbarui.

Set `NODE_ENV=production` pada deployment, isi `FRONTEND_URL` dengan origin HTTPS yang sebenarnya, dan gunakan dua secret acak berbeda minimal 32 karakter. Jangan menaruh secret dalam variabel `VITE_*`, source code, atau log. Setelah pembaruan format token ini, sesi lama harus login ulang; database tidak perlu di-reset.

Frontend yang disajikan langsung oleh Express mendapat Helmet. Untuk frontend Vercel yang terpisah, deploy konfigurasi `vercel.json` lalu verifikasi header respons di domain sebenarnya. Jika menggunakan hosting lain, terapkan header yang setara pada server frontend. Vite adalah server pengembangan, bukan server produksi.

`TRUST_PROXY` hanya boleh memuat IP/subnet proxy yang benar-benar dipercaya. Jangan memakai trust-all: pemalsuan forwarding header dapat melewati pembatasan IP. Pada deployment multi-instance/serverless, ganti penyimpanan rate limit in-memory dengan shared store atau gunakan rate limit pada gateway/WAF; kuota saat ini berlaku per proses dan hilang ketika proses restart.

## Batas perlindungan dan operasi

Perubahan ini memperkuat aplikasi, bukan sertifikasi atau jaminan kebal serangan. HTTPS/TLS, firewall/WAF, perlindungan DDoS, backup database, monitoring, dan kebijakan akses produksi harus dikonfigurasi di infrastruktur. Tidak ada deployment atau perubahan firewall eksternal yang dilakukan oleh perubahan kode ini.

Token browser saat ini tetap berada di `sessionStorage`; CSP mengurangi risiko XSS, tetapi kode JavaScript berbahaya yang berhasil berjalan di origin yang sama masih dapat membacanya. Aplikasi memakai bearer token eksplisit, bukan cookie autentikasi. Migrasi ke cookie HttpOnly memerlukan rancangan CSRF dan penyesuaian klien tersendiri. MFA dan penguncian akun lintas-IP belum diterapkan.

Akun demo hanya simulasi lokal dan tidak memberikan hak akses PostgreSQL. Data nyata tetap memerlukan login backend dan izin peran/lokasi. Batasi hak pengguna database, pantau kegagalan login, dan perbarui dependensi secara rutin.

Referensi: [panduan keamanan Express](https://expressjs.com/en/advanced/best-practice-security/), [konfigurasi header Vercel](https://vercel.com/docs/project-configuration/vercel-json).
