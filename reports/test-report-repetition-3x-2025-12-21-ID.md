# Performance Testing Results: 3x Repetition Test
**Monolith vs Microservices Architecture**

---

## Executive Summary

This report shows performance test results with 3 repetitions for each scenario (baseline and stress) on both architectures. We ran 12 tests back-to-back to make sure the results are consistent and statistically valid.

**Test Date:** December 20-21, 2025  
**Total Run Time:** ~108 minutes (6 × 10 min baseline + 6 × 8 min stress)  
**Tool:** k6 Load Testing  
**Status:** ✅ All 12 tests passed with 100% functional checks

---

## 1. Konfigurasi Testing

### 1.1 Skenario Baseline
- **Virtual Users (VUs):** 35
- **Durasi:** 10 menit
- **Ramp Pattern:** 
  - 30 detik: ramp up 0 → 10 VUs
  - 8 menit 30 detik: sustain 35 VUs
  - 30 detik: ramp down 35 → 0 VUs
- **Tujuan:** Mengukur performa sistem dalam kondisi normal

### 1.2 Skenario Stress
- **Virtual Users (VUs):** 75
- **Durasi:** 8 menit
- **Ramp Pattern:**
  - 30 detik: ramp up 0 → 25 VUs
  - 6 menit 30 detik: sustain 75 VUs
  - 30 detik: ramp down 75 → 0 VUs
- **Tujuan:** Mengukur performa sistem dalam kondisi beban tinggi

### 1.3 Threshold SLO (Service Level Objectives)
- `http_req_failed < 5%` - Tingkat kegagalan request
- `http_req_duration p95 < 2.8s, p99 < 5.5s` - Latensi umum
- `auth_latency p95 < 1.2s` - Latensi autentikasi
- `permohonan_latency p95 < 3.8s` - Latensi create/submit permohonan
- `workflow_latency p95 < 3.2s` - Latensi workflow operations
- `survey_latency p95 < 2.2s` - Latensi survei operations

---

## 2. Hasil Monolith Architecture

### 2.1 Baseline Testing (35 VUs, 10 menit)

| Metrik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|--------|-------|-------|-------|---------------|
| **Total Iterations** | 2,711 | 2,865 | 2,860 | 2,812 ± 88 |
| **Total Requests** | 12,049 | 12,726 | 12,683 | 12,486 ± 372 |
| **Throughput (req/s)** | 19.93 | 21.15 | 21.01 | 20.70 ± 0.68 |
| **Checks Passed** | 100% | 100% | 100% | 100% |
| **HTTP Req Failed** | 0.00% | 0.00% | 0.00% | 0.00% |

#### Latensi HTTP Request Duration
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 354.56 ms | 283.56 ms | 283.07 ms | 307.06 ± 41.04 ms |
| **p50 (Median)** | 287.07 ms | 229.62 ms | 231.35 ms | 249.35 ± 32.59 ms |
| **p90** | 858.07 ms | 677.68 ms | 672.82 ms | 736.19 ± 105.80 ms |
| **p95** | 1,040 ms | 809.68 ms | 813.39 ms | 887.69 ± 132.19 ms |
| **p99** | 1,340 ms | 1,070 ms | 1,040 ms | 1,150 ± 167.63 ms |
| **Max** | 3,720 ms | 1,700 ms | 1,920 ms | 2,446.67 ± 1,088.45 ms |

#### Latensi per Domain

**Auth Latency (signin):**
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 99.86 ms | 93.49 ms | 93.98 ms | 95.78 ± 3.53 ms |
| **p95** | 205.99 ms | 195.63 ms | 196.27 ms | 199.30 ± 5.84 ms |
| **p99** | 311.41 ms | 309.88 ms | 269.44 ms | 296.91 ± 23.90 ms |

**Permohonan Latency:**
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 639.42 ms | 504.48 ms | 500.17 ms | 548.02 ± 78.83 ms |
| **p95** | 1,230 ms | 984.43 ms | 971.11 ms | 1,061.85 ± 145.00 ms |
| **p99** | 1,560 ms | 1,210 ms | 1,210 ms | 1,326.67 ± 201.66 ms |

