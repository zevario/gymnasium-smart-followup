# Prompt Engineering: Draft Pesan WhatsApp (Generative AI)

**Proyek:** Smart Reminder & Follow-up (Gymnasyum)
**Penyusun:** Lalu Abiyu Tsani (AI)
**Versi:** 1.0, 17 November 2026
**Kode:** `api/genai.py` (layanan), `tests/test_genai.py` (tes), backend website PR #8 (`DRAFT_API_URL`)

## 1. Tujuan dan prinsip

Generative AI menyusun **draft** pesan WhatsApp untuk petugas. Draft tidak pernah dikirim otomatis: petugas meninjau, boleh mengubah, lalu mengirim lewat WhatsApp resmi, sesuai Project Plan bagian C.

Tiga prinsip yang membentuk desain prompt:

1. **Model hanya menyusun kalimat; fakta datang dari database.** Nama, kelas, jam, paket, sisa sesi, dan tanggal dikirim terstruktur oleh backend. Model tidak diminta menghitung atau mengingat apa pun (mitigasi risiko 3: informasi jadwal keliru).
2. **Setiap draft diperiksa ulang oleh kode, bukan dipercaya begitu saja.** Draft yang memuat fakta di luar data ditolak.
3. **Selalu ada jawaban.** Bila Gemini tidak tersedia atau draft ditolak, layanan memakai template yang pasti benar (mitigasi risiko 4: ketergantungan LLM API).

## 2. Model dan konfigurasi

| Pengaturan | Nilai | Alasan |
|---|---|---|
| Penyedia | Google Gemini (REST `generateContent`, kuota gratis) | Disebut di Project Plan; gratis untuk demo. |
| Model | `gemini-3.5-flash-lite` (`GEMINI_MODEL`) | `gemini-2.5-flash` sudah ditutup untuk pengguna baru, dan `gemini-3.8-flash` sering membalas 503 "high demand" saat diuji. Model lite tersedia, cepat, dan cukup untuk pesan 2–3 kalimat. |
| Temperature | 0,6 | Cukup bervariasi agar pesan tidak kaku, tetapi tetap patuh aturan. |
| Batas waktu | 12 detik di layanan, 15 detik di backend | Latensi kuota gratis terukur 2–14 detik. |
| Cache | 512 draft terakhir (fakta identik → draft sama) | Menghemat kuota; sesuai mitigasi "menyimpan draf yang sudah dibuat". |

Kunci API disimpan di `ai/.env` (tidak di-commit; contoh pengaturan di `ai/.env.example`). Catatan: pada kuota gratis, data yang dikirim dapat dipakai Google untuk meningkatkan layanan. Karena itu hanya data sintetis/demo yang boleh dikirim; untuk data customer asli gunakan paket berbayar.

## 3. Masukan (fakta terstruktur)

| Field | Sumber di website | Dipakai untuk |
|---|---|---|
| `kind` | jenis reminder / tujuan follow-up | `schedule_reminder`, `package_reminder`, `followup_trial`, `followup_renewal` |
| `customerName` | `customers.name` | sapaan "Kak …" |
| `priority` | `prediction_logs.priority` (model prioritas) | **nada** pesan, tidak pernah disebut |
| `className`, `classStartsAt` | `schedules.title`, `schedules.starts_at` | pengingat jadwal |
| `packageName`, `remainingSessions`, `expiresAt` | `packages.name`, sisa sesi, `customer_packages.expires_at` | pengingat paket dan perpanjangan |
| `trialDate` | tanggal trial | follow-up trial |

Tanggal dan jam diubah dulu ke bahasa Indonesia dan WIB oleh kode (contoh: "Jumat, 20 November 2026 pukul 08.00 WIB"), sehingga model tidak perlu mengonversi zona waktu atau nama hari.

## 4. Prompt

### 4.1 System instruction (sama untuk semua pesan)

