# Performance Testing Results: 10x Repetition Test - Microservices Architecture

---

## Executive Summary

This report presents performance test results with **10 repetitions** for microservices architecture under baseline (35 VUs) and stress (75 VUs) conditions. Data combines results from December 21, 2025 (3 runs) and December 31, 2025 (7 runs) to provide robust statistical validation.

**Test Date:** December 21 & 31, 2025  
**Total Tests:** 20 (10 baseline + 10 stress)  
**Total Execution Time:** ~180 minutes (10 × 10 min baseline + 10 × 8 min stress)  
**Tool:** k6 Load Testing  
**Status:** ✅ All 20 tests passed with 100% functional checks

---

## 1. Test Configuration

### 1.1 Baseline Scenario
- **Virtual Users (VUs):** 35
- **Duration:** 10 minutes
- **Ramp Pattern:** 
  - 30 seconds: ramp up 0 → 10 VUs
  - 8 minutes 30 seconds: sustain 35 VUs
  - 30 seconds: ramp down 35 → 0 VUs
- **Purpose:** Measure system performance under normal conditions

### 1.2 Stress Scenario
- **Virtual Users (VUs):** 75
- **Duration:** 8 minutes
- **Ramp Pattern:**
  - 30 seconds: ramp up 0 → 25 VUs (stage 1)
  - 0 seconds: immediate jump 25 → 75 VUs (stage 2 start)
  - 6 minutes 30 seconds: sustain 75 VUs (stage 2)
  - 30 seconds: ramp down 75 → 0 VUs (stage 3)
- **Purpose:** Measure system performance under high load

### 1.3 Threshold SLO (Service Level Objectives)
- `http_req_failed < 5%` - Request failure rate
- `http_req_duration p95 < 2.8s, p99 < 5.5s` - General latency
- `auth_latency p95 < 1.2s` - Authentication latency
- `permohonan_latency p95 < 3.8s` - Application create/submit latency
- `workflow_latency p95 < 3.2s` - Workflow operations latency
- `survey_latency p95 < 2.2s` - Survey operations latency

### 1.4 Test Environment
- **Architecture:** Microservices (multiple containers on single host)
- **Deployment:** Single-node Docker environment (not distributed across machines)
- **Services:** 
  - API Gateway (port 8080)
  - Auth Service (layanan-manajemen-pengguna)
  - Application Service (layanan-pendaftaran)
  - Workflow Service (layanan-alur-kerja)
  - Survey Service (layanan-survei)
  - Archive Service (layanan-arsip)
- **Database:** MySQL (separate databases per service)
- **Base URL:** http://localhost:8080
- **Infrastructure:** Docker containers on single machine

---

## 2. Microservices Architecture Results

### 2.1 Baseline Testing (35 VUs, 10 minutes) - 10 Runs

| Run | Source | Iterations | Total Requests | Throughput (req/s) | HTTP Req Failed | p95 (ms) | p99 (ms) |
|-----|--------|-----------|---------------|-------------------|----------------|----------|----------|
| 1   | 2025-12-21 r1 | 2,659  | 16,249        | 26.88             | 0.00%          | 600.51   | 769.70   |
| 2   | 2025-12-21 r2 | 2,584  | 15,814        | 26.20             | 0.00%          | 717.70   | 986.48   |
| 3   | 2025-12-21 r3 | 2,684  | 16,376        | 27.33             | 0.00%          | 727.38   | 1,002.09 |
| 4   | 2025-12-31-r01 | 2,683 | 16,289        | 27.31             | 0.00%          | 706.32   | 950.04   |
| 5   | 2025-12-31-r02 | 2,825 | 17,125        | 28.37             | 0.00%          | 506.16   | 687.44   |
| 6   | 2025-12-31-r03 | 2,706 | 16,621        | 27.76             | 0.00%          | 620.98   | 857.33   |
| 7   | 2025-12-31-r04 | 2,827 | 17,052        | 28.71             | 0.00%          | 489.08   | 674.70   |
| 8   | 2025-12-31-r05 | 2,709 | 16,400        | 27.31             | 0.00%          | 624.38   | 895.17   |
| 9   | 2025-12-31-r06 | 2,854 | 17,131        | 28.54             | 0.00%          | 491.25   | 662.15   |
| 10  | 2025-12-31-r07 | 2,714 | 16,401        | 27.40             | 0.00%          | 625.18   | 890.39   |

