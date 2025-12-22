# Soak Test Plan: Monolith vs Microservices Scale-Out
**Long-Duration Performance & Stability Testing**

---

## Overview

Soak testing (endurance testing) adalah pengujian performa dengan **durasi panjang** untuk mendeteksi:
- **Memory leaks** (memory usage meningkat over time)
- **Resource exhaustion** (file descriptors, connections, threads)
- **Performance degradation** (latency meningkat seiring waktu)
- **Data accumulation issues** (log files, temp files, cache overflow)
- **System stability** (uptime, crash resistance)

---

## Test Scenarios

### 1. Soak Baseline (4-8 hours)

**Objective:** Validate system stability pada **normal production load** dalam durasi panjang

**Configuration:**
```javascript
{
  executor: 'constant-vus',
  vus: 35,                           // Moderate sustained load
  duration: '4h',                    // Default 4 hours (adjustable via env)
  gracefulStop: '2m',
  tags: { scenario: 'soak-baseline', sut: SUT }
}
```

**Load Pattern:**
- **35 concurrent users** (same as baseline test)
- **Constant load** (no ramping, pure sustained)
- **Duration:** 4 hours minimum (dapat diperpanjang ke 6-8h jika needed)
- **Expected iterations:** ~50,400 iterations (35 VUs × 360 iter/hour × 4h)
- **Expected requests:** ~224,000 requests (monolith) atau ~302,000 requests (microservices dengan amplification)

**Success Criteria:**
- ✅ **Error rate < 1%** throughout entire duration
- ✅ **Latency p95 stable** (variance < 15% antara hour-1 dan hour-4)
- ✅ **Memory usage stable** (no continuous growth)
- ✅ **No container crashes/restarts**
- ✅ **Database connections stable** (no connection pool exhaustion)

**Monitoring Points (per hour):**
- Latency trends: avg, p50, p95, p99
- Memory usage: container RSS, heap size
- CPU usage: average per service
- Database: active connections, slow queries
- Error rate: http failures, check failures

---

### 2. Soak Stress (1-2 hours)

**Objective:** Validate system stability pada **peak load** dalam durasi medium

**Configuration:**
```javascript
{
  executor: 'constant-vus',
  vus: 75,                           // High sustained load
  duration: '1h',                    // Default 1 hour (adjustable via env)
  gracefulStop: '2m',
  tags: { scenario: 'soak-stress', sut: SUT }
}
```

**Load Pattern:**
- **75 concurrent users** (same as stress test)
- **Constant load** (sustained peak)
- **Duration:** 1 hour minimum (dapat diperpanjang ke 2h untuk deeper analysis)
- **Expected iterations:** ~29,000 iterations (75 VUs × 483 iter/hour)
- **Expected requests:** ~129,000 requests (monolith) atau ~176,000 requests (microservices)

**Success Criteria:**
- ✅ **Error rate < 3%** (lebih toleran karena sustained high load)
- ✅ **Latency p95 < 3,000ms** throughout duration
- ✅ **No continuous degradation** (hour-end latency < 1.2× hour-start latency)
- ✅ **System recoverable** (dapat handle load tanpa restart)
- ✅ **Database remains responsive** (query time < 500ms p95)

**Monitoring Points (per 15 minutes):**
- Latency degradation trends
- Memory growth rate
- Database connection saturation
- Queue lengths (if applicable)
- GC frequency and pause times

---

## Expected Outcomes

### Monolith Soak Baseline (4h, 35 VUs)

| Metric | Expected Range | Concern Threshold |
|--------|----------------|-------------------|
| **Total Iterations** | 48,000 - 52,000 | < 45,000 (degradation) |
| **Iteration Rate** | 3.3 - 3.6 iter/s | < 3.0 iter/s |
| **HTTP p95 Latency** | 800 - 1,000 ms | > 1,200 ms (stable degradation) |
| **Memory Growth** | < 5% per hour | > 10% per hour (leak suspected) |
| **Error Rate** | 0% | > 1% (instability) |
| **Container Restarts** | 0 | > 0 (crash) |

