# Klasifikasi prioritas follow-up

Pipeline Node.js tanpa dependensi ML tambahan: dataset sintetis → pelatihan regresi logistik multikelas → artefak JSON → HTTP inference. Tidak memakai data pribadi atau mengubah data customer saat pelatihan.

## Menjalankan

Dari akar proyek setelah dependensi backend terpasang:

```sh
npm run ml:prepare  # generate 6.000 baris dan latih ulang model
npm run test:ml
npm run ml:serve    # 127.0.0.1:8001
```

Di terminal lain, isi `INFERENCE_API_URL=http://127.0.0.1:8001` di `backend/.env`, lalu jalankan/restart `npm start`. `INFERENCE_PORT` mengganti port layanan; sesuaikan URL backend juga. Layanan inference hanya mendengarkan loopback, bukan internet publik. Model dimuat saat startup; restart layanan setelah melatih ulang.

Backend mengumpulkan delapan fitur customer aktif dengan izin kontak, memanggil `/predict` dalam batch maksimal 500 baris, lalu menyimpan sumber, versi, skor, dan fitur pada `prediction_logs`. Jika endpoint kosong, timeout, atau respons tidak valid, seluruh pekerjaan memakai baseline. Siklus ini dijalankan oleh penjadwal reminder yang sudah ada. Klasifikasi tidak mengirim pesan otomatis dan tidak menggantikan aturan izin kontak.

## Dataset dan model

- `data/synthetic-customers.jsonl`: 6.000 record, ID sintetis, delapan fitur dan label `priority`.
- `data/metadata.json`: seed, distribusi kelas, dan asal label.
- `generate.js`: generator deterministik, seed 20261117. Label berasal dari kebijakan hipotetis urgensi masa berlaku, aktivitas, respons, dan noise; bukan hasil observasi pembelian.
- `train.js`: split stratified 70%/15%/15%, seed 42. Median imputasi dan standardisasi dihitung hanya dari train. Indikator missing ditambahkan untuk setiap fitur. Gradient descent melatih softmax dengan regularisasi L2; checkpoint dipilih berdasarkan log-loss validation, bukan test.
- `artifacts/priority-model.json`: bobot, preprocessing, versi dan SHA-256 dataset. Tidak membutuhkan training saat inference.
- `artifacts/evaluation.json`: accuracy, macro-F1, precision/recall/F1 per kelas, confusion matrix (baris aktual, kolom prediksi), serta pembanding aturan baseline produksi dan kelas mayoritas.

Fitur: `visits30Days`, `daysSinceLastVisit`, `attendanceRatio`, `reschedules`, `noResponses`, `responseRatio`, `remainingSessions`, `daysToExpiry`. Rasio berada pada [0,1]; nilai tidak diketahui memakai `null`. Jumlah kunjungan, reschedule dan tidak merespons wajib berupa bilangan bulat nonnegatif. Days-to-expiry boleh negatif untuk paket kedaluwarsa. Tidak ada usia, gender, alamat, harga paket, atau ID customer sebagai input numerik model.

Label: `low`, `medium`, `high`. `score` adalah probabilitas kelas terpilih, **bukan probabilitas perpanjangan**. Probabilitas belum dikalibrasi pada data nyata.

## Kontrak API

`GET /health` memberikan status, versi model, daftar fitur, kelas, dan penanda training sintetis.

```sh
curl http://127.0.0.1:8001/predict \
  -H 'Content-Type: application/json' \
  -d '{"customers":[{"customerId":"example-1","visits30Days":4,"daysSinceLastVisit":12,"attendanceRatio":0.8,"reschedules":1,"noResponses":0,"responseRatio":0.75,"remainingSessions":5,"daysToExpiry":10}]}'
```

Respons berisi `modelVersion`, `syntheticTraining: true`, dan `predictions` dengan `customerId`, `priority`, `score`, serta probabilitas semua kelas. ID harus unik dalam batch. API menolak fitur tambahan, nilai hilang tanpa `null`, tipe/rentang salah, batch kosong atau >500 baris dengan HTTP 400; body >1 MB dengan 413. Pembatasan permintaan menghasilkan 429.

## Batas interpretasi

Evaluasi hanya menunjukkan kemampuan meniru kebijakan label sintetis. Pembanding baseline tidak ditujukan untuk membuktikan model lebih baik pada customer nyata. Dataset tidak menyimulasikan semua hubungan temporal atau perilaku operasional. Sebelum memakai model untuk keputusan nyata, kumpulkan label yang disepakati, evaluasi dengan pemisahan waktu/customer, ukur kalibrasi dan distribusi fitur, serta bandingkan baseline pada data tersebut. Versi ini merupakan prototipe eksperimen yang dapat direproduksi.
