docker-compose up -d
docker ps
docker exec jelita-monolith-app node scripts/resetDatabase.js
docker exec jelita-monolith-app node scripts/seedDatabase.js
docker exec jelita-monolith-app node scripts/resetDatabase.js
docker exec jelita-monolith-app node scripts/seedDatabase.js
docker exec jelita-monolith-app node scripts/resetDatabase.js
docker exec jelita-monolith-app node scripts/seedDatabase.js
docker-compose down
docker-compose up -d
docker ps
docker exec layanan-manajemen-pengguna node scripts/createTestUsers.js
docker-compose up -d
docker exec jelita-monolith-app node scripts/seedDatabase.js
docker-compose up -d
docker stats --no-stream > results/docker-stats-[test-name].log
docker exec jelita-mysql mysql -uroot -prootpassword auth_db -e `
docker logs jelita-monolith-app > results/monolith-app.log
docker logs layanan-manajemen-pengguna > results/ms-auth.log
docker logs layanan-pendaftaran > results/ms-app.log
taskkill /PID <PID> /F
# Testing Execution Guide

Step-by-step instructions for an apples-to-apples performance + interoperability comparison between:
1) JELITA Monolith (port 3000)
2) JELITA Microservices via gateway (port 8080)

K6 is used for every scenario to keep tooling identical.

---

## Prerequisites
- Docker Desktop running (8GB RAM / 4 cores min; 16GB/8 cores recommended)
- Node.js 18+
- k6 CLI installed (`choco install k6` on Windows or `winget install k6`) and on PATH
- Ports: 3000 (monolith), 8080 (gateway), 8081 (phpMyAdmin), 3307 (MySQL)
- Close other heavy apps (browsers, IDEs). Keep only Terminal, Docker Desktop, Task Manager.

---

## Reset & Seed (identical dataset)
- Monolith (inside container):
  ```powershell
  docker exec jelita-monolith-app node scripts/resetDatabase.js
  docker exec jelita-monolith-app node scripts/seedDatabase.js
  ```
- Microservices (all services):
  ```powershell
  ./docker/reset-and-seed-microservices.ps1
  ```
  Dataset: 50 pemohon, 10 admin, 10 OPD, 5 pimpinan; 100 permohonan + 200 dokumen; workflow/arsip/survey linked to permohonan 1..30.

---

## Phase 1 – Start SUTs
### Monolith
```powershell
cd jelita-monolith
docker-compose up -d
curl http://localhost:3000/health
```

### Microservices (gateway on 8080, phpMyAdmin on 8081)
```powershell
cd ..

curl http://localhost:8080/health
```

---

## Phase 2 – Run K6 Scenarios (monolith)
Set environment and run the npm scripts (BASE_URL is the only change needed when switching SUTs).

```powershell
cd ..
$env:SUT="monolith"; $env:BASE_URL="http://localhost:3000"; $env:TEST_DATE="2024-12-20"  # adjust date

npm run test:baseline
npm run test:stress
npm run test:spike
npm run test:soak-baseline   # 4–8h
npm run test:soak-stress     # 1–2h
```

Outputs land in `test-results/<date>/monolith/<scenario>/` (summary.json, summary-export.json, metrics.csv).

---

## Phase 3 – Run K6 Scenarios (microservices)
```powershell
$env:SUT="microservices"; $env:BASE_URL="http://localhost:8080"; $env:TEST_DATE="2024-12-20"

npm run test:baseline
npm run test:stress
npm run test:spike
npm run test:soak-baseline   # 4–8h
npm run test:soak-stress     # 1–2h
```

Re-run `./docker/reset-and-seed-microservices.ps1` before every scenario to keep state identical.

---

## Phase 4 – Capture Supporting Metrics
- Docker stats per run:
  ```powershell
  docker stats --no-stream > test-results/<date>/<sut>/<scenario>/docker-stats.log
  ```
- MySQL status (monolith):
  ```powershell
  docker exec jelita-mysql-monolith mysql -uroot -prootpassword -e "SHOW STATUS WHERE Variable_name IN ('Threads_connected','Queries','Connections','Slow_queries');" > test-results/<date>/<sut>/<scenario>/mysql-status.log
  ```
- MySQL status (microservices shared DB):
  ```powershell
  docker exec jelita-mysql mysql -uroot -pJelitaMySQL2024 -e "SHOW STATUS WHERE Variable_name IN ('Threads_connected','Queries','Connections','Slow_queries');" > test-results/<date>/<sut>/<scenario>/mysql-status.log
  ```
- Container restarts: `docker ps --format "table {{.Names}}\t{{.Status}}"`
- Optional: scrape Prometheus/Tempo if available for inter-service hop latency.

---

## Phase 5 – Soak Criteria
- Error rate < 5%
- p95/p99 stable (no upward drift)
- CPU/memory trend stable; no OOM/restarts
- DB connections steady; no queue backlog/threadpool saturation
- (If JVM is introduced) GC pauses stable

---

## Phase 6 – Analyze & Report
1) Pull metrics from `test-results/<date>/<sut>/<scenario>/summary.json` and `metrics.csv`.
2) Fill comparisons in [Testing_result.md](Testing_result.md) using monolith vs microservices tables.
3) Include docker/db logs and any tracing evidence for hop latency.

---

## Troubleshooting Quick Hits
- Error rate >5%: lower VU, increase think time, re-seed DB, check DB connections.
- Slow p95/p99: check CPU>90% (reduce load), disk I/O, missing indexes, noisy neighbor processes.
- Port conflict: phpMyAdmin now on 8081; gateway on 8080.
- State drift: always run reset/seed scripts between scenarios.

---

## Quality Checklist
- [ ] All k6 scenarios executed (baseline, stress, spike, soak-baseline, soak-stress)
- [ ] DB reset & seeded before every run
- [ ] Docker stats + DB metrics saved per scenario
- [ ] Results stored under `test-results/<date>/<sut>/<scenario>/`
- [ ] [Testing_result.md](Testing_result.md) updated with RPS, p50/p95/p99, error breakdowns
- [ ] Soak criteria evaluated (error trend, p95/p99 trend, CPU/mem, restarts)

Good luck and happy testing! 🚀
### Step 2: Wait for All Services
