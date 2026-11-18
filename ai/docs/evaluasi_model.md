# Evaluasi model prioritas follow-up

Dibuat otomatis oleh `src/train.py`.

Split per customer (StratifiedGroupKFold): train+val 3041 / test 508 baris. Tidak ada customer yang muncul di train dan test sekaligus.

## Pemilihan model (5-fold CV per customer, rata-rata ± std)

|                        | accuracy      | macro_f1      | recall_high   |
|:-----------------------|:--------------|:--------------|:--------------|
| logistic_regression    | 0.827 ± 0.018 | 0.816 ± 0.019 | 0.885 ± 0.013 |
| random_forest          | 0.875 ± 0.012 | 0.863 ± 0.015 | 0.875 ± 0.020 |
| hist_gradient_boosting | 0.873 ± 0.012 | 0.859 ± 0.010 | 0.833 ± 0.036 |

Model terpilih (macro F1 CV tertinggi): **random_forest**, lalu dilatih ulang dengan seluruh train+val.

## Hasil test set vs baseline

|                               |   accuracy |   macro_f1 |   recall_high |
|:------------------------------|-----------:|-----------:|--------------:|
| baseline_majority_class       |     0.4902 |     0.2193 |        0      |
| baseline_backend_rule         |     0.374  |     0.3728 |        0.9524 |
| baseline_decision_tree_depth2 |     0.6614 |     0.5898 |        0.6905 |
| random_forest                 |     0.9016 |     0.8961 |        0.869  |
| reference_label_rule_ceiling  |     0.9409 |     0.9405 |        0.9643 |

95% CI model (bootstrap per customer, 1000x): accuracy 0.876–0.927, macro_f1 0.867–0.922, recall_high 0.793–0.938

- `baseline_backend_rule`: `baselinePriority()` di backend tim (`prediction.service.js`), yang juga dipakai backend bila Inference API tidak tersedia. Ditampilkan sebagai kondisi saat ini.
- `baseline_decision_tree_depth2`: baseline sederhana yang jujur, maksimal 4 aturan if-else.
- `reference_label_rule_ceiling`: aturan poin itu sendiri (sebelum 5–8% label digeser). Bukan baseline, melainkan batas atas yang realistis, karena label = aturan + noise.

**Akurasi model = 96% dari batas atas.** Karena label dibuat dari aturan poin tim, angka ini mengukur seberapa baik model meniru aturan tersebut, bukan perilaku customer nyata.

Target akurasi >= 75%: **TERCAPAI**

## Classification report (test)

```
              precision    recall  f1-score   support

         Low       0.93      0.94      0.93       249
      Medium       0.85      0.87      0.86       175
        High       0.92      0.87      0.90        84

    accuracy                           0.90       508
   macro avg       0.90      0.89      0.90       508
weighted avg       0.90      0.90      0.90       508

```

## Confusion matrix (test)

|             |   prediksi Low |   prediksi Medium |   prediksi High |
|:------------|---------------:|------------------:|----------------:|
| asli Low    |            233 |                16 |               0 |
| asli Medium |             17 |               152 |               6 |
| asli High   |              0 |                11 |              73 |

## Permutation importance (penurunan macro F1 bila fitur diacak)

|                    |   importance |
|:-------------------|-------------:|
| responseRatio      |       0.2    |
| daysSinceLastVisit |       0.1556 |
| attendanceRatio    |       0.1459 |
| remainingSessions  |       0.0568 |
| visits30Days       |       0.051  |
| noResponses        |       0.0435 |
| daysToExpiry       |       0.0377 |
| reschedules        |       0.0209 |