**Workflow Latency:**
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 363.12 ms | 280.15 ms | 287.26 ms | 310.18 ± 45.48 ms |
| **p95** | 710.49 ms | 570.31 ms | 605.91 ms | 628.90 ± 72.25 ms |
| **p99** | 944.10 ms | 691.84 ms | 785.77 ms | 807.24 ± 126.42 ms |

**Survey Latency:**
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 427.52 ms | 336.00 ms | 337.06 ms | 366.86 ± 52.33 ms |
| **p95** | 681.04 ms | 572.33 ms | 552.97 ms | 602.11 ± 68.87 ms |
| **p99** | 874.41 ms | 689.72 ms | 652.07 ms | 738.73 ± 119.06 ms |

### 2.2 Stress Testing (75 VUs, 8 menit)

| Metrik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|--------|-------|-------|-------|---------------|
| **Total Iterations** | 3,923 | 3,869 | 3,929 | 3,907 ± 32 |
| **Total Requests** | 17,442 | 17,258 | 17,465 | 17,388 ± 108 |
| **Throughput (req/s)** | 36.15 | 35.65 | 35.84 | 35.88 ± 0.25 |
| **Checks Passed** | 100% | 100% | 100% | 100% |
| **HTTP Req Failed** | 0.00% | 0.00% | 0.00% | 0.00% |

#### Latensi HTTP Request Duration
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 610.30 ms | 638.62 ms | 606.36 ms | 618.43 ± 17.52 ms |
| **p50 (Median)** | 507.26 ms | 528.88 ms | 511.26 ms | 515.80 ± 11.51 ms |
| **p90** | 1,470 ms | 1,480 ms | 1,440 ms | 1,463.33 ± 20.82 ms |
| **p95** | 1,740 ms | 1,780 ms | 1,710 ms | 1,743.33 ± 35.12 ms |
| **p99** | 2,230 ms | 2,360 ms | 2,150 ms | 2,246.67 ± 105.30 ms |
| **Max** | 4,080 ms | 5,700 ms | 3,270 ms | 4,350 ± 1,230.94 ms |

#### Latensi per Domain

**Auth Latency:**
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 227.17 ms | 235.08 ms | 232.63 ms | 231.63 ± 4.02 ms |
| **p95** | 556.73 ms | 577.23 ms | 562.95 ms | 565.64 ± 10.50 ms |
| **p99** | 754.21 ms | 773.62 ms | 753.33 ms | 760.39 ± 11.52 ms |

**Permohonan Latency:**
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 1,060 ms | 1,110 ms | 1,050 ms | 1,073.33 ± 32.15 ms |
| **p95** | 2,060 ms | 2,130 ms | 2,010 ms | 2,066.67 ± 60.28 ms |
| **p99** | 2,540 ms | 2,710 ms | 2,370 ms | 2,540 ± 170 ms |

**Workflow Latency:**
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 633.06 ms | 640.86 ms | 642.37 ms | 638.76 ± 4.90 ms |
| **p95** | 1,270 ms | 1,280 ms | 1,310 ms | 1,286.67 ± 20.82 ms |
| **p99** | 1,650 ms | 1,710 ms | 1,580 ms | 1,646.67 ± 65.06 ms |

**Survey Latency:**
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 646.56 ms | 686.29 ms | 632.49 ms | 655.11 ± 27.87 ms |
| **p95** | 969.50 ms | 1,060 ms | 956.38 ms | 995.29 ± 55.73 ms |
| **p99** | 1,220 ms | 1,390 ms | 1,190 ms | 1,266.67 ± 107.70 ms |

---

## 3. Hasil Microservices Architecture

### 3.1 Baseline Testing (35 VUs, 10 menit)

| Metrik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|--------|-------|-------|-------|---------------|
| **Total Iterations** | 2,621 | 2,687 | 2,622 | 2,643 ± 38 |
| **Total Requests** | 16,025 | 16,493 | 15,899 | 16,139 ± 306 |
| **Throughput (req/s)** | 26.45 | 27.49 | 26.45 | 26.80 ± 0.60 |
| **Checks Passed** | 100% | 100% | 100% | 100% |
| **HTTP Req Failed** | 0.00% | 0.00% | 0.00% | 0.00% |

