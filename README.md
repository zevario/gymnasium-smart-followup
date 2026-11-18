# Gymnasyum Smart Follow-up

Sistem pengingat dan follow-up member untuk Gymnasyum Bintaro. Proyek Capstone DB15-G007 (Smart Reminder & Follow-up).

Staf melihat member mana yang perlu dihubungi lebih dulu, menerima draft pesan WhatsApp yang disusun AI, lalu mencatat hasilnya. Member memakai portal sendiri untuk mengajukan trial, paket, dan reservasi.

## Fitur utama

- **Prioritas follow-up dengan Machine Learning.** Model Random Forest memberi prioritas Low / Medium / High dari 8 fitur kehadiran, respons, dan paket. Bila layanan AI mati, website memakai aturan cadangan dan menandai sumbernya.
- **Draft pesan dengan Generative AI.** Google Gemini menyusun draft dari fakta terstruktur. Kode memeriksa bahwa angka dan tanggal berasal dari fakta, menolak harga/promo/tautan, dan memakai template bila Gemini gagal. Pesan selalu ditinjau staf sebelum dikirim.
- **Pengingat otomatis.** Penjadwal membuat pengingat kelas 24 jam sebelumnya, pengingat paket H-7, dan menandai pesan tanpa balasan setelah 48 jam.
- **Follow-up trial dan perpanjangan** dengan antrean prioritas, tenggat, PIC, dan riwayat aktivitas.
- **Portal customer**: registrasi dengan aktivasi email, pengajuan trial/paket/reservasi, jadwal, dan notifikasi.
- **Laporan** konversi per siklus trial dan perpanjangan.

## Arsitektur

```
Browser ──► backend (Express, port 3001) ──► PostgreSQL
              │  melayani frontend React (frontend/dist) dan API
              │
              ├─► layanan AI (FastAPI, port 8000)
              │     POST /predict  prioritas Low/Medium/High (scikit-learn)
              │     POST /draft    draft pesan (Google Gemini + template)
              └─► SMTP (email akun)
```

| Folder         | Isi                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `frontend/`    | React + Vite. Struktur folder dijelaskan di [frontend/README.md](frontend/README.md).                  |
| `backend/`     | Express + PostgreSQL (node-pg-migrate): API, penjadwal pengingat, email, portal member.                |
| `ai/`          | Model prioritas dan draft Gemini (Python). Metode, evaluasi, dan prompt: [ai/README.md](ai/README.md). |
| `backend/ml/`  | Model alternatif berbasis Node (regresi logistik, port 8001). Model utama ada di `ai/`.                |
| `scripts/mac/` | Script klik-ganda untuk macOS (membuka aplikasi, menghubungkan Gmail, diagnosa database).              |

## Menjalankan secara lokal

Kebutuhan: Node.js, PostgreSQL, dan Python 3 (untuk layanan AI).

1. **Pasang dependensi**
   ```bash
   npm ci && npm ci --prefix backend && npm ci --prefix frontend
   ```
2. **Konfigurasi.** Salin `backend/.env.example` menjadi `backend/.env`, lalu isi koneksi PostgreSQL, `JWT_*_SECRET`, akun `ADMIN_*` dan `SPV_*`, serta:
   ```
   INFERENCE_API_URL=http://127.0.0.1:8000
   DRAFT_API_URL=http://127.0.0.1:8000
   ```
   Kunci Gemini disimpan di `ai/.env` (`GEMINI_API_KEY`). File `.env` tidak pernah di-commit.
3. **Database dan data demo**

   ```bash
   npm run db:migrate
   npm --prefix backend run seed:admin
   npm --prefix backend run seed:spv
   npm --prefix backend run seed:ai-demo
   ```

   `seed:ai-demo` mengisi 12 customer fiktif (`@example.com`) yang membuat model memberi campuran Low, Medium, dan High, beserta paket, pengingat, tugas follow-up, riwayat untuk Laporan, dan akun portal customer yang sudah aktif (bila `DEMO_CUSTOMER_PASSWORD` diisi). Jalankan hanya di database demo atau lokal.

   Untuk demo, keempat langkah di atas bisa diganti satu perintah yang membuat ulang database dari nol. Perintah ini hanya berjalan bila nama database (`PGDATABASE`) mengandung kata "demo", misalnya `gymnasyum_demo`:

   ```bash
   npm --prefix backend run demo:reset
   ```

4. **Layanan AI** (jalankan lebih dulu dari backend)
   ```bash
   cd ai
   python -m venv .venv && .venv/Scripts/activate   # macOS/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn api.app:app --port 8000
   ```
5. **Aplikasi**
   ```bash
   npm start
   ```
   Perintah ini membangun frontend lalu menjalankan backend di http://127.0.0.1:3001. Masuk dengan akun supervisor untuk fitur operasional; akun admin untuk pengelolaan akun.

## Pemeriksaan kode

```bash
npm run check                                   # format, lint, tes backend, build frontend
cd ai && python -m unittest tests/test_ml.py tests/test_genai.py -v
```

## Keterbatasan

- **Model dilatih dengan data sintetis.** Data latih dibangkitkan dari simulasi yang meniru alur website ([ai/docs/asumsi_dataset.md](ai/docs/asumsi_dataset.md)), dan labelnya berasal dari aturan poin tim. Akurasi uji 0,902 mengukur seberapa baik model meniru aturan itu, bukan perilaku member sungguhan. Model perlu dilatih ulang setelah ada data asli.
- **Fitur kehadiran dan respons dihitung sepanjang masa keanggotaan**, sehingga member lama cenderung memiliki hitungan absen dan tanpa-balasan yang lebih besar.
- **Dua jenis prioritas.** Skor di Dashboard dan Semua follow-up dihitung dari aturan tenggat dan minat siklus trial/perpanjangan. Prioritas model ditampilkan sebagai lencana "AI" di samping skor itu dan di halaman Pengingat, tetapi tidak mengubah urutan antrean.
- **Akun yang mendaftar lewat portal belum terhubung ke data customer**, sehingga belum mendapat prediksi model.
- **Belum ada halaman staf untuk membuat jadwal dan mencatat absensi.** API-nya tersedia (`/api/schedules`, `/api/attendances`); data kehadiran demo diisi lewat seed.
- **Generative AI memakai Gemini versi gratis.** Jangan kirim data member asli; draft selalu ditinjau staf, dan template dipakai bila Gemini gagal atau draft tidak lolos pemeriksaan.
- **Hanya diuji secara lokal.** Aplikasi tidak di-deploy; fitur email membutuhkan konfigurasi SMTP di `backend/.env`.

## Tim

Capstone DB15-G007.

| Nama               | Peran                                                    |
| ------------------ | -------------------------------------------------------- |
| Lalu Abiyu Tsani   | Machine Learning, Generative AI, integrasi website ↔ AI |
| _(dilengkapi tim)_ | _(dilengkapi tim)_                                       |