### Microservices Scale-Out Soak Baseline (4h, 35 VUs)

| Metric | Expected Range | Concern Threshold |
|--------|----------------|-------------------|
| **Total Iterations** | 46,000 - 50,000 | < 43,000 |
| **Iteration Rate** | 3.2 - 3.5 iter/s | < 2.9 iter/s |
| **HTTP p95 Latency** | 650 - 850 ms | > 1,000 ms |
| **Memory Growth (per service)** | < 5% per hour | > 10% per hour |
| **Database Connections** | 150 - 250 | > 400 (saturation) |
| **Error Rate** | 0% | > 1% |
| **Service Restarts** | 0 | > 0 |

### Monolith Soak Stress (1h, 75 VUs)

| Metric | Expected Range | Concern Threshold |
|--------|----------------|-------------------|
| **Total Iterations** | 3,600 - 4,000 | < 3,400 |
| **Iteration Rate** | 7.8 - 8.2 iter/s | < 7.5 iter/s |
| **HTTP p95 Latency** | 1,700 - 1,900 ms | > 2,200 ms |
| **Memory Peak** | < 80% of limit | > 90% |
| **Error Rate** | 0% | > 3% |

### Microservices Scale-Out Soak Stress (1h, 75 VUs)

| Metric | Expected Range | Concern Threshold |
|--------|----------------|-------------------|
| **Total Iterations** | 4,000 - 4,300 | < 3,800 |
| **Iteration Rate** | 8.4 - 8.8 iter/s | < 8.0 iter/s |
| **HTTP p95 Latency** | 800 - 950 ms | > 1,200 ms |
| **Database Connections** | 300 - 400 | > 450 (near limit) |
| **Per-Replica Load Balance** | Deviation < 20% | > 30% (unbalanced) |
| **Error Rate** | 0% | > 3% |

---

## Execution Plan

### Phase 1: Preparation (15 minutes)

1. **Stop existing containers:**
   ```powershell
   docker compose -f docker-compose.scaleout.yml down
   docker compose down
   ```

2. **Clear old logs/data:**
   ```powershell
   docker system prune -f
   docker volume prune -f  # Warning: deletes all volumes
   ```

3. **Start fresh environment:**
   ```powershell
   # For monolith
   docker compose up -d --wait
   npm run seed:monolith
   
   # For microservices scale-out
   docker compose -f docker-compose.scaleout.yml up -d --wait
   docker exec jelita-auth-scaled sh -c "node scripts/resetDatabase.js && node scripts/seedTestData.js"
   docker exec jelita-pendaftaran-1 sh -c "node scripts/resetDatabase.js && node scripts/seedTestData.js"
   docker exec jelita-workflow-1 sh -c "node scripts/resetDatabase.js && node scripts/seedTestData.js"
   docker exec jelita-survey-1 sh -c "node scripts/resetDatabase.js && node scripts/seedTestData.js"
   docker exec jelita-archive-scaled sh -c "node scripts/resetDatabase.js && node scripts/seedTestData.js"
   ```

4. **Verify health:**
   ```powershell
   curl http://localhost:3000/health    # Monolith
   curl http://localhost:8080/health     # Scale-out gateway
   ```

### Phase 2: Monolith Soak Tests

**Test 2.1: Monolith Soak Baseline (4 hours)**
```powershell
# Set duration via environment variable
$env:SOAK_BASELINE_DURATION = "4h"
npm run test:soak-baseline
# Expected completion: 4h 5m (with graceful stop)
```

**Test 2.2: Monolith Soak Stress (1 hour)**
```powershell
$env:SOAK_STRESS_DURATION = "1h"
npm run test:soak-stress
# Expected completion: 1h 3m
```

### Phase 3: Microservices Scale-Out Soak Tests

**Switch to scale-out environment:**
```powershell
docker compose down
docker compose -f docker-compose.scaleout.yml up -d --wait
# Re-seed databases (see Phase 1 step 3)
```

