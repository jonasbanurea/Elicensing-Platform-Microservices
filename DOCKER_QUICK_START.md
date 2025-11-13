# 🚀 Quick Start - Docker Deployment Jelita Microservices

Panduan cepat 10 menit untuk menjalankan dan menguji sistem microservices Jelita.

## ⚡ Langkah Cepat

### 1. Build & Run (3 menit)

```powershell
# Dari folder d:\KULIAH\TESIS\prototype
cd d:\KULIAH\TESIS\prototype

# Build dan jalankan semua services
docker-compose up -d --build
```

**Output yang diharapkan:**
```
✔ Container jelita-mysql        Started
✔ Container jelita-phpmyadmin   Started
✔ Container jelita-auth         Started
✔ Container jelita-pendaftaran  Started
✔ Container jelita-workflow     Started
✔ Container jelita-survey       Started
✔ Container jelita-archive      Started
```

### 2. Setup Database (1 menit)

```powershell
# Jalankan script setup
.\docker\setup-databases.ps1
```

### 3. Verifikasi (1 menit)

```powershell
# Cek status containers
docker-compose ps

# Test health endpoints
curl http://localhost:3001/health  # Auth
curl http://localhost:3010/health  # Pendaftaran
curl http://localhost:3020/health  # Workflow
curl http://localhost:3030/health  # Survey
curl http://localhost:3040/health  # Archive
```

### 4. Test API (2 menit)

```powershell
# Login test
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"demo","password":"demo123"}'

# Simpan token dari response, lalu test endpoint lain
```

### 5. Akses phpMyAdmin (Optional)

Browser: **http://localhost:8080**
- Server: `mysql`
- Username: `root`
- Password: `Enter*123`

---

## 🧪 Testing

### Test Interoperabilitas (Newman)

```powershell
# Install Newman (jika belum)
npm install -g newman

# Run Archive Service tests
newman run layanan-arsip/postman/Archive_Service.postman_collection.json `
  -e layanan-arsip/postman/Archive_Service.postman_environment.json
```

### Test Skalabilitas (k6)

```powershell
# Install k6 (jika belum)
choco install k6

# Baseline test (10 VUs)
k6 run tests/loadtest-baseline.js

# Stress test (200+ VUs)
k6 run tests/loadtest-stress.js

# End-to-end integration
k6 run tests/test-e2e-integration.js
```

---

## 📊 Monitoring

```powershell
# Real-time resource usage
docker stats

# Logs service tertentu
docker-compose logs -f auth-service

# Logs semua services
docker-compose logs -f
```

---

## 🛑 Stop & Cleanup

```powershell
# Stop semua containers
docker-compose down

# Stop dan hapus volumes (reset DB)
docker-compose down -v

# Rebuild dari nol
docker-compose down -v
docker-compose up -d --build
```

---

## 📖 Dokumentasi Lengkap

Lihat **DOCKER_DEPLOYMENT_GUIDE.md** untuk:
- Arsitektur detail
- Load testing strategies
- Scaling experiments
- Observability setup (Prometheus + Grafana)
- Troubleshooting lengkap

---

## 🎯 Checklist Testing Tesis

### Interoperabilitas ✅
- [ ] Semua services dapat berkomunikasi
- [ ] JWT token valid di semua services
- [ ] End-to-end flow berhasil
- [ ] Service-to-service calls berhasil

### Skalabilitas ✅
- [ ] Baseline test: p95 < 500ms
- [ ] Stress test: p95 < 2s dengan 200 VUs
- [ ] Horizontal scaling: throughput meningkat
- [ ] Database tidak bottleneck

### Docker Deployment ✅
- [ ] Semua containers healthy
- [ ] Database initialized
- [ ] Health checks passing
- [ ] Network communication working

---

## 🆘 Troubleshooting Cepat

**Container tidak start?**
```powershell
docker-compose logs <service-name>
```

**Database connection error?**
```powershell
docker-compose restart mysql
timeout 10
docker-compose restart auth-service
```

**Port sudah digunakan?**
Edit `docker-compose.yml` dan ubah port mapping.

---

**Need Help?** Lihat DOCKER_DEPLOYMENT_GUIDE.md untuk troubleshooting lengkap.