#### HTTP Request Duration Statistics (10 runs)
| Metric | Mean ± StdDev | 95% CI | Min | Max | CV (%) |
|--------|---------------|--------|-----|-----|--------|
| **Throughput** | **27.58 ± 0.78 req/s** | **[27.02, 28.14]** | 26.20 | 28.71 | **2.8%** |
| **p95** | **610.89 ± 92.30 ms** | **[544.92, 676.86]** | 489.08 ms | 727.38 ms | **15.1%** |
| **p99** | **837.55 ± 130.73 ms** | **[744.04, 931.06]** | 662.15 ms | 1,002.09 ms | **15.6%** |

**Analysis:**
- ✅ **Good consistency:** CV = 15.1% for p95, 15.6% for p99 (acceptable variation)
- ✅ **All thresholds met:** p95 (611 ms) < 2.8s, p99 (838 ms) < 5.5s
- ✅ **Zero failures:** 0% error rate across all 10 runs
- ✅ **Stable throughput:** 27.58 ± 0.78 req/s (CV = 2.8%, excellent consistency)
- 📊 **95% CI interpretation:**
  - Throughput: [27.02, 28.14] - narrow range indicates reliable estimate
  - p95 latency: [544.92, 676.86] - wider range reflects higher variability
  - With 95% confidence, true mean falls within these intervals

### 2.2 Stress Testing (75 VUs, 8 minutes) - 10 Runs

| Run | Source | Iterations | Total Requests | Throughput (req/s) | HTTP Req Failed | p95 (ms) | p99 (ms) |
|-----|--------|-----------|---------------|-------------------|----------------|----------|----------|
| 1   | 2025-12-21 r1 | 3,011  | 18,440        | 38.04             | 0.00%          | 2,350.00 | 3,290.00 |
| 2   | 2025-12-21 r2 | 3,086  | 18,871        | 38.74             | 0.00%          | 2,240.00 | 3,080.00 |
| 3   | 2025-12-21 r3 | 2,977  | 18,016        | 37.06             | 0.00%          | 2,600.00 | 3,570.00 |
| 4   | 2025-12-31-r01 | 2,881 | 17,713        | 36.51             | 0.00%          | 2,569.74 | 3,518.79 |
| 5   | 2025-12-31-r02 | 2,966 | 18,164        | 37.40             | 0.00%          | 2,623.31 | 3,697.60 |
| 6   | 2025-12-31-r03 | 3,089 | 18,872        | 38.87             | 0.00%          | 2,189.81 | 3,098.88 |
| 7   | 2025-12-31-r04 | 3,081 | 18,863        | 38.83             | 0.00%          | 2,281.56 | 3,165.62 |
| 8   | 2025-12-31-r05 | 2,929 | 17,889        | 36.75             | 0.00%          | 2,542.17 | 3,551.11 |
| 9   | 2025-12-31-r06 | 2,957 | 18,148        | 37.35             | 0.00%          | 2,398.52 | 3,341.97 |
| 10  | 2025-12-31-r07 | 2,892 | 17,757        | 36.62             | 0.00%          | 2,577.86 | 3,564.77 |

#### HTTP Request Duration Statistics (10 runs)
| Metric | Mean ± StdDev | 95% CI | Min | Max | CV (%) |
|--------|---------------|--------|-----|-----|--------|
| **Throughput** | **37.62 ± 0.94 req/s** | **[36.95, 38.29]** | 36.51 | 38.87 | **2.5%** |
| **p95** | **2,437.30 ± 160.28 ms** | **[2,322.62, 2,551.98]** | 2,189.81 ms | 2,623.31 ms | **6.6%** |
| **p99** | **3,387.87 ± 229.45 ms** | **[3,223.66, 3,552.08]** | 3,080.00 ms | 3,697.60 ms | **6.8%** |