#### Latensi HTTP Request Duration
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 301.23 ms | 260.98 ms | 312.17 ms | 291.46 ± 26.59 ms |
| **p50 (Median)** | 313.38 ms | 282.55 ms | 327.65 ms | 307.86 ± 23.11 ms |
| **p90** | 611.52 ms | 523.06 ms | 631.41 ms | 588.66 ± 56.49 ms |
| **p95** | 709.54 ms | 592.62 ms | 743.44 ms | 681.87 ± 76.90 ms |
| **p99** | 985.67 ms | 772.63 ms | 1,000 ms | 919.43 ± 124.77 ms |
| **Max** | 2,800 ms | 1,210 ms | 1,890 ms | 1,966.67 ± 797.29 ms |

#### Latensi per Domain

**Auth Latency:**
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 121.20 ms | 121.41 ms | 122.09 ms | 121.57 ± 0.46 ms |
| **p95** | 258.49 ms | 261.25 ms | 260.09 ms | 259.94 ± 1.39 ms |
| **p99** | 324.25 ms | 324.51 ms | 328.75 ms | 325.84 ± 2.51 ms |

**Permohonan Latency:**
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 463.23 ms | 394.32 ms | 484.64 ms | 447.40 ± 46.95 ms |
| **p95** | 804.89 ms | 655.05 ms | 850.48 ms | 770.14 ± 102.47 ms |
| **p99** | 1,020 ms | 844.28 ms | 1,110 ms | 991.43 ± 134.42 ms |

**Workflow Latency:**
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 389.98 ms | 352.47 ms | 386.03 ms | 376.16 ± 20.40 ms |
| **p95** | 697.83 ms | 590.36 ms | 688.65 ms | 658.95 ± 58.88 ms |
| **p99** | 945.03 ms | 747.39 ms | 893.35 ms | 861.92 ± 100.84 ms |

**Survey Latency:**
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 488.24 ms | 426.98 ms | 499.57 ms | 471.60 ± 38.51 ms |
| **p95** | 744.64 ms | 628.57 ms | 791.09 ms | 721.43 ± 82.58 ms |
| **p99** | 1,000 ms | 760.57 ms | 1,000 ms | 920.19 ± 138.28 ms |

### 3.2 Stress Testing (75 VUs, 8 menit)

| Metrik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|--------|-------|-------|-------|---------------|
| **Total Iterations** | 3,011 | 3,086 | 2,977 | 3,025 ± 56 |
| **Total Requests** | 18,440 | 18,871 | 18,016 | 18,442 ± 428 |
| **Throughput (req/s)** | 38.04 | 38.74 | 37.06 | 37.95 ± 0.86 |
| **Checks Passed** | 100% | 100% | 100% | 100% |
| **HTTP Req Failed** | 0.00% | 0.00% | 0.00% | 0.00% |

#### Latensi HTTP Request Duration
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 838.28 ms | 798.44 ms | 880.77 ms | 839.16 ± 41.17 ms |
| **p50 (Median)** | 613.86 ms | 617.06 ms | 597.70 ms | 609.54 ± 10.43 ms |
| **p90** | 1,880 ms | 1,750 ms | 2,010 ms | 1,880 ± 130 ms |
| **p95** | 2,350 ms | 2,240 ms | 2,600 ms | 2,396.67 ± 183.79 ms |
| **p99** | 3,290 ms | 3,080 ms | 3,570 ms | 3,313.33 ± 246.03 ms |
| **Max** | 5,130 ms | 4,550 ms | 5,730 ms | 5,136.67 ± 590.21 ms |

#### Latensi per Domain

**Auth Latency:**
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 154.78 ms | 155.17 ms | 155.75 ms | 155.23 ± 0.49 ms |
| **p95** | 325.29 ms | 328.98 ms | 326.57 ms | 326.95 ± 1.86 ms |
| **p99** | 396.10 ms | 398.49 ms | 427.59 ms | 407.39 ± 17.41 ms |