**Test 3.1: Microservices Soak Baseline (4 hours)**
```powershell
$env:BASE_URL = "http://localhost:8080"
$env:SUT = "microservices-scaled"
$env:SOAK_BASELINE_DURATION = "4h"
npm run test:soak-baseline
```

**Test 3.2: Microservices Soak Stress (1 hour)**
```powershell
$env:BASE_URL = "http://localhost:8080"
$env:SUT = "microservices-scaled"
$env:SOAK_STRESS_DURATION = "1h"
npm run test:soak-stress
```

---

## Monitoring During Tests

### Real-Time Monitoring Commands

**1. Container Resource Usage (every 5 minutes):**
```powershell
# Save snapshots for post-analysis
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" > "monitor-$(Get-Date -Format 'HHmmss').txt"
```

**2. Database Connection Count:**
```powershell
docker exec jelita-mysql-scaled mysql -uroot -pJelitaMySQL2024 -e "SHOW STATUS LIKE 'Threads_connected';"
```

**3. Service Logs (check for errors):**
```powershell
# Monolith
docker compose logs --tail=100 jelita-monolith | Select-String -Pattern "error|fail|crash"

# Microservices scale-out (check specific service)
docker compose -f docker-compose.scaleout.yml logs --tail=100 jelita-pendaftaran-1 | Select-String -Pattern "error|fail"
```

**4. k6 Progress (mid-test check):**
```powershell
# k6 outputs live progress to console
# Look for:
# - Current VUs (should be constant 35 or 75)
# - Iteration count growth (linear over time)
# - Error rate (should be near 0%)
# - Latency trends (check p95 values every 10 minutes)
```

### Automated Monitoring Script

Create `monitor-soak.ps1`:
```powershell
param(
    [int]$IntervalMinutes = 10,
    [int]$DurationHours = 4
)

$endTime = (Get-Date).AddHours($DurationHours)
$outputDir = "soak-monitoring-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
New-Item -ItemType Directory -Path $outputDir -Force

while ((Get-Date) -lt $endTime) {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] Collecting metrics..."
    
    # Container stats
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | 
        Out-File "$outputDir/stats-$(Get-Date -Format 'HHmm').txt"
    
    # Database connections
    docker exec jelita-mysql-scaled mysql -uroot -pJelitaMySQL2024 -e "SHOW STATUS LIKE 'Threads_connected';" 2>$null |
        Out-File "$outputDir/db-connections-$(Get-Date -Format 'HHmm').txt"
    
    Start-Sleep -Seconds ($IntervalMinutes * 60)
}

Write-Host "Monitoring complete. Results in: $outputDir"
```

---

## Success Criteria Summary

### Must-Have (Critical)
- ✅ **Zero crashes** throughout test duration
- ✅ **Error rate < 1%** (baseline) or **< 3%** (stress)
- ✅ **No memory leaks** (< 10% growth per hour)
- ✅ **Functional checks pass** throughout

### Should-Have (Important)
- ✅ **Latency stable** (p95 variance < 15%)
- ✅ **Throughput consistent** (iter/s variance < 10%)
- ✅ **Database connections healthy** (< 80% of limit)

### Nice-to-Have (Desirable)
- ✅ **Performance improvement over time** (caching effects)
- ✅ **Graceful degradation** if any (no sudden spikes)
- ✅ **CPU usage < 70%** on average

---

## Post-Test Analysis

### Data Collection Points

1. **k6 Summary Files:**
   - `test-results/[date]/[sut]/soak-baseline/summary.txt`
   - `test-results/[date]/[sut]/soak-stress/summary.txt`

2. **CSV Metrics:**
   - `metrics.csv` untuk time-series analysis

3. **Monitoring Snapshots:**
   - Container stats per interval
   - Database connection counts
   - Service logs

### Analysis Queries