**Analysis:**
- ✅ **Good stability:** CV = 6.6% for p95, 6.8% for p99 (good consistency)
- ✅ **All thresholds met:** p95 (2,437 ms) < 2.8s, p99 (3,388 ms) < 5.5s
- ✅ **Zero failures:** 0% error rate across all runs
- ✅ **Higher throughput:** 37.62 ± 0.94 req/s (CV = 2.5%, excellent consistency)
- ✅ **Throughput scaling:** +36% vs baseline (37.62 vs 27.58 req/s)
- 📊 **95% CI interpretation:**
  - Throughput: [36.95, 38.29] - tight range despite stress conditions
  - p95 latency: [2,322.62, 2,551.98] - relatively narrow CI indicates consistent degradation
  - Lower CV than baseline suggests more predictable behavior under sustained stress

---

## 3. Performance Degradation Analysis

### 3.1 Resource Contention Hypothesis

The super-linear degradation (2.14× load → 3.99× latency) observed under stress testing suggests resource saturation on the single-node deployment:

**Theoretical Resource Bottlenecks:**

1. **CPU Contention:**
   - 6 concurrent Node.js services competing for CPU cores
   - Context switching overhead increases non-linearly with load
   - Expected impact: 20-40% additional latency per service at 75 VUs

2. **Memory Pressure:**
   - Multiple Node.js process heaps (typical 512MB-1GB each)
   - Potential garbage collection pauses under memory pressure
   - Expected impact: Periodic latency spikes in p99

3. **Database Connection Pool Exhaustion:**
   - 6 separate MySQL databases with individual connection pools
   - Default pool size typically 10-20 connections per service
   - At 75 VUs: ~12 concurrent requests/service → pool saturation likely
   - Expected impact: Queue delays of 100-500ms per blocked query

4. **API Gateway Bottleneck:**
   - Single gateway handling all 75 concurrent VU requests
   - Request routing + auth verification + response aggregation overhead
   - Expected impact: 50-150ms additional latency at high concurrency

5. **Docker Networking:**
   - Bridge network namespace traversal for inter-service calls
   - Each request involves 3-5 service hops through Docker network
   - Expected impact: 10-30ms per hop, cumulative 50-150ms

**Evidence from Results:**
- ✅ p95 increased 3.99× (611ms → 2,437ms) - exceeds 2× load increase
- ✅ p99 increased 4.04× (838ms → 3,388ms) - indicates tail latency amplification
- ✅ Throughput scaling only 1.36× (27.58 → 37.62 req/s) - sub-linear, confirms saturation
- ⚠️ Direct resource metrics not captured - inference based on performance characteristics

**Recommendation for Future Testing:**
- Capture Docker stats: `docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"`
- Monitor MySQL: `SHOW PROCESSLIST` and connection pool metrics
- Profile API Gateway: request queue depth and processing time per route

---

## 4. Detailed Latency Analysis

**Note:** Domain-specific latency data based on 3-run sample from initial testing (2025-12-21). Full 10-run analysis available in raw metrics files.

### 4.1 Baseline (35 VUs) - Domain-Specific Latency (Sample)

**Auth Latency (signin):**
| Metric | Mean (3 runs) | p95 | p99 |
|--------|---------------|-----|-----|
| Average | 158.59 ± 9.82 ms | 259.94 ± 1.39 ms | 331.19 ± 24.80 ms |

**Permohonan Latency:**
| Metric | Mean (3 runs) | p95 | p99 |
|--------|---------------|-----|-----|
| Average | 522.67 ± 88.27 ms | 770.14 ± 101.91 ms | 1,047.05 ± 207.35 ms |

**Workflow Latency:**
| Metric | Mean (3 runs) | p95 | p99 |
|--------|---------------|-----|-----|
| Average | 343.90 ± 44.26 ms | 658.95 ± 59.42 ms | 873.63 ± 118.40 ms |

