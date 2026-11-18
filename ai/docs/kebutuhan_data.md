# Integrasi Inference API dengan Backend

**Untuk:** tim web (Arip, Reyhan, Trian)
**Dari:** Lalu Abiyu Tsani (AI: Machine Learning dan Generative AI)
**Dicek terhadap:** repo `zevario/gymnasium-smart-followup`, commit `3a95e87` (17 November 2026)

## 1. Ringkasnya: backend tidak perlu diubah

Sejak v0.5, model dilatih dengan **8 fitur yang sama persis** dengan yang sudah dihitung `collectFeatures()` di `backend/src/modules/predictions/prediction.repository.js`, dan API membalas dengan **format yang sama persis** dengan yang diperiksa `askModel()` di `prediction.service.js`. Jadi cara menyambungkannya:

1. Jalankan API model dari folder `ai/`: `uvicorn api.app:app --port 8000`
2. Isi `INFERENCE_API_URL=http://127.0.0.1:8000` di `backend/.env`, lalu restart backend.

Penjadwal reminder akan memanggil `POST /predict` setiap siklus. Hasilnya disimpan di `prediction_logs` dengan `source = 'model'` dan `model_version` dari API, lalu dipakai untuk mengurutkan daftar reminder (High → Medium → Low). Jika API mati, lambat (lebih dari `INFERENCE_TIMEOUT_MS`), atau jawabannya tidak sesuai kontrak, backend otomatis memakai `baselinePriority()` dengan `source = 'baseline'`.

Sudah diuji end-to-end pada 17 November 2026: `classifyActiveCustomers()` milik backend dijalankan terhadap database website (data demo + paket aktif). Ke-27 customer diterima dengan `source = 'model'` dan versi `random_forest-v0.5-5ba8507c`.

## 2. Kontrak API

`POST /predict` (1–1000 customer per request; backend mengirim maksimal 500):

```json
{"customers": [{
  "customerId": "3acdbcce-4d9b-4f56-a59f-1d7512752434",
  "visits30Days": 0, "daysSinceLastVisit": null, "attendanceRatio": 0,
  "reschedules": 0, "noResponses": 2, "responseRatio": 0,
  "remainingSessions": 12, "daysToExpiry": 2
}]}
```

Respons (urutan sama dengan request):

```json
{"modelVersion": "random_forest-v0.5-5ba8507c", "syntheticTraining": true,
 "predictions": [{"customerId": "3acdbcce-4d9b-4f56-a59f-1d7512752434",
   "priority": "high", "score": 0.851,
   "probabilities": {"high": 0.851, "low": 0.0, "medium": 0.149}}]}
```

- `priority`: `low` / `medium` / `high`, sama dengan check constraint `prediction_logs.priority`.
- `score`: peluang kelas terpilih (0–1), **bukan** peluang customer memperpanjang. Belum dikalibrasi dengan data nyata.
- `null` boleh untuk `daysSinceLastVisit`, `attendanceRatio`, `responseRatio`, `remainingSessions`, dan `daysToExpiry`, sesuai yang memang bisa dikirim backend. Model mengisinya dengan median data latih.
- Kolom tambahan diabaikan, jadi menambah kolom di backend tidak membuat batch gagal.
- Ditolak dengan **422**: hitungan negatif, rasio di luar 0–1, kolom wajib hilang, `customerId` ganda dalam satu batch, atau list kosong. Backend akan memakai baseline untuk batch itu.

`GET /health` → `status`, `model`, `modelVersion`, daftar `features`, `classes`, dan `syntheticTraining`.

## 3. Hal yang perlu diketahui tim web

- **Data demo (`npm run seed:demo`) belum mengisi `customer_packages`.** Tanpa paket aktif, `remainingSessions` dan `daysToExpiry` selalu `null`. Model tetap bekerja, tetapi untuk demo sebaiknya beberapa customer diberi paket lewat menu Paket.
- Model dan baseline sama-sama menulis ke `prediction_logs`, sehingga keduanya bisa dibandingkan dari kolom `source`.
- Pipeline Node.js di `backend/ml` (port 8001) tetap berfungsi sebagai alternatif. Model ini menggantikannya sebagai model utama, karena dievaluasi dengan validasi silang per customer, interval kepercayaan, dan pembanding baseline sesuai Project Plan. Lihat `README.md` dan `docs/evaluasi_model.md`.