**1. Memory Growth Rate:**
```python
# From monitoring snapshots
import pandas as pd
df = pd.read_csv('stats-*.txt', sep='\t')
memory_growth = (df['MemUsage'].iloc[-1] - df['MemUsage'].iloc[0]) / hours
print(f"Memory growth: {memory_growth} MB/hour")
```

**2. Latency Degradation:**
```python
# From k6 metrics.csv
df = pd.read_csv('metrics.csv')
df_duration = df[df['metric_name'] == 'http_req_duration']
early_p95 = df_duration[df_duration['timestamp'] < first_hour].quantile(0.95)
late_p95 = df_duration[df_duration['timestamp'] > last_hour].quantile(0.95)
degradation = ((late_p95 - early_p95) / early_p95) * 100
print(f"Latency degradation: {degradation:.2f}%")
```

**3. Throughput Consistency:**
```python
# Iterations per hour
df_iter = df[df['metric_name'] == 'iterations']
hourly_counts = df_iter.resample('1H', on='timestamp').count()
consistency = (hourly_counts.std() / hourly_counts.mean()) * 100
print(f"Throughput variance: {consistency:.2f}%")
```

---

## Troubleshooting

### Common Issues

**1. Container OOM (Out of Memory):**
```bash
# Symptom: Container restart during test
# Solution: Increase memory limit in docker-compose
services:
  jelita-monolith:
    deploy:
      resources:
        limits:
          memory: 2G  # Increase from default
```

**2. Database Connection Exhaustion:**
```bash
# Symptom: "Too many connections" errors
# Solution: Increase max_connections or reduce per-service pool
environment:
  - DB_CONNECTION_LIMIT=20  # Reduce from 30
```

**3. Disk Space Full:**
```bash
# Symptom: Container fails to write logs
# Solution: Clean up old logs before test
docker system prune -a -f --volumes
```

**4. Test Timeout:**
```bash
# Symptom: k6 exits before completion
# Solution: Ensure no system sleep/hibernation during test
powercfg /change standby-timeout-ac 0  # Disable sleep on AC power
```

---

## Estimated Timeline

| Phase | Duration | Notes |
|-------|----------|-------|
| **Setup** | 15 min | Environment preparation |
| **Monolith Baseline** | 4h 5m | Main soak test |
| **Monolith Stress** | 1h 3m | Peak load soak |
| **Environment Switch** | 10 min | Stop monolith, start scale-out |
| **Microservices Baseline** | 4h 5m | Main soak test |
| **Microservices Stress** | 1h 3m | Peak load soak |
| **Analysis** | 1h | Post-test data processing |
| **TOTAL** | **~11.5 hours** | Full test suite |

**Recommended Schedule:**
- **Day 1 Evening (6 PM):** Start Monolith Baseline (run overnight)
- **Day 2 Morning (10 AM):** Complete Monolith Stress
- **Day 2 Afternoon (12 PM):** Start Microservices Baseline
- **Day 2 Evening (4 PM):** Complete Microservices Stress
- **Day 2 Evening (6 PM):** Analysis

---

## Acceptance Criteria for Paper

### Monolith vs Microservices Scale-Out Comparison

| Aspect | Acceptance | Rejection |
|--------|-----------|-----------|
| **Stability** | Both: 0 crashes | Any: > 0 crashes |
| **Memory** | Both: < 10% growth/hour | Any: > 15% growth/hour |
| **Latency** | Stable (variance < 15%) | Continuous increase (> 20%) |
| **Throughput** | Consistent (variance < 10%) | Degradation > 15% |
| **Errors** | < 1% baseline, < 3% stress | > 5% any scenario |

### Differential Analysis

**Expected Results:**
- **Monolith:** Better long-term memory stability (single process)
- **Microservices:** Better resource isolation (per-service limits)
- **Scale-Out:** Proves horizontal scalability maintains stability

**Killer Question to Answer:**
> "Does microservices scale-out maintain its 52.8% latency advantage over monolith for 4+ hours continuously, or does it degrade back to single-instance levels?"

---

**Document Version:** 1.0  
**Created:** 21 December 2025  
**Next Update:** After test execution completion
