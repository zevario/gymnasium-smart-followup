# AI: Prioritas Follow-up Customer (Low / Medium / High)

Bagian AI Capstone DB15-G007 (Smart Reminder & Follow-up, Gymnasyum). PIC: Lalu Abiyu Tsani (Machine Learning dan Generative AI).

**Versi 0.5:** model dilatih dengan **8 fitur yang sama persis dengan yang dihitung backend website**, dan API membalas dengan **format yang sama persis dengan yang diharapkan backend**. Backend tidak perlu diubah: cukup isi `INFERENCE_API_URL`. Integrasi sudah diuji end-to-end dengan kode backend asli (lihat [docs/kebutuhan_data.md](docs/kebutuhan_data.md)).

Aturan label dan fitur: [docs/aturan_label.md](docs/aturan_label.md). Asumsi simulasi data: [docs/asumsi_dataset.md](docs/asumsi_dataset.md). Versi lama (v0.2–v0.4) tidak disertakan di repo.

**Generative AI (draft pesan WhatsApp):** layanan yang sama menyediakan `POST /draft`. Google Gemini menyusun kalimat dari fakta terstruktur, kode memeriksa bahwa angka dan tanggal di draft berasal dari fakta (plus larangan harga, promo, tautan, dan waktu relatif), dan template dipakai bila Gemini gagal. Kunci disimpan di `ai/.env` (`GEMINI_API_KEY`, `GEMINI_MODEL`). Backend tersambung lewat `DRAFT_API_URL` (PR #8). Detail prompt, guardrail, dan contoh draft asli: [docs/prompt_engineering.md](docs/prompt_engineering.md).

## Cara menjalankan (urut, dari folder ini)

```bash
.venv\Scripts\activate                     # atau: python -m venv .venv lalu pip install -r requirements.txt
python src/generate_data.py                # 1. data sintetis -> data/raw/*.csv
python src/train.py                        # 2. EDA + baseline + model + evaluasi
python -m unittest tests/test_ml.py -v     # 3. tes kontrak API
uvicorn api.app:app --port 8000            # 4. inference API -> http://localhost:8000/docs
```

Lalu di backend website: isi `INFERENCE_API_URL=http://127.0.0.1:8000` di `backend/.env` dan restart backend.

| File | Isi |
|---|---|
| `src/generate_data.py` | Simulasi customer, paket bersesi, booking, kehadiran, reminder + label |
| `src/train.py` | EDA, split per customer, baseline, 3 kandidat model, evaluasi, simpan model |
| `api/app.py` | Inference API (FastAPI) dengan kontrak backend |
| `tests/test_ml.py` | Tes kontrak API (bentuk respons, `null`, validasi, urutan) |
| `docs/eda.md`, `docs/evaluasi_model.md` | Laporan yang dibuat otomatis oleh `train.py` |
| `models/priority_model.joblib` | Pipeline siap pakai (imputasi median + indikator kosong + model) |
| `models/metrics.json` | Angka evaluasi dan versi model |

## Metode

- **Fitur (8), sama dengan `collectFeatures()` di backend:** `visits30Days`, `daysSinceLastVisit`, `attendanceRatio`, `reschedules`, `noResponses`, `responseRatio`, `remainingSessions`, `daysToExpiry`. Definisi dan arti `null` ada di aturan label bagian 3.
- **Simulasi mengikuti website terbaru:** 6 paket bersesi dari tabel `packages`, sesi berkurang saat hadir, paket reguler berlaku sejak sesi pertama, reminder jadwal 24 jam, pengingat paket H-7, dan No Response setelah 48 jam.
- **Split per customer.** Satu customer bisa punya 1–3 baris (tanggal acuan berbeda). 15% customer dipisah sebagai test dengan `StratifiedGroupKFold`, jadi customer yang sama tidak pernah muncul di train dan test sekaligus.
- **Imputasi di dalam Pipeline.** Nilai `null` diisi median train, ditambah indikator "kosong". Imputer hanya di-fit pada data train.
- **Pemilihan model dengan 5-fold cross-validation per customer** pada 85% data sisanya. Kandidatnya Logistic Regression, Random Forest, dan HistGradientBoosting (semua `class_weight="balanced"`), dipilih berdasarkan rata-rata macro F1. Test set hanya dipakai sekali di akhir.
- **Ketidakpastian:** 95% CI metrik test dengan bootstrap per customer (1000 kali).
- **Baseline:** kelas terbanyak, decision tree 2 tingkat (pembanding "cara sederhana" yang jujur), dan `baselinePriority()` milik backend (aturan yang dipakai website saat model tidak tersedia).

| CV 5-fold (rata-rata ± std) | Accuracy | Macro F1 | Recall High |
|---|---|---|---|
| Logistic Regression | 0,827 ± 0,018 | 0,816 ± 0,019 | **0,885 ± 0,013** |
| **Random Forest (terpilih)** | **0,875 ± 0,012** | **0,863 ± 0,015** | 0,875 ± 0,020 |
| HistGradientBoosting | 0,873 ± 0,012 | 0,859 ± 0,010 | 0,833 ± 0,036 |

## Hasil (test set: 508 baris dari customer yang belum pernah dilihat model)

| Model | Accuracy | Macro F1 | Recall High |
|---|---|---|---|
| Baseline kelas terbanyak | 0,490 | 0,219 | 0,000 |
| Aturan backend (`baselinePriority`) | 0,374 | 0,373 | 0,952 |
| Baseline decision tree 2 tingkat | 0,661 | 0,590 | 0,690 |
| **Random Forest (terpilih)** | **0,902** | **0,896** | **0,869** |
| *95% CI model (bootstrap)* | *0,876–0,927* | *0,867–0,922* | *0,793–0,938* |
| *Referensi: aturan poin tanpa noise* | *0,941* | *0,941* | *0,964* |

- **Target ≥75% tercapai,** dan batas bawah CI akurasi (87,6%) pun jauh di atas target.
- **Model lebih baik dari baseline sederhana yang jujur:** akurasi naik 24 poin dari decision tree 2 tingkat.
- **Aturan backend** menangkap hampir semua customer High (recall 0,95), tetapi dengan menandai terlalu banyak customer lain sebagai High atau Medium, sehingga akurasinya hanya 37%. Admin tetap harus menghubungi sebagian besar customer.
- **Akurasi model = 96% dari batas atas.** Label berasal dari aturan poin, lalu ~6,5% digeser. Angka ini mengukur seberapa baik model meniru aturan poin tim, **bukan** perilaku customer nyata.
- **Fitur paling berpengaruh** (permutation importance): `responseRatio`, `daysSinceLastVisit`, `attendanceRatio`. Lihat `docs/evaluasi_model.md`.
- **Uji integrasi:** `classifyActiveCustomers()` milik backend dijalankan terhadap database website (27 customer demo, 21 di antaranya dengan paket aktif). Semua prediksi diterima dengan `source = 'model'`.
- **Keterbatasan:** data sintetis, jadi model perlu dilatih ulang setelah ada data nyata. Fitur kehadiran dan respons di backend dihitung sepanjang waktu, sehingga customer lama cenderung punya hitungan lebih besar.

## Kontrak Inference API

Sama dengan yang dipakai `askModel()` di `backend/src/modules/predictions/prediction.service.js`. Detail lengkap ada di [docs/kebutuhan_data.md](docs/kebutuhan_data.md).

`POST /predict` → `{"customers": [{customerId, visits30Days, daysSinceLastVisit, attendanceRatio, reschedules, noResponses, responseRatio, remainingSessions, daysToExpiry}]}`

Respons → `{"modelVersion", "syntheticTraining": true, "predictions": [{customerId, priority, score, probabilities}]}`, dengan `priority` bernilai `low`/`medium`/`high`. Input tidak valid ditolak dengan 422, dan backend lalu memakai baseline.

`GET /health` → status, nama dan versi model, daftar fitur, kelas.