```
Kamu membantu petugas front desk Gymnasyum Bintaro (gym dan private coaching untuk ibu-ibu,
lansia, dan segmen menengah ke atas) menyusun draft pesan WhatsApp. Petugas akan meninjau
draft sebelum mengirim.
Aturan:
1. Bahasa Indonesia yang sopan dan hangat, sapa dengan 'Kak' diikuti nama customer.
2. Pakai HANYA fakta yang diberikan. Jangan menambah tanggal, jam, angka, harga, promo,
   diskon, tautan, atau nomor telepon.
3. Jangan memberi saran medis atau program latihan, dan jangan menyebut prioritas, skor, atau AI.
4. Jangan memakai keterangan waktu relatif seperti kemarin, tadi, lusa, minggu lalu, atau
   bulan lalu; sebut tanggal dari fakta. Kata 'besok' hanya untuk pengingat jadwal kelas.
5. Maksimal 3 kalimat dan 400 karakter, paling banyak satu emoji.
6. Balas HANYA dengan isi pesan, tanpa pembuka, tanda kutip, atau penjelasan.
```

Segmen pelanggan disebut untuk gaya bahasa (sopan, hangat), **bukan** untuk menentukan isi atau prioritas, sesuai batasan persona di Project Plan.

### 4.2 Pesan user (dibangun per draft)

```
Tujuan pesan: <tujuan sesuai kind>
Nada: <nada sesuai priority>
Fakta:
- nama customer: Rina Pramesti
- lokasi: Gymnasyum Bintaro
- kelas: Group Class Regular
- jadwal kelas: Jumat, 20 November 2026 pukul 08.00 WIB
```

| `kind` | Tujuan pesan |
|---|---|
| `schedule_reminder` | Ingatkan jadwal kelas besok dan minta konfirmasi kehadiran. Tawarkan bantuan menjadwal ulang bila berhalangan. |
| `package_reminder` | Beri tahu bahwa paket akan segera berakhir sementara masih ada sisa sesi, lalu tawarkan bantuan menjadwalkan sesi yang tersisa. |
| `followup_trial` | Ucapkan terima kasih sudah mencoba trial dengan menyebut tanggal trial dari fakta, tanyakan pengalamannya, lalu tawarkan bantuan bila ingin melanjutkan latihan. |
| `followup_renewal` | Beri tahu tanggal paket berakhir dan tawarkan bantuan bila ingin melanjutkan. |

| `priority` | Nada |
|---|---|
| `high` | Customer perlu perhatian lebih: buat lebih personal dan tawarkan bantuan secara aktif. |
| `medium` / kosong | Nada ramah dan biasa. |
| `low` | Cukup pengingat singkat dan ringan. |

## 5. Pemeriksaan draft (guardrail)

Setiap draft dari Gemini diperiksa kode (`check()`); bila gagal, draft ditolak:

| Pemeriksaan | Kasus yang dicegah |
|---|---|
| Panjang 1–480 karakter | Pesan kosong atau melebihi batas 500 karakter backend. |
| Nama depan customer disebut | Salah sapa atau pesan generik. |
| Tidak ada harga/rupiah, promo/diskon, tautan, nomor telepon | Janji komersial atau tautan yang tidak disetujui. |
| **Setiap angka di draft harus ada di fakta** | Jam, tanggal, atau jumlah sesi karangan (contoh: 08.00 menjadi 09.30). |
| Tidak ada waktu relatif (kemarin, tadi, lusa, minggu lalu, …); "besok" hanya di pengingat jadwal | "Latihan kemarin" untuk trial yang sudah seminggu lalu. |

Bila draft ditolak, Gemini diberi **satu kali kesempatan perbaikan**: prompt yang sama ditambah "Draft sebelumnya ditolak karena <alasan>. Tulis ulang dengan mematuhi semua aturan." Bila masih ditolak, layanan memakai template dan mengisi `reason` dengan alasannya.

## 6. Template cadangan

Template hanya merangkai fakta, jadi selalu lolos pemeriksaan (diuji di `test_every_kind_has_a_template`). Contoh `schedule_reminder`:

> Halo Kak Rina Pramesti, kami dari Gymnasyum Bintaro. Mengingatkan kelas Group Class Regular pada Jumat, 20 November 2026 pukul 08.00 WIB. Mohon konfirmasi kehadirannya ya, dan kabari kami bila perlu menjadwal ulang.

Template dipakai bila: kunci belum diisi, Gemini error/kuota habis (429)/sibuk (503)/lewat batas waktu, atau draft ditolak dua kali. Respons selalu menyebut `source` (`gemini` atau `template`) dan `reason`, sehingga website bisa menampilkan label "AI · Gemini" atau "Template".

## 7. Hasil pengujian dengan Gemini asli (17 November 2026)

