# 🏛️ Jelita Licensing Service - Microservices Architecture

> **Transformasi Sistem Monolith ke Microservices untuk Meningkatkan Skalabilitas dan Interoperabilitas**

Sistem Layanan Perizinan berbasis microservices menggunakan Node.js, Express, MySQL, dan Docker.

---

## 📖 Daftar Isi

- [Overview](#overview)
- [Arsitektur Microservices](#arsitektur-microservices)
- [Services](#services)
- [Quick Start](#quick-start)
- [Testing & Validation](#testing--validation)
- [Deployment](#deployment)
- [Dokumentasi](#dokumentasi)

---

## 🎯 Overview

### Rumusan Masalah yang Diselesaikan

1. **Skalabilitas**: Sistem monolith sulit di-scale, bottleneck di satu komponen menghambat seluruh sistem
2. **Interoperabilitas**: Sistem monolith sulit diintegrasikan dengan sistem eksternal

### Solusi Microservices

- ✅ **Horizontal Scaling**: Setiap service dapat di-scale independent
- ✅ **Independent Deployment**: Update satu service tanpa downtime keseluruhan
- ✅ **Technology Diversity**: Setiap service bisa gunakan tech stack berbeda
- ✅ **Fault Isolation**: Failure satu service tidak crash seluruh sistem
- ✅ **API-First Design**: Interoperabilitas via RESTful APIs

---

## 🏗️ Arsitektur Microservices

```
┌─────────────────────────────────────────────────────────────┐
│                  Jelita Microservices Ecosystem              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Service │  │ Pendaftaran  │  │   Workflow   │      │
│  │  Port 3001   │  │  Port 3010   │  │  Port 3020   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                           │                                  │
│         ┌─────────────────┴─────────────────┐               │
│         │                                    │               │
│  ┌──────▼───────┐              ┌────────────▼─┐            │
│  │Survey Service│              │Archive Service│            │
│  │  Port 3030   │              │  Port 3040    │            │
│  └──────────────┘              └───────────────┘            │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           MySQL Database (5 Databases)                │  │
│  │  - jelita_users      - jelita_survei                  │  │
│  │  - jelita_pendaftaran - jelita_arsip                  │  │
│  │  - jelita_workflow                                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Communication Patterns

- **Synchronous**: REST APIs dengan JWT authentication
- **Asynchronous**: Internal service-to-service calls (no auth)
- **Data**: Database per service (polyglot persistence)

---

## 🔧 Services

### 1. Auth Service (Port 3001)
**Tanggung Jawab**: Authentication & user management
- JWT token generation & validation
- User CRUD operations
- Role-based access control (Admin, OPD, Pimpinan, Pemohon)

**Database**: `jelita_users`
- Table: `users` (id, username, password_hash, nama_lengkap, email, nomor_hp, peran)

### 2. Pendaftaran Service (Port 3010)
**Tanggung Jawab**: Application submission & management
- Submit permohonan izin
- Upload dokumen persyaratan
- Track status permohonan

**Database**: `jelita_pendaftaran`
- Table: `permohonan` (id, user_id, jenis_izin, status, dll)

### 3. Workflow Service (Port 3020)
**Tanggung Jawab**: Internal processing workflow
- Disposisi permohonan
- Kajian teknis
- Approval/rejection flow

**Database**: `jelita_workflow`
- Tables: `disposisi`, `kajian_teknis`

### 4. Survey Service (Port 3030)
**Tanggung Jawab**: Survei Kepuasan Masyarakat (SKM)
- Collect feedback after license issuance
- Trigger archive service

**Database**: `jelita_survei`
- Table: `skm` (survey data)

### 5. Archive Service (Port 3040)
**Tanggung Jawab**: Digital archiving with access control
- Store final license documents
- OPD access management
- Archive retrieval with audit trail

**Database**: `jelita_arsip`
- Table: `arsip` (id, permohonan_id, file_path, metadata_json, hak_akses_opd, status)

---

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** running (Windows/Mac) atau Docker Engine (Linux)
- **Node.js 18+** (untuk development lokal)
- **MySQL 8.0** (jika run lokal tanpa Docker)
- **Postman** atau **Newman** (untuk API testing)
- **k6** (optional, untuk load testing)

### 1. Persiapan Docker

**⚠️ PENTING**: Pastikan Docker Desktop running!

```powershell
# Verifikasi Docker
docker --version
docker ps

# Jika error, lihat DOCKER_PREREQUISITES.md
```

### 2. Clone & Setup

```powershell
# Navigasi ke folder prototype
cd d:\KULIAH\TESIS\prototype

# Verifikasi struktur folder
ls
# Harus ada: layanan-manajemen-pengguna, layanan-pendaftaran, dll
```

### 3. Build & Run dengan Docker

```powershell
# Build dan jalankan semua services
docker-compose up -d --build

# Cek status (semua harus "healthy")
docker-compose ps

# Lihat logs
docker-compose logs -f
```

### 4. Setup Database

```powershell
# Jalankan script setup
.\docker\setup-databases.ps1

# Verifikasi via phpMyAdmin (optional)
# Browser: http://localhost:8080
# User: root / Password: Enter*123
```

### 5. Verify Services

```powershell
# Test health endpoints
curl http://localhost:3001/health  # Auth
curl http://localhost:3010/health  # Pendaftaran
curl http://localhost:3020/health  # Workflow
curl http://localhost:3030/health  # Survey
curl http://localhost:3040/health  # Archive
```

### 6. API Testing

```powershell
# Login test
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"demo","password":"demo123"}'

# Save token from response
# Use token for subsequent requests
```

**📚 Lihat dokumentasi lengkap**: [DOCKER_QUICK_START.md](DOCKER_QUICK_START.md)

---

## 🧪 Testing & Validation

### Tujuan Testing

1. **Interoperabilitas**: Membuktikan service dapat berkomunikasi
2. **Skalabilitas**: Mengukur performa di bawah load tinggi

### Test Suite

#### 1. Integration Tests (Newman/Postman)

```powershell
# Install Newman
npm install -g newman

# Run Archive Service tests
newman run layanan-arsip/postman/Archive_Service.postman_collection.json `
  -e layanan-arsip/postman/Archive_Service.postman_environment.json
```

**Kriteria Pass**:
- ✅ Semua endpoints return 200/201
- ✅ JWT token valid di semua services
- ✅ Service-to-service calls berhasil

#### 2. End-to-End Integration Tests (k6)

```powershell
# Install k6
choco install k6

# Run E2E test
k6 run tests/test-e2e-integration.js
```

**Flow yang di-test**:
1. Login Admin
2. Submit Permohonan
3. Workflow Disposisi
4. Trigger Archive
5. Archive Izin
6. Set Hak Akses OPD
7. Verify OPD Access

**Kriteria Pass**:
- ✅ Success rate ≥ 80%
- ✅ Data konsisten antar services

#### 3. Load Tests (Baseline)

```powershell
# Baseline: 10 Virtual Users
k6 run tests/loadtest-baseline.js
```

**Kriteria Pass**:
- ✅ p95 latency < 500ms
- ✅ Error rate < 1%
- ✅ Throughput ≥ 100 req/s

#### 4. Stress Tests (Skalabilitas)

```powershell
# Stress: 200+ Virtual Users
k6 run tests/loadtest-stress.js
```

**Kriteria Pass**:
- ✅ p95 latency < 2s
- ✅ Error rate < 5%
- ✅ System tidak crash

#### 5. Scaling Experiments

```powershell
# Scale Auth Service ke 3 instances
docker-compose up -d --scale auth-service=3

# Run load test lagi
k6 run tests/loadtest-baseline.js

# Compare: throughput meningkat?
```

**Expected Results**:
- 📈 Throughput meningkat 2-3x
- 📉 Latency turun atau stabil
- ✅ Load distributed across instances

---

## 📊 Monitoring & Observability

### Real-time Monitoring

```powershell
# Resource usage
docker stats

# Service logs
docker-compose logs -f auth-service
docker-compose logs -f archive-service
```

### Metrics Collection

Setiap service expose health endpoint:
- `GET /health` → `{"status":"healthy","service":"auth","timestamp":"..."}`

**Advanced** (optional): Setup Prometheus + Grafana
- Lihat [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md) bagian Observability

---

## 🔄 CI/CD Pipeline

### GitHub Actions

File: `.github/workflows/ci-tests.yml`

**Pipeline Stages**:
1. **Lint & Unit Tests** (parallel per service)
2. **Build Docker Images** (dengan caching)
3. **Integration Tests** (Newman + k6 E2E)
4. **Load Tests** (baseline + stress)
5. **Security Scan** (Trivy)

**Trigger**: Push ke `main`, PR, atau manual workflow dispatch

**Artifacts**: Test reports uploaded (JSON)

---

## 📁 Struktur Folder

```
prototype/
├── layanan-manajemen-pengguna/    # Auth Service
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── scripts/
│   ├── Dockerfile
│   ├── .env
│   └── server.js
├── layanan-pendaftaran/           # Pendaftaran Service
├── layanan-alur-kerja/            # Workflow Service
├── layanan-survei/                # Survey Service
├── layanan-arsip/                 # Archive Service
│   ├── postman/                   # Postman collections & env
│   └── ...
├── docker/
│   ├── init-db/                   # SQL init scripts
│   ├── setup-databases.ps1
│   └── setup-databases.sh
├── tests/
│   ├── loadtest-baseline.js       # k6 baseline
│   ├── loadtest-stress.js         # k6 stress
│   └── test-e2e-integration.js    # k6 E2E
├── reports/                       # Test results
├── .github/workflows/
│   └── ci-tests.yml               # CI/CD pipeline
├── docker-compose.yml
├── DOCKER_QUICK_START.md
├── DOCKER_DEPLOYMENT_GUIDE.md
├── DOCKER_PREREQUISITES.md
└── README.md                      # This file
```

---

## 📚 Dokumentasi

### Getting Started
- **[DOCKER_PREREQUISITES.md](DOCKER_PREREQUISITES.md)** - Setup Docker Desktop
- **[DOCKER_QUICK_START.md](DOCKER_QUICK_START.md)** - Quick 10-minute guide
- **[DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)** - Comprehensive deployment guide

### Testing Guides
- **Archive Service**: `layanan-arsip/postman/QUICK_START.md`
- **Survey Service**: `layanan-survei/TESTING_GUIDE.md`

### Load Testing
- **Baseline Test**: `tests/loadtest-baseline.js`
- **Stress Test**: `tests/loadtest-stress.js`
- **E2E Test**: `tests/test-e2e-integration.js`

---

## 🎓 Untuk Tesis

### Bukti Penyelesaian Rumusan Masalah

#### 1. Skalabilitas ✅

**Metrik**:
- Baseline (10 VUs): p95 < 500ms, throughput X req/s
- Stress (200 VUs): p95 < 2s, error rate < 5%
- Scaling (3x instances): throughput meningkat 2-3x

**Dokumentasi**:
- Load test reports: `reports/baseline-summary.json`, `reports/stress-summary.json`
- Docker stats screenshots
- Grafana dashboards (optional)

#### 2. Interoperabilitas ✅

**Metrik**:
- E2E flow success rate ≥ 80%
- Service-to-service calls berhasil (Survey → Archive)
- JWT validation di semua services
- API contracts (OpenAPI) konsisten

**Dokumentasi**:
- Newman test reports: `reports/newman-archive.json`
- E2E test reports: `reports/e2e-summary.json`
- Postman collections sebagai API documentation

---

## 🆘 Troubleshooting

### Docker tidak running

```powershell
# Start Docker Desktop dari Start Menu
# Tunggu icon 🐳 aktif

# Verifikasi
docker ps
```

### Port conflict

```powershell
# Cari process di port
netstat -ano | findstr ":3001"

# Kill process
taskkill /F /PID <PID>

# Atau ubah port di docker-compose.yml
```

### Container unhealthy

```powershell
# Cek logs
docker-compose logs auth-service

# Restart service
docker-compose restart auth-service

# Full reset
docker-compose down -v
docker-compose up -d --build
```

**Lihat troubleshooting lengkap**: [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md#troubleshooting)

---

## 🚀 Next Steps

1. **Development**:
   - Tambahkan unit tests per service
   - Implement contract testing (Pact)
   - Setup API gateway (Kong/Traefik)

2. **Production**:
   - Deploy ke Kubernetes
   - Setup monitoring (Prometheus + Grafana)
   - Implement distributed tracing (Jaeger)
   - Add circuit breakers (opossum)

3. **Security**:
   - HTTPS/TLS termination
   - Secret management (Vault)
   - Rate limiting & throttling
   - API versioning

---

## 📞 Support

Untuk pertanyaan atau issues:
1. Baca dokumentasi di folder ini
2. Cek [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md) troubleshooting section
3. Review GitHub Actions logs (jika menggunakan CI)

---

## 📄 License

Developed for thesis purpose - Transformasi Sistem Monolith ke Microservices

---

**Happy Testing! 🚀**
