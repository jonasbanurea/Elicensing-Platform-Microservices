# 🐳 Docker Deployment Guide - Jelita Microservices

Comprehensive guide to deploy, test, and scale the Jelita Licensing Service system using Docker & Docker Compose.

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Detailed Deployment Steps](#detailed-deployment-steps)
5. [Interoperability Testing](#interoperability-testing)
6. [Scalability Testing](#scalability-testing)
7. [Monitoring & Observability](#monitoring--observability)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ System Architecture

The Jelita system consists of 5 independent microservices:

```
┌─────────────────────────────────────────────────────────────┐
│                    Jelita Microservices                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Service │  │ Application  │  │   Workflow   │      │
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
│  │           MySQL Database (Shared Host)                │  │
│  │  - jelita_users      - jelita_survei                  │  │
│  │  - jelita_pendaftaran - jelita_arsip                  │  │
│  │  - jelita_workflow                                    │  │
│  │                    Port 3306                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              phpMyAdmin (Optional)                     │  │
│  │                    Port 8080                           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Services:
- **Auth Service (3001)**: Authentication, JWT token, user management
- **Application Service (3010)**: Submit and manage license applications
- **Workflow Service (3020)**: Internal processing (disposition, technical assessment)
- **Survey Service (3030)**: Manage SKM (Public Satisfaction Survey)
- **Archive Service (3040)**: Digital archiving with OPD access control

---

## ✅ Prerequisites

### Required Software:
- **Docker Desktop** (Windows/Mac) or Docker Engine (Linux)
  - Download: https://www.docker.com/products/docker-desktop
  - Minimum version: 20.10+
- **Docker Compose** v2.0+
  - Usually included in Docker Desktop
- **Git** (to clone/update code)
- **Postman** or **Newman** (for API testing)
- **k6** (optional, for load testing)

### Verify Installation:

```powershell
# Check Docker
docker --version
# Output: Docker version 24.0.x

# Check Docker Compose
docker-compose --version
# Output: Docker Compose version v2.x.x

# Check k6 (optional)
k6 version
```

---

## 🚀 Quick Start (5 Minutes)

### 1. Build and Run All Services

```powershell
# Navigate to prototype folder
cd d:\KULIAH\TESIS\prototype_eng

# Build and run all containers
docker-compose up -d --build
```

**Expected output:**
```
[+] Building 120.5s (65/65) FINISHED
[+] Running 7/7
 ✔ Network jelita-network       Created
 ✔ Volume "mysql_data"           Created
 ✔ Container jelita-mysql        Started
 ✔ Container jelita-phpmyadmin   Started
 ✔ Container jelita-auth         Started
 ✔ Container jelita-pendaftaran  Started
 ✔ Container jelita-workflow     Started
 ✔ Container jelita-survey       Started
 ✔ Container jelita-archive      Started
```

### 2. Setup Database Tables & Seed Data

```powershell
# Run database setup script
.\docker\setup-databases.ps1
```

### 3. Verify Services Running

```powershell
# Check container status
docker-compose ps

# Check logs for specific service
docker-compose logs auth-service
docker-compose logs archive-service

# Check all logs (follow mode)
docker-compose logs -f
```

### 4. Test API (Manual Quick Check)

```powershell
# Test Auth Service - Login
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"demo","password":"******"}'

# Option 3: Gunakan curl.exe (bukan alias PowerShell)
curl.exe -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"demo","password":"******"}'

# Output: {"success":true,"token":"eyJhbGc..."}
```

### 5. Akses phpMyAdmin (Optional)

Buka browser: **http://localhost:8080**
- Server: `mysql`
- Username: `root`
- Password: `*******`

---

## 📝 Detailed Deployment Steps

### Step 1: Environment Preparation

Ensure all `.env` files in each service are updated for Docker:

**Note**: Environment variables are already set in `docker-compose.yml`, but if you want to override, edit the `.env` file in each service folder.

```env
# Example .env for container (already in docker-compose.yml)
DB_HOST=mysql          # Not localhost!
DB_PORT=3306
DB_USER=root
DB_PASSWORD=*******
JWT_SECRET=FFbdqS6NVE7ARw08MNUAj0+sqXo7ZCEbZF7igEbMUH6tni78oAjzSPqYXvoyP02N
```

### Step 2: Build Images

```powershell
# Build all images without cache (fresh build)
docker-compose build --no-cache

# Or build specific service
docker-compose build auth-service
```

### Step 3: Run Stack

```powershell
# Run all services (detached mode)
docker-compose up -d

# Or run with visible logs
docker-compose up

# Run specific services only
docker-compose up -d mysql auth-service
```

### Step 4: Setup Database Schema

**Option A: Using Script (Recommended)**
```powershell
.\docker\setup-databases.ps1
```

**Option B: Manual per Service**
```powershell
# Auth Service
docker exec jelita-auth node scripts/setupDatabase.js
docker exec jelita-auth node scripts/createPemohonUser.js

# Pendaftaran Service
docker exec jelita-pendaftaran node scripts/setupDatabase.js

# Workflow Service
docker exec jelita-workflow node scripts/setupDatabase.js

# Survey Service
docker exec jelita-survey node scripts/setupDatabase.js

# Archive Service
docker exec jelita-archive node scripts/setupDatabase.js
```

### Step 5: Verify Health

```powershell
# Check health status of all containers
docker-compose ps

# Healthy output:
# NAME              STATUS                    PORTS
# jelita-auth       Up (healthy)              0.0.0.0:3001->3001/tcp
# jelita-archive    Up (healthy)              0.0.0.0:3040->3040/tcp
# ...

# Check logs for errors
docker-compose logs --tail=50 auth-service
```

### Step 6: Test Inter-Service Connectivity

```powershell
# Test from inside container (internal network)
docker exec jelita-survey sh -c "wget -qO- http://archive-service:3040/health"

# Test from host (localhost)
curl http://localhost:3001/health
curl http://localhost:3010/health
curl http://localhost:3020/health
curl http://localhost:3030/health
curl http://localhost:3040/health
```

---

## 🧪 Interoperability Testing

### Objective
Prove that the microservices system can communicate between services (service-to-service) and fulfill end-to-end business flows.

### Test Case 1: End-to-End Flow (Manual via Postman)

**Scenario**: Applicant submits application → Workflow processes → Survey → Archive

1. **Login as Admin**
   ```
   POST http://localhost:3001/api/auth/login
   Body: {"username":"demo","password":"*******"}
   ```
   Save `token` from response.

2. **Submit Application**
   ```
   POST http://localhost:3010/api/permohonan
   Headers: Authorization: Bearer {token}
   Body: {
     "nama_pemohon": "Test Docker",
     "jenis_izin": "IMB",
     "lokasi": "Jakarta"
   }
   ```
   Save `permohonan_id`.

3. **Trigger Workflow (Approval Simulation)**
   ```
   POST http://localhost:3020/api/workflow/disposisi
   Headers: Authorization: Bearer {token}
   Body: {
     "permohonan_id": {permohonan_id},
     "catatan": "Approved"
   }
   ```

4. **Trigger Survey (SKM)**
   ```
   POST http://localhost:3030/api/internal/trigger-pengarsipan
   Headers: Content-Type: application/json
   Body: {
     "permohonan_id": {permohonan_id},
     "nomor_registrasi": "REG-001",
     "user_id": 4,
     "triggered_from": "survei"
   }
   ```
   ✅ **Expected**: Archive Service called internally.

5. **Verify Archive Created**
   ```
   GET http://localhost:3040/api/arsip/1
   Headers: Authorization: Bearer {token}
   ```
   ✅ **Expected**: Archive data saved with status "pending".

### Test Case 2: Automated via Newman

```powershell
# Install Newman (if not yet installed)
npm install -g newman

# Run Archive Service collection
newman run layanan-arsip/postman/Archive_Service.postman_collection.json `
  -e layanan-arsip/postman/Archive_Service.postman_environment.json `
  --reporters cli,json `
  --reporter-json-export reports/interop-test.json

# Check results
cat reports/interop-test.json
```

**Interoperability Success Criteria:**
- ✅ All endpoints return status 200/201
- ✅ JWT token valid across all services
- ✅ Service-to-service call successful (Survey → Archive)
- ✅ Database entries consistent (foreign keys, timestamps)

---

## ⚡ Scalability Testing

### Objective
Measure the system's ability to handle high load and horizontal scaling.

### Load Testing Preparation

**Install k6** (if not yet installed):
```powershell
# Windows (via Chocolatey)
choco install k6

# Or download from https://k6.io/docs/get-started/installation/
```

### Test Case 3: Baseline Performance (Light Load)

Create file `tests/loadtest-baseline.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '10s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95) < 500'],  // 95% < 500ms
    'http_req_failed': ['rate < 0.01'],     // Error < 1%
  }
};

export default function() {
  // Login
  let loginRes = http.post('http://localhost:3001/api/auth/login', 
    JSON.stringify({username: 'demo', password: '*******'}),
    { headers: { 'Content-Type': 'application/json' }}
  );
  
  check(loginRes, {
    'login success': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined
  });

  sleep(1);
}
```

**Run Test:**
```powershell
k6 run tests/loadtest-baseline.js
```

**Output Analysis:**
```
scenarios: (100.00%) 1 scenario, 10 max VUs, 1m40s max duration
     data_received..................: 1.2 MB 12 kB/s
     data_sent......................: 156 kB 1.6 kB/s
     http_req_duration..............: avg=45ms  p(95)=120ms
     http_req_failed................: 0.00%  ✓ 0  ✗ 600
     http_reqs......................: 600    6/s
```

✅ **Baseline Metrics Recorded**: avg latency, p95, throughput (req/s)

### Test Case 4: Stress Test (Heavy Load)

Create file `tests/loadtest-stress.js` with options:

```javascript
export let options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp to 50 users
    { duration: '3m', target: 100 },  // Ramp to 100 users
    { duration: '2m', target: 200 },  // Ramp to 200 users (stress)
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95) < 2000'],  // 95% < 2s
    'http_req_failed': ['rate < 0.05'],      // Error < 5%
  }
};
```

**Run:**
```powershell
k6 run tests/loadtest-stress.js
```

**Observations:**
- Does latency increase linearly or exponentially?
- At what point does error rate start to rise?
- CPU/Memory usage of containers (see `docker stats`)

### Test Case 5: Horizontal Scaling (Multiple Instances)

**Scale Auth Service to 3 instances:**

```powershell
# Edit docker-compose.yml (add deploy section or use --scale)
docker-compose up -d --scale auth-service=3

# Verify
docker-compose ps auth-service
```

**⚠️ Note**: For load balancing, you need to add **nginx** or **Traefik** as a reverse proxy. Simple nginx example:

Create `docker/nginx.conf`:
```nginx
upstream auth_backend {
    server auth-service:3001;
    # If scaled, Docker Compose DNS round-robin automatic
}

server {
    listen 80;
    location /api/auth/ {
        proxy_pass http://auth_backend;
    }
}
```

Add in `docker-compose.yml`:
```yaml
nginx:
  image: nginx:alpine
  volumes:
    - ./docker/nginx.conf:/etc/nginx/nginx.conf
  ports:
    - "80:80"
  depends_on:
    - auth-service
  networks:
    - jelita-network
```

**Run load test again** and compare:
- Throughput increased?
- p95 latency decreased?
- Error rate stays low?

### Test Case 6: Database Bottleneck

If performance is poor, check MySQL:

```powershell
# Enter MySQL container
docker exec -it jelita-mysql mysql -uroot -pEnter*123

# Check slow queries
SHOW VARIABLES LIKE 'slow_query_log';
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

# View process list
SHOW FULL PROCESSLIST;
```

**Solutions**:
- Add indexing on frequently queried columns
- Use connection pooling (already in Sequelize)
- Scale MySQL (read replicas, sharding)

---

## 📊 Monitoring & Observability

### Quick Metrics with Docker Stats

```powershell
# Real-time resource usage
docker stats

# Output:
# CONTAINER       CPU %    MEM USAGE / LIMIT     NET I/O
# jelita-auth     2.5%     150MiB / 8GiB         1.2MB / 800kB
# jelita-mysql    8.3%     450MiB / 8GiB         5MB / 3MB
```

### Setup Prometheus + Grafana (Advanced)

Create `docker-compose.observability.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: jelita-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./docker/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - jelita-network

  grafana:
    image: grafana/grafana:latest
    container_name: jelita-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - jelita-network

volumes:
  prometheus_data:
  grafana_data:

networks:
  jelita-network:
    external: true
```

Create `docker/prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'nodejs-services'
    static_configs:
      - targets: 
        - 'auth-service:3001'
        - 'pendaftaran-service:3010'
        - 'workflow-service:3020'
        - 'survey-service:3030'
        - 'archive-service:3040'
```

**Run**:
```powershell
docker-compose -f docker-compose.observability.yml up -d

# Access Grafana: http://localhost:3000
# Login: admin / admin
```

---

## 🛠️ Troubleshooting

### Problem 1: Container Won't Start

```powershell
# Check logs
docker-compose logs auth-service

# Common issues:
# - Port already in use → change port mapping
# - Database not ready → wait for healthcheck
```

**Solution**:
```powershell
# Stop all
docker-compose down

# Remove volumes (reset DB)
docker-compose down -v

# Restart
docker-compose up -d --build
```

### Problem 2: Database Connection Failed

**Error**: `ECONNREFUSED mysql:3306`

**Solution**:
```powershell
# Ensure MySQL is healthy
docker-compose ps mysql

# Wait a few seconds for healthcheck
timeout 30

# Restart failed service
docker-compose restart auth-service
```

### Problem 3: Services Cannot Communicate

**Error**: `getaddrinfo ENOTFOUND archive-service`

**Debugging**:
```powershell
# Exec into container
docker exec -it jelita-survey sh

# Ping other service
ping archive-service

# Check DNS resolution
nslookup archive-service
```

**Solution**: Ensure all containers are on the same network (`jelita-network`).

### Problem 4: High Memory Usage

```powershell
# View detailed usage
docker stats --no-stream

# If MySQL is too large
docker exec jelita-mysql mysql -uroot -pEnter*123 -e "SHOW ENGINE INNODB STATUS\G" | grep "Buffer pool size"
```

**Solution**: Set resource limits in `docker-compose.yml`:
```yaml
services:
  mysql:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
```

---

## 🔐 Security Best Practices (Production)

1. **Don't hardcode credentials**:
   ```powershell
   # Use Docker secrets or .env file
   docker secret create mysql_root_password -
   ```

2. **Use non-root user** in Dockerfile:
   ```dockerfile
   RUN addgroup -S appgroup && adduser -S appuser -G appgroup
   USER appuser
   ```

3. **Scan images for vulnerabilities**:
   ```powershell
   docker scan jelita-auth:latest
   ```

---

## 📈 Testing Success Criteria

### Interoperability ✅
- [ ] All 5 services can communicate via Docker network
- [ ] JWT token valid across all services
- [ ] End-to-end flow successful (Submit → Workflow → Survey → Archive)
- [ ] Service-to-service internal calls successful (without token)
- [ ] Database foreign key relationships consistent

### Scalability ✅
- [ ] Baseline: 10 VUs → avg latency < 100ms, p95 < 500ms
- [ ] Stress: 200 VUs → p95 < 2s, error rate < 5%
- [ ] Horizontal scaling: 3 instances → throughput increases 2-3x
- [ ] Database not a bottleneck (optimal connection pool)
- [ ] Memory/CPU usage stable under load

### Resilience ✅
- [ ] Service auto-restarts if crashed (restart: unless-stopped)
- [ ] Healthcheck detects unhealthy service and restarts
- [ ] Idempotency: duplicate requests don't duplicate data
- [ ] Timeout and retry mechanism functioning
- [ ] Graceful degradation when one service is down

---

## 📚 References & Next Steps

### Related Documentation:
- `layanan-arsip/postman/QUICK_START.md` - Testing Archive Service
- `layanan-survei/TESTING_GUIDE.md` - Testing Survey Service
- Individual service `README.md` files

### Advanced Topics:
- **Kubernetes Deployment** - For production scale
- **CI/CD Pipeline** - GitHub Actions for auto deploy
- **Distributed Tracing** - OpenTelemetry + Jaeger
- **API Gateway** - Kong/Traefik for centralized routing

### Useful Commands:

```powershell
# Start all
docker-compose up -d

# Stop all
docker-compose down

# Rebuild all
docker-compose up -d --build --force-recreate

# View logs of all services
docker-compose logs -f

# Remove all (including volumes)
docker-compose down -v

# Exec into container
docker exec -it jelita-auth sh

# Scale service
docker-compose up -d --scale auth-service=3
```

---

## 👨‍💻 Contributors & Support

Created for Thesis: **Transforming Monolith System to Microservices**

Questions or issues? Open an issue in the repository or contact the maintainer.

---