**Survey Latency:**
| Metric | Mean (3 runs) | p95 | p99 |
|--------|---------------|-----|-----|
| Average | 443.40 ± 72.53 ms | 721.43 ± 82.58 ms | 920.19 ± 138.28 ms |

### 4.2 Stress (75 VUs) - Domain-Specific Latency (Sample)

**Auth Latency (signin):**
| Metric | Mean (3 runs sample) | p95 | p99 |
|--------|---------------------|-----|-----|
| Average | 155.23 ± 0.49 ms | 326.95 ± 1.86 ms | 407.39 ± 17.41 ms |

**Permohonan Latency:**
| Metric | Mean (3 runs sample) | p95 | p99 |
|--------|---------------------|-----|-----|
| Average | 1,546.67 ± 66.58 ms | 3,096.67 ± 226.72 ms | 3,853.33 ± 350.48 ms |

**Workflow Latency:**
| Metric | Mean (3 runs sample) | p95 | p99 |
|--------|---------------------|-----|-----|
| Average | 725.24 ± 27.03 ms | 2,596.67 ± 224.98 ms | 3,353.33 ± 232.77 ms |

**Survey Latency:**
| Metric | Mean (3 runs sample) | p95 | p99 |
|--------|---------------------|-----|-----|
| Average | 837.82 ± 68.56 ms | 1,690.00 ± 277.93 ms | 2,200.00 ± 518.70 ms |

---

## 5. Performance Comparison: Baseline vs Stress

| Metric | Baseline (35 VUs) | Stress (75 VUs) | Degradation Factor |
|--------|-------------------|-----------------|-------------------|
| **VUs** | 35 | 75 | **2.14×** |
| **HTTP p95** | 610.89 ms | 2,437.30 ms | **3.99×** |
| **HTTP p99** | 837.55 ms | 3,387.87 ms | **4.04×** |
| **Throughput** | 27.58 req/s | 37.62 req/s | **1.36×** |
| **Error Rate** | 0% | 0% | **No change** |

**Key Insight:**
- ⚠️ Microservices shows **super-linear degradation** (2.14× load → 3.99× latency)
- ⚠️ **Limited scalability:** Throughput increased only 1.36× for 2.14× VUs (64% efficiency)
- ⚠️ Significant performance degradation under high load
- ✅ System remains functional with zero errors

**Note on Resource Constraints:**
- Super-linear degradation likely caused by resource saturation on single host:
  - CPU contention among multiple service containers
  - Memory pressure from multiple Node.js processes
  - MySQL connection pool exhaustion across multiple databases
  - API Gateway becoming bottleneck under high concurrent requests
  - Network namespace overhead in Docker bridge networking
- Detailed resource monitoring (CPU/memory per container, database connections) recommended for future testing

---

## 6. Statistical Validation

### 6.1 Coefficient of Variation (CV) Analysis

**Baseline (35 VUs):**
- p95 CV: **15.1%** - Acceptable variation
- p99 CV: **15.6%** - Acceptable variation
- Throughput CV: **2.8%** - Excellent consistency

**Stress (75 VUs):**
- p95 CV: **6.6%** - Good consistency
- p99 CV: **6.8%** - Good consistency
- Throughput CV: **2.5%** - Excellent consistency

**Interpretation:**
- CV < 15% indicates **acceptable** variation
- CV < 10% indicates **good** consistency
- CV < 5% indicates **outstanding** reliability
- ✅ Baseline shows **acceptable consistency** (CV 15-16%)
- ✅ Stress shows **good consistency** (CV 6-7%)
- ✅ **Paradox:** Higher load produces MORE consistent results (stress more stable than baseline)

### 6.2 Reliability Metrics

| Metric | Baseline | Stress | Total |
|--------|----------|--------|-------|
| **Total Tests** | 10 | 10 | 20 |
| **Passed Tests** | 10 | 10 | 20 |
| **Failed Tests** | 0 | 0 | 0 |
| **Success Rate** | **100%** | **100%** | **100%** |
| **Error Rate** | **0%** | **0%** | **0%** |

---

## 7. Key Findings