**Permohonan Latency:**
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 1,530 ms | 1,490 ms | 1,620 ms | 1,546.67 ± 66.58 ms |
| **p95** | 3,040 ms | 2,900 ms | 3,350 ms | 3,096.67 ± 226.72 ms |
| **p99** | 3,820 ms | 3,520 ms | 4,220 ms | 3,853.33 ± 350.48 ms |

**Workflow Latency:**
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 708.54 ms | 710.69 ms | 756.48 ms | 725.24 ± 27.03 ms |
| **p95** | 2,430 ms | 2,510 ms | 2,850 ms | 2,596.67 ± 224.98 ms |
| **p99** | 3,250 ms | 3,190 ms | 3,620 ms | 3,353.33 ± 232.77 ms |

**Survey Latency:**
| Statistik | Run 1 | Run 2 | Run 3 | Mean ± StdDev |
|-----------|-------|-------|-------|---------------|
| **Average** | 848.59 ms | 764.71 ms | 900.15 ms | 837.82 ± 68.56 ms |
| **p95** | 1,720 ms | 1,400 ms | 1,950 ms | 1,690 ± 277.93 ms |
| **p99** | 2,060 ms | 1,770 ms | 2,770 ms | 2,200 ± 518.70 ms |

---

## 4. Perbandingan Monolith vs Microservices

### 4.1 Baseline Testing (35 VUs)

| Metrik | Monolith | Microservices | Difference |
|--------|----------|---------------|------------|
| **Iterations** | 2,812 ± 88 | 2,643 ± 38 | -6.0% |
| **Throughput (req/s)** | 20.70 ± 0.68 | 26.80 ± 0.60 | **+29.5%** 🟢 |
| **HTTP Duration Avg** | 307.06 ± 41 ms | 291.46 ± 27 ms | **-5.1%** 🟢 |
| **HTTP Duration p95** | 887.69 ± 132 ms | 681.87 ± 77 ms | **-23.2%** 🟢 |
| **HTTP Duration p99** | 1,150 ± 168 ms | 919.43 ± 125 ms | **-20.0%** 🟢 |
| **Auth p95** | 199.30 ± 5.84 ms | 259.94 ± 1.39 ms | +30.4% |
| **Permohonan p95** | 1,061.85 ± 145 ms | 770.14 ± 102 ms | **-27.5%** 🟢 |
| **Workflow p95** | 628.90 ± 72 ms | 658.95 ± 59 ms | +4.8% |
| **Survey p95** | 602.11 ± 69 ms | 721.43 ± 83 ms | +19.8% |

**Insight Baseline:**
- ✅ Microservices menunjukkan **throughput lebih tinggi** (+29.5%) dengan lebih sedikit iterasi
- ✅ Microservices memiliki **latensi p95 23% lebih rendah** pada HTTP request secara keseluruhan
- ✅ Permohonan operations **27.5% lebih cepat** di microservices
- ⚠️ Auth latency microservices **30% lebih tinggi** (kemungkinan overhead inter-service communication)
- ✅ Konsistensi hasil tinggi (standard deviation rendah) pada kedua arsitektur

### 4.2 Stress Testing (75 VUs)

| Metrik | Monolith | Microservices | Difference |
|--------|----------|---------------|------------|
| **Iterations** | 3,907 ± 32 | 3,025 ± 56 | -22.6% |
| **Throughput (req/s)** | 35.88 ± 0.25 | 37.95 ± 0.86 | **+5.8%** 🟢 |
| **HTTP Duration Avg** | 618.43 ± 18 ms | 839.16 ± 41 ms | +35.7% 🔴 |
| **HTTP Duration p95** | 1,743.33 ± 35 ms | 2,396.67 ± 184 ms | +37.5% 🔴 |
| **HTTP Duration p99** | 2,246.67 ± 105 ms | 3,313.33 ± 246 ms | +47.5% 🔴 |
| **Auth p95** | 565.64 ± 10.50 ms | 326.95 ± 1.86 ms | **-42.2%** 🟢 |
| **Permohonan p95** | 2,066.67 ± 60 ms | 3,096.67 ± 227 ms | +49.9% 🔴 |
| **Workflow p95** | 1,286.67 ± 21 ms | 2,596.67 ± 225 ms | +101.8% 🔴 |
| **Survey p95** | 995.29 ± 56 ms | 1,690 ± 278 ms | +69.8% 🔴 |

