# Database Reset & Seed Scripts for Scaleout Configuration

## Overview

Scripts untuk reset dan seed database ketika menjalankan `docker-compose.scaleout.yml`. Scripts ini dirancang khusus untuk konfigurasi horizontal scaling yang memiliki multiple replicas per service.

## Perbedaan dengan Script Regular

### docker-compose.yml (Regular)
- Container names: `jelita-auth`, `jelita-pendaftaran`, `jelita-workflow`, dll
- Single instance per service
- Script: `reset-and-seed-microservices.ps1`

### docker-compose.scaleout.yml (Scaleout)
- Container names: `jelita-auth-scaled`, `jelita-pendaftaran-1/2/3`, `jelita-workflow-1/2/3`, dll
- Multiple replicas untuk bottleneck services
- Script: `reset-and-seed-scaleout.ps1` atau `reset-and-seed-microservices-scaleout.ps1`

## Scripts Available

### 1. reset-and-seed-scaleout.ps1 (Recommended)
Script lengkap dengan health check dan error handling.

**Features:**
- ✅ Container health check
- ✅ Detailed error messages
- ✅ Color-coded output
- ✅ Success/failure summary
- ✅ Parameter validation

**Usage:**
```powershell
# Reset all services
.\docker\reset-and-seed-scaleout.ps1

# Reset specific service
.\docker\reset-and-seed-scaleout.ps1 -Target pendaftaran

# Skip health check (faster)
.\docker\reset-and-seed-scaleout.ps1 -SkipHealthCheck
```

**Parameters:**
- `-Target`: Service to reset (`all`, `auth`, `pendaftaran`, `workflow`, `survey`, `archive`)
- `-SkipHealthCheck`: Skip container health verification

### 2. reset-and-seed-microservices-scaleout.ps1 (Simple)
Script sederhana untuk quick reset.

**Usage:**
```powershell
# Reset all services
.\docker\reset-and-seed-microservices-scaleout.ps1

# Reset specific service
.\docker\reset-and-seed-microservices-scaleout.ps1 -Target workflow
```

## Container Mapping

Script menggunakan **first replica** dari setiap scaled service karena semua replicas share database yang sama.

| Service | Regular Container | Scaleout Container | Replicas |
|---------|------------------|-------------------|----------|
| Auth | jelita-auth | jelita-auth-scaled | 1 |
| Pendaftaran | jelita-pendaftaran | jelita-pendaftaran-1 | 3 |
| Workflow | jelita-workflow | jelita-workflow-1 | 3 |
| Survey | jelita-survey | jelita-survey-1 | 2 |
| Archive | jelita-archive | jelita-archive-scaled | 1 |

## Seeded Data

Setelah script dijalankan, database akan berisi:

- **Users:**
  - 50 pemohon (pemohon1-pemohon50, password: pemohon1-pemohon50)
  - 10 admin (admin1-admin10, password: admin1-admin10)
  - 10 OPD staff (opd1-opd10, password: opd1-opd10)
  - 5 pimpinan (pimpinan1-pimpinan5, password: pimpinan1-pimpinan5)

- **Permohonan:**
  - 100 permohonan with documents
  - Linked to pemohon users

- **Workflow/Archive/Survey:**
  - Data linked to permohonan 1-30

Data ini **sama dengan monolith seed** untuk consistency testing.

## Prerequisites

1. Docker Desktop running
2. Scaleout services running:
   ```powershell
   docker compose -f docker-compose.scaleout.yml up -d
   ```

3. Wait for services to be healthy (30-60 seconds):
   ```powershell
   docker compose -f docker-compose.scaleout.yml ps
   ```

## Troubleshooting

### Container not running
```
❌ Container 'jelita-pendaftaran-1' is not running
```
**Solution:** Start scaleout services
```powershell
docker compose -f docker-compose.scaleout.yml up -d
```

### Reset/Seed failed
```
❌ Reset failed
Error: connect ECONNREFUSED
```
**Solution:** Wait for database to be ready
```powershell
# Check MySQL health
docker exec jelita-mysql-scaled mysqladmin ping -h localhost -pJelitaMySQL2024

# If not ready, wait 30 seconds and retry
Start-Sleep -Seconds 30
.\docker\reset-and-seed-scaleout.ps1
```

### Container not healthy
```
⚠️ Container is running but not healthy
```
**Solution:** Skip health check or wait longer
```powershell
# Option 1: Skip check
.\docker\reset-and-seed-scaleout.ps1 -SkipHealthCheck

# Option 2: Wait for services
docker compose -f docker-compose.scaleout.yml ps
# Wait until all show "healthy" or "running"
```

## Workflow Examples

### Full Reset Workflow
```powershell
# 1. Stop existing services
docker compose -f docker-compose.scaleout.yml down

# 2. Clean volumes (optional - fresh start)
docker compose -f docker-compose.scaleout.yml down -v

# 3. Start services
docker compose -f docker-compose.scaleout.yml up -d

# 4. Wait for health
Start-Sleep -Seconds 45

# 5. Reset and seed
.\docker\reset-and-seed-scaleout.ps1
```

### Quick Reset (Services Already Running)
```powershell
.\docker\reset-and-seed-scaleout.ps1
```

### Reset Single Service
```powershell
# Only reset pendaftaran database
.\docker\reset-and-seed-scaleout.ps1 -Target pendaftaran
```

## Performance Testing Workflow

```powershell
# 1. Start scaleout environment
docker compose -f docker-compose.scaleout.yml up -d
Start-Sleep -Seconds 45

# 2. Reset databases
.\docker\reset-and-seed-scaleout.ps1

# 3. Run load tests
$env:SUT = "microservices-scaled"
node .\loadtest\k6\run.js baseline microservices-scaled

# 4. Reset before next test
.\docker\reset-and-seed-scaleout.ps1

# 5. Run next test
node .\loadtest\k6\run.js stress microservices-scaled
```

## Important Notes

1. **Shared Database:** All replicas share the same database, jadi cukup reset dari satu replica saja

2. **Container Names:** Pastikan menggunakan container names dari scaleout config, bukan regular config

3. **Health Check:** Script akan check container health sebelum reset (can be skipped with `-SkipHealthCheck`)

4. **Data Consistency:** Seeded data sama dengan monolith untuk apple-to-apple comparison

5. **Error Handling:** Script akan continue jika satu service gagal, tapi akan report summary di akhir

## See Also

- [docker-compose.scaleout.yml](../docker-compose.scaleout.yml) - Scaleout configuration
- [reset-and-seed-microservices.ps1](reset-and-seed-microservices.ps1) - Regular config script
- [setup-databases.ps1](setup-databases.ps1) - Database initialization