### 7.1 Performance Characteristics

1. **Predictable Latency:**
   - Baseline p95: 611 ms with acceptable variation (±92 ms, CV 15.1%)
   - Stress p95: 2,437 ms with good variation (±160 ms, CV 6.6%)
   - Both meet SLO thresholds (<2.8s for p95)
   - **Interesting:** Stress test shows MORE consistency than baseline

2. **Super-Linear Degradation:**
   - 2.14× load increase → 3.99× latency increase (super-linear degradation)
   - Throughput scales sub-linearly: 1.36× increase for 2.14× VUs (64% efficiency)
   - Demonstrates challenges with distributed architecture under load

3. **Zero Error Rate:**
   - 100% success rate across all 20 tests
   - No failures, timeouts, or errors observed
   - System remains functional despite high latency

4. **Consistent Performance:**
   - CV < 16% across all metrics
   - Predictable patterns with acceptable variation

### 7.2 Strengths of Microservices Architecture

✅ **Modularity:** Independent service deployment and scaling  
✅ **Isolation:** Service failures don't cascade to entire system  
✅ **Technology Flexibility:** Each service can use different tech stack  
✅ **Team Scalability:** Different teams can work on different services  
✅ **Reliability:** 100% success rate with zero errors

### 7.3 Challenges of Microservices Architecture

⚠️ **Network Overhead:** Inter-service communication adds latency  
⚠️ **Complexity:** More moving parts, harder to debug  
⚠️ **Super-Linear Degradation:** Performance degrades significantly under stress  
⚠️ **Resource Usage:** Multiple processes and databases consume more resources  
⚠️ **Single-Node Limitations:** Resource contention on single host amplifies degradation  
⚠️ **Scaling Constraints:** Cannot leverage distributed deployment benefits in single-node setup

### 7.4 Performance Stability

- **Baseline:** Suitable for sustained 35 VUs with <650 ms p95 latency
- **Stress:** Handles 75 VUs with <2.5s p95 latency
- **Headroom:** Limited capacity before breaching SLO thresholds

---

## 8. Conclusions

1. **Reliability Excellence:**
   - ✅ 100% test success rate (20/20 tests passed)
   - ✅ Zero error rate across all scenarios
   - ✅ All SLO thresholds consistently met

2. **Performance Consistency:**
   - ✅ Acceptable CV values (6-16%)
   - ✅ Predictable latency patterns
   - ✅ More stable under stress than baseline

3. **Scalability Challenges:**
   - ⚠️ Super-linear latency degradation under load (4× for 2× VUs)
   - ⚠️ Sub-optimal throughput scaling (64% efficiency)
   - ⚠️ System shows strain at 2× baseline load

4. **Production Readiness:**
   - ⚠️ Microservices requires **careful capacity planning**
   - ⚠️ Not ideal for workloads with tight latency requirements
   - ✅ Suitable if modularity and team scalability are priorities
   - ⚠️ Consider monolith for better performance characteristics

5. **Testing Limitations:**
   - ⚠️ Results specific to **single-node deployment** with resource contention
   - ⚠️ Multi-node distributed deployment may show different characteristics
   - ⚠️ Resource monitoring not captured in this test cycle
   - ✅ Provides baseline for comparison with scaled-out architecture

---

## 9. Recommendations

1. **Deployment Strategy:**
   - Consider microservices only if **modularity benefits outweigh performance costs**
   - Suitable for scenarios requiring independent service scaling
   - Recommended when different services need different technology stacks

2. **Capacity Planning:**
   - Current capacity: comfortable up to 35 VUs
   - Approaching limits at 75 VUs (p95 = 2.4s near 2.8s threshold)
   - Recommend horizontal scaling (add more instances) before vertical

3. **Monitoring Priorities:**
   - Track inter-service communication latency
   - Monitor service-to-service error rates
   - Alert on p95 latency > 2.5s
   - Track API Gateway response times
   - **Resource Monitoring (Critical):**
     - CPU utilization per container (target: <70% at peak)
     - Memory usage per service (watch for Node.js heap limits)
     - MySQL connection pool saturation per database
     - Docker network I/O and bridge saturation
     - API Gateway queue depth and rejection rate