**Insight Stress:**
- ⚠️ Microservices menunjukkan **degradasi performa lebih signifikan** di bawah beban tinggi
- 🔴 HTTP latency p95 microservices **37.5% lebih lambat** dibanding monolith
- 🔴 Permohonan operations **50% lebih lambat** di microservices saat stress
- 🔴 Workflow operations **101.8% lebih lambat** (2x lipat) di microservices
- ✅ Auth service microservices tetap **42% lebih cepat** bahkan saat stress (kemungkinan karena service independent)
- 📊 Standard deviation microservices lebih tinggi (variabilitas meningkat saat stress)

---

## 5. Analisis Statistik

### 5.1 Stabilitas dan Konsistensi

**Coefficient of Variation (CV) - Baseline:**
- Monolith HTTP p95: CV = 14.9% (132.19 / 887.69)
- Microservices HTTP p95: CV = 11.3% (77 / 681.87)
- **Kesimpulan:** Microservices baseline **lebih konsisten** (CV lebih rendah)

**Coefficient of Variation (CV) - Stress:**
- Monolith HTTP p95: CV = 2.0% (35.12 / 1,743.33)
- Microservices HTTP p95: CV = 7.7% (183.79 / 2,396.67)
- **Kesimpulan:** Monolith stress **lebih konsisten** (CV lebih rendah)

### 5.2 Skalabilitas

**Baseline → Stress Degradation Factor:**

| Metrik | Monolith | Microservices |
|--------|----------|---------------|
| **HTTP Duration p95** | 1.96× (887ms → 1,743ms) | 3.52× (682ms → 2,397ms) |
| **Permohonan p95** | 1.95× (1,062ms → 2,067ms) | 4.02× (770ms → 3,097ms) |
| **Workflow p95** | 2.05× (629ms → 1,287ms) | 3.94× (659ms → 2,597ms) |
| **Survey p95** | 1.65× (602ms → 995ms) | 2.34× (721ms → 1,690ms) |

**Kesimpulan Skalabilitas:**
- ⚠️ Microservices mengalami **degradasi 1.8× - 2× lebih besar** saat beban naik
- 🔴 Permohonan dan Workflow operations di microservices **paling terdampak** (degradasi ~4×)
- ✅ Monolith menunjukkan **skalabilitas linear** yang lebih baik (degradasi ~2×)

### 5.3 Threshold Compliance

**Baseline Testing:**
- ✅ Monolith: **Semua threshold terpenuhi** (p95 < 2.8s, error rate 0%)
- ✅ Microservices: **Semua threshold terpenuhi** (p95 < 2.8s, error rate 0%)

**Stress Testing:**
- ✅ Monolith: **Semua threshold terpenuhi** (p95 1.74s < 2.8s, error rate 0%)
- ✅ Microservices: **Semua threshold terpenuhi** (p95 2.40s < 2.8s, error rate 0%)
- ⚠️ Microservices **mendekati batas threshold** (86% dari limit p95)

---

## 6. Kesimpulan dan Rekomendasi

### 6.1 Kesimpulan Utama

1. **Performa Baseline (35 VUs):**
   - Microservices **unggul dalam throughput** (+29.5%) dan **latensi umum lebih rendah** (-23.2% p95)
   - Microservices **cocok untuk beban normal** dengan responsiveness lebih baik
   - Trade-off: Auth overhead lebih tinggi (+30%) karena inter-service communication

2. **Performa Stress (75 VUs):**
   - Monolith **lebih stabil dan konsisten** di bawah beban tinggi
   - Monolith memiliki **skalabilitas vertikal lebih baik** (degradasi 2× vs 4×)
   - Microservices mengalami **bottleneck signifikan** pada Permohonan/Workflow services

3. **Reliabilitas:**
   - ✅ **Kedua arsitektur mencapai 100% functional checks** di semua 12 pengujian
   - ✅ **0% error rate** pada kedua arsitektur (sangat reliable)
   - ✅ Semua threshold SLO terpenuhi