Contoh draft yang **lolos** pemeriksaan (apa adanya dari model):

| Jenis / prioritas | Draft Gemini |
|---|---|
| Pengingat jadwal / high | Halo Kak Rina Pramesti, semoga Kakak sehat selalu ya. Mengingatkan jadwal kelas Group Class Regular besok, Jumat, 20 November 2026 pukul 08.00 WIB di Gymnasyum Bintaro. Mohon konfirmasi kehadiran Kakak, dan beri tahu kami jika butuh bantuan untuk menjadwal ulang ya 😊 |
| Pengingat jadwal / low | Halo Kak Sari Lestari, mau mengingatkan jadwal kelas Open Gym di Gymnasyum Bintaro besok, Sabtu, 21 November 2026 pukul 17.30 WIB ya. Mohon konfirmasi kehadirannya, dan beri tahu kami jika berhalangan agar bisa dibantu penjadwalan ulang. 😊 |
| Pengingat paket / medium | Halo Kak Dimas Saputra, paket Open Gym 4 Sesi Kakak di Gymnasyum Bintaro akan berakhir pada Selasa, 24 November 2026 dan masih ada sisa dua sesi lagi. Apakah Kakak ingin dibantu menjadwalkan sisa sesi tersebut? 😊 |
| Follow-up perpanjangan / high | Halo Kak Bagas Wicaksono, paket Group Class Regular 8 Sesi di Gymnasyum Bintaro akan berakhir pada Minggu, 22 November 2026. Apakah Kak Bagas ingin dibantu untuk melanjutkan paketnya agar aktivitas olahraga tetap terjaga? 😊 |
| Follow-up trial / low | Halo Kak Sari Lestari, terima kasih sudah mencoba trial Personal Training Junior Coach di Gymnasyum Bintaro pada hari Kamis, 12 November 2026. Bagaimana pengalaman Kakak selama sesi latihan tersebut? Jika Kakak ingin melanjutkan latihan, saya siap membantu ya 😊 |

Pengamatan:

- **Fakta selalu benar** pada draft yang lolos: nama, kelas, tanggal, jam WIB, paket, dan sisa sesi sama dengan data.
- **Nada mengikuti prioritas:** prioritas tinggi lebih personal ("semoga Kakak sehat selalu") dan menawarkan bantuan; prioritas rendah lebih singkat.
- **Kesalahan yang tertangkap guardrail:** pada follow-up trial, Gemini cukup sering menulis "pengalaman latihan **kemarin**" (2 dari 4 percobaan, walau sudah dilarang dan diberi satu kali perbaikan). Draft itu ditolak dan diganti template yang benar.
- **Ketersediaan:** pada hari pengujian, model Flash utama membalas 503 "high demand", dan latensi model lite 2–14 detik. Jalur template menjaga fitur tetap berjalan.

Tes otomatis (`tests/test_genai.py`, Gemini disimulasikan): 14 tes, mencakup draft valid, angka karangan, promo, nama hilang, waktu relatif, satu kali perbaikan, error jaringan, cache, isi prompt, template semua jenis, dan bentuk respons endpoint.

## 8. Keterbatasan dan pengembangan

- Pemeriksaan angka tidak menangkap semua kesalahan makna (misalnya "dua sesi" ditulis sebagai kata). Petugas tetap wajib meninjau draft.
- Persona (ibu-ibu, lansia, menengah ke atas) belum disimpan di database website, jadi belum dipakai untuk gaya bahasa.
- Kuota gratis tidak menjamin ketersediaan saat demo. Siapkan template sebagai cadangan, atau jalankan ulang `python -m api.genai` sebelum demo untuk memastikan `source` bernilai `gemini`.
- Draft follow-up dibuat di dalam transaksi database di backend; menunggu Gemini sampai 15 detik mengunci baris tugas itu. Aman untuk demo, tetapi sebaiknya dipindah ke luar transaksi bila pengguna bertambah.

## 9. Cara mencoba

```bash
# di folder ai, setelah GEMINI_API_KEY diisi di ai/.env
python -m api.genai                         # status + satu contoh draft dari Gemini asli
python -m unittest tests/test_genai.py -v   # tes guardrail (tanpa internet)
uvicorn api.app:app --port 8000             # POST /draft, GET /health
```
