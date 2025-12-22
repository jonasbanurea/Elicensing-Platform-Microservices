# Scale-Out Test Execution Guide

## Tujuan
Membuktikan **horizontal scalability** microservices dengan menambah replika pada service bottleneck (Permohonan & Workflow) dan membandingkan performa stress test.

## Setup Scale-Out

### Konfigurasi:
- **Permohonan Service:** 1 → **3 replicas** (bottleneck #1)
- **Workflow Service:** 1 → **3 replicas** (bottleneck #2)
- **Survey Service:** 1 → **2 replicas** (moderate bottleneck)
- **Auth Service:** 1 replica (tidak bottleneck, tetap single)
- **Archive Service:** 1 replica (tidak bottleneck, tetap single)
- **Load Balancing:** Nginx `least_conn` (route ke server dengan koneksi paling sedikit)
- **DB Connection Pool:** 10 → 30 connections per service
- **MySQL Max Connections:** 150 → 500

### Resource Allocation:
- **Single-instance:** 5 containers (1 auth + 1 pendaftaran + 1 workflow + 1 survey + 1 archive)
- **Scaled-out:** 11 containers (1 auth + 3 pendaftaran + 3 workflow + 2 survey + 1 archive + 1 gateway)
- **Total CPU:** ~2-3 cores (jika setiap container ~250-300% CPU under stress)

## Langkah Eksekusi

### 1. Stop current microservices stack
```powershell
docker compose down
```

### 2. Start scaled-out stack
```powershell
docker compose -f docker-compose.scaleout.yml up -d --build
```

### 3. Verify all replicas running
```powershell
docker compose -f docker-compose.scaleout.yml ps
```

Expected output:
```
jelita-auth-scaled          healthy
jelita-pendaftaran-1        running
jelita-pendaftaran-2        running
jelita-pendaftaran-3        running
jelita-workflow-1           running
jelita-workflow-2           running
jelita-workflow-3           running
jelita-survey-1             running
jelita-survey-2             running
jelita-archive-scaled       running
jelita-gateway-scaled       healthy
```

### 4. Health check
```powershell
curl http://localhost:8080/health
# Expected: gateway-scaled-ok
```

### 5. Test auth endpoint
```powershell
$body = @{username="pemohon1"; password="password123"} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8080/api/auth/signin -Method POST -Body $body -ContentType "application/json"
```

### 6. Run stress test (75 VUs, 8 minutes)
```powershell
$env:BASE_URL = "http://localhost:8080"
$env:SUT = "microservices-scaled"
$env:TEST_DATE = (Get-Date -Format "yyyy-MM-dd")
$env:SCENARIO = "stress"
npm run test:stress
```

### 7. Copy results
```powershell
$date = Get-Date -Format "yyyy-MM-dd"
Copy-Item "test-results/$date/microservices-scaled/stress/summary.txt" "test-results/$date/microservices-scaled/stress_scaleout.txt"
Copy-Item "test-results/$date/microservices-scaled/stress/metrics.csv" "test-results/$date/microservices-scaled/stress_scaleout.csv"
```

### 8. Compare results
```powershell
# Single-instance baseline
Get-Content "test-results/2025-12-20/microservices/stress_r1/summary.txt" | Select-String "p\(95\)|p\(99\)"

# Scaled-out
Get-Content "test-results/$date/microservices-scaled/stress_scaleout.txt" | Select-String "p\(95\)|p\(99\)"
```

## Expected Performance Improvement

### Target Metrics (Stress Test 75 VUs):

| Metrik | Single-Instance | Scaled-Out (3x) | Target Improvement |
|--------|-----------------|-----------------|-------------------|
| **Permohonan p95** | 3,097 ms | **~1,500 ms** | **-51.6%** 🎯 |
| **Workflow p95** | 2,597 ms | **~1,300 ms** | **-49.9%** 🎯 |
| **Survey p95** | 1,690 ms | **~1,000 ms** | **-40.8%** 🎯 |
| **Overall HTTP p95** | 2,397 ms | **~1,500 ms** | **-37.4%** 🎯 |
| **Iterations** | 3,025 | **~4,500** | **+48.8%** 🎯 |

### Justification:
- **Linear scaling assumption:** 3× replicas → ~3× throughput
- **Load balancing overhead:** ~10-15% efficiency loss
- **Database contention:** Shared MySQL may become bottleneck at high concurrency
- **Expected throughput:** 6.23 → 9.0+ iterations/s (+44%)

## Success Criteria

✅ **Pass:** Scaled-out p95 < 1,800ms (competitive dengan monolith 1,743ms)
✅ **Excellent:** Scaled-out p95 < 1,500ms (better than monolith)
⚠️ **Marginal:** Scaled-out p95 1,800-2,000ms (some improvement)
❌ **Fail:** Scaled-out p95 > 2,000ms (database bottleneck atau contention)

## Monitoring During Test

### Check load distribution across replicas:
```powershell
# Real-time container stats
docker stats --no-stream

# Check nginx access logs (verify round-robin)
docker compose -f docker-compose.scaleout.yml logs -f api-gateway
```

### Check database connections:
```powershell
docker exec jelita-mysql-scaled mysql -uroot -pJelitaMySQL2024 -e "SHOW STATUS LIKE 'Threads_connected'"
```

## Cleanup

### Stop scaled-out stack:
```powershell
docker compose -f docker-compose.scaleout.yml down
```

### Restart single-instance for comparison:
```powershell
docker compose up -d
```

## Analysis Points

After test completion, analyze:

1. **Throughput Improvement:**
   - Did iterations/s increase proportionally to replicas?
   - Calculate scaling efficiency: (new_throughput / old_throughput) / num_replicas

2. **Latency Reduction:**
   - How much did p95/p99 improve for bottleneck services?
   - Did we reach competitive parity with monolith?

3. **Resource Utilization:**
   - CPU usage per container (should be ~33% of single-instance if balanced)
   - Database connection pool saturation

4. **Bottleneck Shift:**
   - Did database become new bottleneck?
   - Are there still service-level bottlenecks?

5. **Cost-Benefit:**
   - Performance gain vs 2.2× resource increase (5 → 11 containers)
   - Is horizontal scaling cost-effective for this workload?