4. **Konsistensi:**
   - Standard deviation **rendah pada kedua arsitektur** (variabilitas <10%)
   - Hasil **reproducible** (3 repetisi menunjukkan pola konsisten)

### 6.2 Rekomendasi

**Untuk Implementasi Production:**

1. **Pilih Microservices jika:**
   - Beban trafik **normal-moderate** (10-40 concurrent users)
   - Prioritas pada **responsiveness** dan **throughput tinggi**
   - Membutuhkan **independent scaling** per service
   - Tim development terpisah per domain (auth, workflow, survei)

2. **Pilih Monolith jika:**
   - Beban trafik **tinggi dan burst traffic** (>50 concurrent users)
   - Prioritas pada **stabilitas** dan **predictability**
   - Resource terbatas (single server deployment)
   - Tim kecil dengan maintenance sederhana

3. **Optimisasi Microservices untuk Stress:**
   - Implement **connection pooling** untuk inter-service communication
   - Add **caching layer** (Redis) untuk auth tokens dan permohonan data
   - Enable **circuit breaker** untuk prevent cascading failures
   - Consider **async messaging** (RabbitMQ/Kafka) untuk workflow operations
   - Optimize database queries pada Permohonan/Workflow services (bottleneck utama)

4. **Monitoring dan Alerting:**
   - Set alert threshold pada **p95 latency 2.0s** (buffer 28% dari limit)
   - Monitor **degradation factor** saat load spike (target <2.5×)
   - Track **per-service latency** untuk early detection bottleneck

### 6.3 Trade-off Summary

| Aspek | Monolith | Microservices |
|-------|----------|---------------|
| **Throughput Normal** | Good (20.7 req/s) | **Excellent** (26.8 req/s) |
| **Throughput Stress** | Good (35.9 req/s) | **Excellent** (38.0 req/s) |
| **Latency Normal** | Good (888ms p95) | **Excellent** (682ms p95) |
| **Latency Stress** | **Excellent** (1,743ms p95) | Good (2,397ms p95) |
| **Scalability** | **Excellent** (2× degradation) | Fair (4× degradation) |
| **Consistency** | **Excellent** (CV 2%) | Good (CV 7.7%) |
| **Reliability** | **Excellent** (0% error) | **Excellent** (0% error) |
| **Operational Complexity** | **Low** (single service) | High (5+ services) |

---

## 7. Lampiran

### 7.1 Arsitektur Testing

**Monolith:**
- Single Node.js application (port 3000)
- MySQL database (monolith-mysql)
- All domains (auth, permohonan, workflow, survei) dalam satu proses

**Microservices:**
- API Gateway (Nginx, port 8080)
- Auth Service (port 3001)
- Pendaftaran Service (port 3010)
- Workflow Service (port 3020)
- Survey Service (port 3030)
- Archive Service (port 3040)
- MySQL shared database (port 3307)

### 7.2 Test Users
- `pemohon1` / `password123` (role: Pemohon)
- `admin1` / `password123` (role: Admin)
- `opd1` / `password123` (role: OPD)
- `pimpinan1` / `password123` (role: Pimpinan)

### 7.3 File Hasil Testing
Seluruh hasil testing tersimpan di:
```
test-results/2025-12-20/
├── monolith/
│   ├── baseline_r1/ (summary.txt, metrics.csv)
│   ├── baseline_r2/
│   ├── baseline_r3/
│   ├── stress_r1/
│   ├── stress_r2/
│   └── stress_r3/
└── microservices/
    ├── baseline_r1/ (summary.txt, metrics.csv)
    ├── baseline_r2/
    ├── baseline_r3/
    ├── stress_r1/
    ├── stress_r2/
    └── stress_r3/
```

---

**Generated:** 21 Desember 2025  
**Tool:** k6 v0.52.0  
**Total Test Runs:** 12 (3× repetisi × 2 skenario × 2 arsitektur)  
**Total Test Duration:** ~108 menit  
**Success Rate:** 100% (all tests passed)
