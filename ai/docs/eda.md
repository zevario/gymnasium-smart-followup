# EDA priority_dataset.csv

Baris: 3549 | customer unik: 1200 | baris per customer: 1–3

## Distribusi kelas

| label   |   jumlah |   proporsi |
|:--------|---------:|-----------:|
| Low     |     1740 |      0.49  |
| Medium  |     1222 |      0.344 |
| High    |      587 |      0.165 |

## Nilai kosong

|                    |   kosong |
|:-------------------|---------:|
| visits30Days       |        0 |
| daysSinceLastVisit |      203 |
| attendanceRatio    |       17 |
| reschedules        |        0 |
| noResponses        |        0 |
| responseRatio      |       14 |
| remainingSessions  |     1109 |
| daysToExpiry       |     1449 |

## Rata-rata fitur per kelas

|                    |   Low |   Medium |   High |
|:-------------------|------:|---------:|-------:|
| visits30Days       |  5.93 |     3.19 |   1.1  |
| daysSinceLastVisit |  4.14 |    10.65 |  23.97 |
| attendanceRatio    |  0.89 |     0.7  |   0.39 |
| reschedules        |  0.82 |     1.32 |   1.6  |
| noResponses        |  2.45 |     4.68 |   5.74 |
| responseRatio      |  0.81 |     0.55 |   0.26 |
| remainingSessions  |  4.4  |     4.59 |   5.08 |
| daysToExpiry       | 33.43 |    26.22 |  13.39 |

## Distribusi kelas per kategori paket aktif (metadata, bukan fitur)

| package_category   |   Low |   Medium |   High |
|:-------------------|------:|---------:|-------:|
| group_class        |  0.62 |     0.28 |   0.1  |
| open_gym           |  0.51 |     0.34 |   0.14 |
| personal_training  |  0.59 |     0.3  |   0.11 |
| tanpa paket aktif  |  0.27 |     0.46 |   0.27 |
| trial              |  0    |     0.22 |   0.78 |
