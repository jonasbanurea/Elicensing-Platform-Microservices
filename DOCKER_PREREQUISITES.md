# ⚠️ PENTING: Panduan Memulai Docker

## Prasyarat Sebelum Menjalankan Docker Compose

### 1. Install Docker Desktop (Jika Belum)

**Windows:**
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Install dengan mengikuti wizard
3. Restart komputer jika diminta
4. Jalankan Docker Desktop dari Start Menu

**Verifikasi Docker Desktop Running:**
- Cari icon Docker 🐳 di system tray (pojok kanan bawah taskbar)
- Icon harus berwarna (bukan abu-abu)
- Klik icon, pastikan status "Docker Desktop is running"

### 2. Verifikasi Docker CLI

Buka PowerShell dan jalankan:

```powershell
docker --version
# Output: Docker version 28.x.x

docker-compose --version
# Output: Docker Compose version v2.x.x

docker ps
# Output: Daftar container (bisa kosong, tapi tidak error)
```

### 3. Start Docker Desktop

**Jika Docker Desktop belum running:**

```powershell
# Option 1: Buka dari Start Menu
# Search "Docker Desktop" → klik

# Option 2: Via Command Line (jika sudah di PATH)
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Tunggu 30-60 detik hingga Docker siap
timeout 60
```

**Cek Status:**
```powershell
docker info
# Jika berhasil, akan tampil info tentang Docker daemon
```

---

## 🚀 Setelah Docker Desktop Running

### Quick Start Commands

```powershell
# 1. Navigasi ke folder prototype
cd d:\KULIAH\TESIS\prototype

# 2. Build dan jalankan semua services
docker-compose up -d --build

# 3. Tunggu semua containers selesai build (~5-10 menit pertama kali)
# Cek progress:
docker-compose ps

# 4. Setup database
.\docker\setup-databases.ps1

# 5. Verifikasi health
curl http://localhost:3001/health
curl http://localhost:3010/health
curl http://localhost:3020/health
curl http://localhost:3030/health
curl http://localhost:3040/health
```

---

## 🐛 Troubleshooting

### Error: "The system cannot find the file specified"

**Penyebab:** Docker Desktop tidak running.

**Solusi:**
1. Start Docker Desktop dari Start Menu
2. Tunggu hingga icon 🐳 di system tray berwarna (bukan abu-abu)
3. Jalankan ulang `docker-compose up -d --build`

### Error: "port is already allocated"

**Penyebab:** Port sudah digunakan oleh service lokal Anda.

**Solusi Option 1 - Stop local services:**
```powershell
# Cari process di port 3001 (misalnya)
netstat -ano | findstr ":3001"

# Kill process
taskkill /F /PID <PID>
```

**Solusi Option 2 - Ubah port di docker-compose.yml:**
Edit file `docker-compose.yml`, contoh:
```yaml
auth-service:
  ports:
    - "4001:3001"  # Ubah 3001 ke 4001 (host:container)
```

### Error: "Cannot connect to Docker daemon"

**Solusi:**
1. Pastikan Docker Desktop running
2. Restart Docker Desktop
3. Restart komputer jika perlu

### Build Lambat / Timeout

**Tips:**
- Pastikan koneksi internet stabil (download base images)
- First build memang lambat (~10 menit), subsequent builds lebih cepat
- Gunakan `docker-compose build --parallel` untuk parallel build

---

## 📋 Checklist Sebelum Testing

- [ ] Docker Desktop installed dan running (icon 🐳 aktif)
- [ ] `docker ps` tidak error
- [ ] Port 3001, 3010, 3020, 3030, 3040, 3306, 8080 tersedia
- [ ] Koneksi internet stabil (untuk pull images)
- [ ] Minimal 8GB RAM available
- [ ] Minimal 20GB disk space available

---

## 💡 Tips Berguna

### Stop All Local Node Services

Sebelum menjalankan Docker, stop semua Node services lokal:

```powershell
# Cek semua Node processes
Get-Process node | Select-Object Id, ProcessName, @{Name="Port";Expression={(Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort}}

# Kill semua Node processes (HATI-HATI!)
Get-Process node | Stop-Process -Force
```

### Clean Docker Environment

Jika banyak masalah, reset Docker:

```powershell
# Stop semua containers
docker-compose down -v

# Remove semua unused images, containers, networks
docker system prune -a --volumes

# Start fresh
docker-compose up -d --build
```

### Monitor Resources

```powershell
# Real-time stats
docker stats

# Logs specific service
docker-compose logs -f auth-service

# Follow all logs
docker-compose logs -f
```

---

## ✅ Next Steps

Setelah Docker Desktop running dan containers up:

1. **Lihat DOCKER_QUICK_START.md** untuk testing cepat
2. **Lihat DOCKER_DEPLOYMENT_GUIDE.md** untuk panduan lengkap
3. **Run k6 tests**: `k6 run tests/loadtest-baseline.js`

---

**Butuh bantuan?** Pastikan Docker Desktop running dulu sebelum melanjutkan!