4. **Performance Optimization:**
   - Consider service mesh for better inter-service communication
   - Implement caching layers between services
   - Use async/message queues for non-critical operations
   - Profile and optimize high-latency service calls

5. **Architecture Considerations:**
   - Use microservices if team size justifies distributed architecture
   - Consider hybrid: monolith for tight-coupled features, microservices for independent domains
   - Evaluate trade-offs: operational complexity vs. modularity benefits

---

## 10. Appendix: Test Data Sources

### Data Collection
- **Baseline Runs (10):**
  - 2025-12-21: microservices_r1, microservices_r2, microservices_r3 (3 runs)
  - 2025-12-31: r01 through r07 (7 runs)
  
- **Stress Runs (10):**
  - 2025-12-21: microservices_r1, microservices_r2, microservices_r3 (3 runs)
  - 2025-12-31: r01 through r07 (7 runs)

### Data Format Notes
- **2025-12-21 runs:** Full k6 text summary with detailed metrics
- **2025-12-31 runs:** Simplified summary.txt + detailed summary-export.json
  - summary.txt contains only p95/p99 values
  - summary-export.json contains complete metrics in JSON format
  - All statistics calculated from summary-export.json for consistency

### File Locations
- Base path: `test-results/[date]/microservices/[scenario]/`
- Detailed metrics: `summary-export.json` (JSON format)
- Quick summary: `summary.txt` (text format)
- Raw metrics: `metrics.csv` (CSV format)
- Test configurations: `loadtest/k6/` directory

### Metrics Extraction
```powershell
# Example: Extract metrics from JSON
$json = Get-Content "test-results/2025-12-31-r01/microservices/baseline/summary-export.json" -Raw | ConvertFrom-Json
$metrics = $json.metrics
Write-Output "Iterations: $($metrics.iterations.count)"
Write-Output "Throughput: $($metrics.http_reqs.rate)"
Write-Output "p95: $($metrics.http_req_duration.'p(95)')"
```

### Statistical Calculations
- **Mean (μ):** Average of all samples
- **Standard Deviation (σ):** Measure of dispersion from mean
- **95% Confidence Interval (CI):** μ ± (t₀.₀₂₅ × σ/√n), where t₀.₀₂₅ ≈ 2.262 for n=10 (df=9)
  - Indicates range where true population mean likely falls with 95% confidence
  - Narrower CI indicates more precise estimate
- **Coefficient of Variation (CV):** (σ/μ) × 100% - measure of relative variability
  - CV < 5%: Outstanding consistency
  - CV < 10%: Good consistency  
  - CV < 15%: Acceptable variation
  - CV ≥ 15%: High variability

### Quality Assurance
- ✅ All 10 baseline runs verified: complete data from JSON exports
- ✅ All 10 stress runs verified: complete data from JSON exports
- ✅ Zero error rate confirmed across all runs (http_req_failed = 0%)
- ✅ All runs met SLO thresholds (p95 < 2.8s, p99 < 5.5s)
- ✅ 10 repetitions improve reliability and enable inferential statistics
- ⚠️ Domain-specific latency based on 3-run sample (full analysis available in raw data)
- ⚠️ Resource monitoring (CPU/memory/database) not captured in this cycle

### Limitations & Future Work
- **Single-Node Constraint:** Results reflect resource contention on one host; multi-node deployment may differ
- **Resource Metrics Missing:** CPU, memory, database connections not monitored during tests
- **Domain Latency Sample:** Only 3 runs analyzed per domain; recommend full 10-run analysis
- **No Load Balancing:** Single gateway instance; production would use multiple replicas
- **Database Scaling:** Separate databases per service not optimized for single-node setup

---

**Report Generated:** January 1, 2026  
**Analysis Tool:** k6 v0.48+  
**Data Processing:** PowerShell 7+ with JSON parsing  
**Report Version:** 1.1 (Updated with CI intervals, resource analysis, and clarified limitations)
