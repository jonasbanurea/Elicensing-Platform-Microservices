# PANDUAN KOMPREHENSIF UJI TESTING ULANG
## Skalabilitas dan Interoperabilitas - Multi-Node Kubernetes

**Versi:** 2.0  
**Tanggal:** January 2026  
**Untuk:** Revisi Jurnal JASE Q2 Scopus  
**Infrastruktur:** 2 VM K3s (Master 4CPU/8GB, Worker 4CPU/6GB)  

---

## DAFTAR ISI

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Menjawab 6 Poin Penolakan Reviewer](#2-menjawab-6-poin-penolakan-reviewer)
3. [Prasyarat Sistem](#3-prasyarat-sistem)
4. [Setup Kubernetes Cluster](#4-setup-kubernetes-cluster)
5. [Build dan Deploy Microservices](#5-build-dan-deploy-microservices)
6. [Eksekusi Load Testing dengan K6](#6-eksekusi-load-testing-dengan-k6)
7. [Analisis Statistik](#7-analisis-statistik)
8. [Interoperability Testing](#8-interoperability-testing)
9. [Long-term Sustainability Testing](#9-long-term-sustainability-testing)
10. [Reporting dan Dokumentasi](#10-reporting-dan-dokumentasi)
11. [Troubleshooting](#11-troubleshooting)
12. [Lampiran](#12-lampiran)

---

## 1. RINGKASAN EKSEKUTIF

### 1.1 Tujuan Testing

Panduan ini dirancang untuk melakukan **uji testing ulang yang komprehensif** terhadap sistem e-licensing JELITA menggunakan arsitektur microservices pada **multi-node Kubernetes cluster** untuk menjawab 6 poin penolakan dari reviewer JASE Q2 Scopus.

### 1.2 Peningkatan dari Testing Sebelumnya

| Aspek | Testing Lama | Testing Baru (K8s) |
|-------|--------------|-------------------|
| **Infrastruktur** | Single-host Docker | Multi-node Kubernetes (2 VM) |
| **Distribusi** | 1 server | Master + Worker nodes |
| **Sample Size** | n=10 | n=30 (statistical validity) |
| **Statistik** | Basic comparison | Welch's t-test, MANOVA, Cohen's d, CI |
| **Interoperabilitas** | Mock OSS-RBA | Enhanced security & compliance checks |
| **Soak Test** | 5 hours | 24 hours |
| **Metrics** | Basic performance | K8s metrics, resource leak detection |

### 1.3 Baseline dan Stress Test Configuration

- **Baseline:** 35 Virtual Users
- **Stress:** 75 Virtual Users
- **Duration:** 10+ minutes per scenario
- **Runs:** 30 iterations per scenario
- **Total Test Time:** ~30 hours (excluding soak test)

---

## 2. MENJAWAB 6 POIN PENOLAKAN REVIEWER

### 2.1 Point #1: Production-Grade Environment Validation

**Penolakan Reviewer:**
> "The study's scalability and interoperability evaluations are constrained to a single-host Docker testbed... the absence of validation in multi-node clusters (e.g., Kubernetes) limits the generalizability of findings."

**Solusi Implementasi:**

✅ **Multi-Node Kubernetes Cluster**
- 2 VM dengan Ubuntu 24.04.3 LTS
- Master node: 4 CPU, 8GB RAM (control plane + workload)
- Worker node: 4 CPU, 6GB RAM (workload only)
- Real network latency & cross-node communication

✅ **Production-Grade Features**
- Horizontal Pod Autoscaler (HPA)
- Resource limits dan requests
- Network policies untuk service isolation
- Pod anti-affinity untuk distribusi beban
- Health checks (liveness & readiness probes)
- Service discovery via ClusterIP

**File Terkait:**
- `k8s/namespace.yaml`
- `k8s/*-deployment.yaml`
- `k8s/network-policies.yaml`

---

### 2.2 Point #5: Statistical Rigor

**Penolakan Reviewer:**
> "The scalability analysis uses Welch's t-tests... but the study's experimental design has notable statistical weaknesses. First, the sample size (n=10 runs per scenario) is small... Second, the manuscript does not report effect sizes or confidence intervals..."

**Solusi Implementasi:**

✅ **Sample Size: n=30**
- Memenuhi syarat minimum untuk parametric tests
- Memberikan statistical power yang cukup
- Mengurangi Type I dan Type II errors

✅ **Welch's T-Test**
- Tidak mengasumsikan equal variance
- Lebih robust untuk real-world data
- P-value dengan α = 0.05

✅ **Effect Size: Cohen's d**
- Mengukur practical significance
- Interpretasi: small (0.2), medium (0.5), large (0.8)
- Menunjukkan magnitude perbedaan

✅ **Confidence Intervals (95%)**
- Menunjukkan precision estimasi
- Visualisasi uncertainty
- Better decision making

✅ **MANOVA (Multivariate Analysis)**
- Menganalisis multiple dependent variables
- Mengurangi Type I error dari multiple tests
- Holistic view of performance

**File Terkait:**
- `scripts/statistical_analysis.py`
- `loadtest/k6/k8s-enhanced-test.js`

---

### 2.3 Point #4: Security and Governance in Interoperability

**Penolakan Reviewer:**
> "The SPBE checklist assessment reveals a 59.5% weighted maturity, with critical gaps in security/access control, auditability, and governance... the discussion of API security focuses on conformance tests but overlooks encryption, data privacy..."

**Solusi Implementasi:**

✅ **Security Compliance Testing**
- Authentication & authorization validation
- Invalid token rejection tests
- Sensitive data leak prevention
- Security headers verification (X-Frame-Options, X-XSS-Protection)
- HTTPS enforcement checks

✅ **Data Privacy Compliance (Indonesia PDP Law)**
- Personal data minimization
- Data masking for sensitive fields
- Consent mechanism tracking
- Right to access validation
- Data retention policy indicators

✅ **Governance Compliance**
- API versioning
- Rate limiting
- Request ID tracing
- Service identification
- Standard error codes
- SLA compliance (response time)

✅ **Audit Trail Validation**
- Transaction ID tracking
- Timestamp logging
- User context tracking
- Action type logging
- Data change tracking

**File Terkait:**
- `loadtest/k6/k8s-interoperability-test.js`

**Target Metrics:**
- Conformance Rate: >95%
- Security Compliance: >95%
- Privacy Compliance: >95%
- Governance Compliance: >90%
- Audit Trail: >98%

---

### 2.4 Point #6: Long-term Sustainability

**Penolakan Reviewer:**
> "While soak tests confirm short-term stability (5 hours), there is no analysis of performance degradation, resource leakage, or maintenance challenges over extended periods (e.g., 6–12 months)."

**Solusi Implementasi:**

✅ **24-Hour Soak Test**
- Constant 35 VU load
- Continuous monitoring
- Hourly statistics logging

✅ **Performance Degradation Detection**
- Linear regression for trend analysis
- Response time growth tracking
- Error rate monitoring over time
- Statistical significance testing (p-value)

✅ **Resource Leak Detection**
- Memory usage estimation
- Connection failure tracking
- Timeout error monitoring
- Active connections gauge

✅ **Hourly Reporting**
- Throughput per hour
- Error count per hour
- Error rate percentage
- Console logging every 1000 iterations

**File Terkait:**
- `loadtest/k6/k8s-soak-test.js`

**Metrics Tracked:**
- `response_time_growth` - Should remain stable
- `error_rate_over_time` - Should stay <5%
- `memory_usage_estimate` - No continuous growth
- `connection_failures` - Minimal
- `timeout_errors` - Minimal

---

### 2.5 Point #2: Migration Cost Analysis

**Solusi Dokumentasi:**

Meskipun tidak ada testing script khusus, panduan ini menyediakan template untuk cost-benefit analysis:

**Resource Requirements:**
- Development effort: Tracked via K8s deployment complexity
- Operational overhead: Measured via K8s metrics collection
- Training requirements: Documented in setup guide

**Cost Factors:**
- Infrastructure: 2 VM (documented specifications)
- Development time: Deployment manifest creation
- Testing time: 30+ hours for comprehensive testing
- Maintenance: HPA, monitoring, troubleshooting

**Benefit Quantification:**
- Throughput improvement (from statistical analysis)
- Scalability gains (HPA effectiveness)
- Reliability metrics (error rates, availability)
- Interoperability readiness (compliance scores)

---

### 2.6 Point #3: Service Boundary Rationale

**Solusi Dokumentasi:**

Testing ini memvalidasi **existing service decomposition** (6 microservices):

1. **User Management Service** - Authentication & authorization
2. **Registration Service** - Permohonan handling (high-frequency)
3. **Workflow Service** - Disposisi & approval flow (high-frequency)
4. **Survey Service** - SKM feedback (low-frequency)
5. **Archive Service** - Document archival (low-frequency)
6. **API Gateway** - Load balancing & routing

**Validation Metrics:**
- Service-specific latency tracking
- Resource usage per service (CPU, Memory)
- Scaling behavior per service (HPA metrics)
- Inter-service communication patterns

**Alternative Configurations:**
- Dokumentasikan actual resource usage
- Identifikasi bottleneck services
- Recommend optimizations based on data

---

## 3. PRASYARAT SISTEM

### 3.1 Hardware Requirements

**Master Node (VM 1):**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 25 GB
- OS: Ubuntu 24.04.3 LTS

**Worker Node (VM 2):**
- CPU: 4 cores
- RAM: 6 GB
- Storage: 20 GB
- OS: Ubuntu 24.04.3 LTS

**Host Machine (untuk menjalankan testing):**
- Windows 10/11 atau Linux
- 8GB RAM minimum
- Network access ke kedua VM

### 3.2 Software Requirements

**Di Kedua VM (Master & Worker):**
- Ubuntu 24.04.3 LTS
- K3s 1.28+
- Network connectivity between nodes

**Di Host Machine:**
- k6 (load testing tool)
- Python 3.8+
- kubectl (Kubernetes CLI)
- Git
- Code editor (VS Code recommended)

**Python Packages:**
```bash
pip install pandas numpy scipy statsmodels matplotlib seaborn
```

### 3.3 Network Requirements

- Static IP untuk Master node
- Static IP untuk Worker node
- Kedua VM dapat saling komunikasi
- Host machine dapat akses kedua VM
- Port 30000-32767 untuk NodePort services
- Port 6443 untuk Kubernetes API

---

## 4. SETUP KUBERNETES CLUSTER

### 4.1 Install K3s di Master Node

```bash
# SSH ke Master VM
ssh user@master-ip

# Update sistem
sudo apt update && sudo apt upgrade -y

# Install K3s master
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--bind-address=192.168.56.101 --advertise-address=192.168.56.101 --node-ip=192.168.56.101" sh -

# Wait for node to be ready
sudo k3s kubectl get nodes

# Setup kubectl untuk non-root user
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
export KUBECONFIG=~/.kube/config
echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc

# Verify installation
kubectl get nodes

# Get join token untuk worker
sudo cat /var/lib/rancher/k3s/server/node-token
# Simpan token ini, akan digunakan untuk join worker
```

### 4.2 Install K3s di Worker Node

```bash
# SSH ke Worker VM
ssh user@worker-ip

# Update sistem
sudo apt update && sudo apt upgrade -y

# Join sebagai agent (ganti <TOKEN> dengan token dari master)
# Ganti 192.168.56.101 dengan IP master anda
curl -sfL https://get.k3s.io | K3S_URL=https://192.168.56.101:6443 K3S_TOKEN=<TOKEN> INSTALL_K3S_EXEC="--node-ip=192.168.56.102" sh -

# Verify installation
sudo systemctl status k3s-agent
```

### 4.3 Verify Cluster

**Di Master Node:**

```bash
# Check nodes
kubectl get nodes

# Output harus menunjukkan 2 nodes:
# NAME            STATUS   ROLE                  AGE   VERSION
# master-node     Ready    control-plane,master  10m   v1.28.x
# worker-node     Ready    <none>                2m    v1.28.x

# Check if both nodes are ready
kubectl get nodes -o wide
```

### 4.4 Setup kubectl di Host Machine

**Linux/Mac:**

```bash
# Get kubeconfig from Master
ssh user@master-ip "cat ~/.kube/config" > ~/.kube/config

# Update server IP jika diperlukan
# Edit ~/.kube/config dan ganti IP jika menggunakan IP berbeda

# Test connection
kubectl get nodes
```

**Windows (PowerShell):**

```powershell
# Get kubeconfig from Master
ssh user@master-ip "cat ~/.kube/config" | Out-File -FilePath "$env:USERPROFILE\.kube\config" -Encoding UTF8

# Test connection
kubectl get nodes
```

### 4.5 Verify Cluster Health

```bash
# Check nodes
kubectl get nodes -o wide

# Check system pods
kubectl get pods -n kube-system

# Check cluster info
kubectl cluster-info

# Check metrics server (K3s has it built-in)
kubectl top nodes
```

**Expected Output:**

```
NAME          STATUS   ROLES                  AGE   VERSION
master-node   Ready    control-plane,master   15m   v1.28.x
worker-node   Ready    <none>                 8m    v1.28.x
```

---

## 5. BUILD DAN DEPLOY MICROSERVICES

### 5.1 Build Docker Images

**Pada Master Node:**

```bash
# Clone repository (jika belum)
git clone <your-repo-url>
cd prototype_engV3

# Build images untuk semua services
docker build -t jelita-user-management:latest ./layanan-manajemen-pengguna
docker build -t jelita-registration:latest ./layanan-pendaftaran
docker build -t jelita-workflow:latest ./layanan-alur-kerja
docker build -t jelita-survey:latest ./layanan-survei
docker build -t jelita-archive:latest ./layanan-arsip

# Verify images
docker images | grep jelita

# Save images untuk transfer
docker save jelita-user-management:latest -o user-management.tar
docker save jelita-registration:latest -o registration.tar
docker save jelita-workflow:latest -o workflow.tar
docker save jelita-survey:latest -o survey.tar
docker save jelita-archive:latest -o archive.tar

# Import ke K3s containerd
sudo k3s ctr images import user-management.tar
sudo k3s ctr images import registration.tar
sudo k3s ctr images import workflow.tar
sudo k3s ctr images import survey.tar
sudo k3s ctr images import archive.tar

# Verify images in K3s
sudo k3s ctr images ls | grep jelita
```

**Transfer Images ke Worker Node:**

```bash
# Copy tar files ke Worker
scp *.tar user@worker-ip:~/

# SSH to Worker dan import images
ssh user@worker-ip

# Import ke K3s containerd pada worker
sudo k3s ctr images import user-management.tar
sudo k3s ctr images import registration.tar
sudo k3s ctr images import workflow.tar
sudo k3s ctr images import survey.tar
sudo k3s ctr images import archive.tar

# Verify
sudo k3s ctr images ls | grep jelita
```

### 5.2 Deploy ke Kubernetes

**Dari Host Machine** (dengan kubectl configured):

```bash
cd prototype_engV3

# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# Verify namespace
kubectl get namespace jelita-system

# 2. Deploy MySQL
kubectl apply -f k8s/mysql-deployment.yaml

# Wait for MySQL to be ready
kubectl wait --for=condition=ready pod -l app=mysql -n jelita-system --timeout=300s

# 3. Deploy microservices
kubectl apply -f k8s/user-management-deployment.yaml
kubectl apply -f k8s/registration-deployment.yaml
kubectl apply -f k8s/workflow-deployment.yaml
kubectl apply -f k8s/survey-deployment.yaml
kubectl apply -f k8s/archive-deployment.yaml

# 4. Deploy API Gateway
kubectl apply -f k8s/api-gateway-deployment.yaml

# 5. Apply Network Policies
kubectl apply -f k8s/network-policies.yaml
```

### 5.3 Verify Deployment

```bash
# Check all resources
kubectl get all -n jelita-system

# Check pods
kubectl get pods -n jelita-system -o wide

# Check services
kubectl get services -n jelita-system

# Check HPA
kubectl get hpa -n jelita-system

# Check pod distribution across nodes
kubectl get pods -n jelita-system -o wide | awk '{print $1, $7}'
```

### 5.4 Initialize Database

```bash
# Get user-management pod name
USER_POD=$(kubectl get pods -n jelita-system -l app=user-management -o jsonpath='{.items[0].metadata.name}')

# Run setup script
kubectl exec -it $USER_POD -n jelita-system -- node scripts/setupDatabase.js

# Run seed script
kubectl exec -it $USER_POD -n jelita-system -- node scripts/seedDatabase.js
```

### 5.5 Get Access URL

```bash
# Get Master node IP
MASTER_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

# Get NodePort
NODE_PORT=$(kubectl get service api-gateway -n jelita-system -o jsonpath='{.spec.ports[0].nodePort}')

echo "Access URL: http://${MASTER_IP}:${NODE_PORT}"
# Contoh: http://192.168.1.100:30000
```

### 5.6 Test Connectivity

```bash
# Test from host machine
curl http://192.168.1.100:30000/api/users/health

# Should return OK or service health status
```

---

## 6. EKSEKUSI LOAD TESTING DENGAN K6

### 6.1 Install K6

**Windows (Chocolatey):**
```powershell
choco install k6
```

**Windows (Manual):**
1. Download dari https://k6.io/docs/getting-started/installation/
2. Extract dan tambahkan ke PATH

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### 6.2 Konfigurasi Environment Variables

**Windows (PowerShell):**
```powershell
$env:BASE_URL = "http://192.168.1.100:30000"
$env:OSS_RBA_URL = "http://localhost:4000"  # Jika mock OSS running
```

**Linux/Mac:**
```bash
export BASE_URL="http://192.168.1.100:30000"
export OSS_RBA_URL="http://localhost:4000"
```

### 6.3 Run Automated Testing Script

**Windows:**

```powershell
cd D:\KULIAH\TESIS\prototype_engV3

# Run all tests (baseline + stress + interop + analysis)
.\scripts\run-k8s-tests.ps1 -TestType all -BaseUrl "http://192.168.1.100:30000"

# Or run individual tests:
.\scripts\run-k8s-tests.ps1 -TestType baseline
.\scripts\run-k8s-tests.ps1 -TestType stress
.\scripts\run-k8s-tests.ps1 -TestType interop
```

**Linux/Mac:**

```bash
cd /path/to/prototype_engV3

# Make script executable
chmod +x scripts/run-k8s-tests.sh

# Run all tests
./scripts/run-k8s-tests.sh all

# Or run individual tests:
./scripts/run-k8s-tests.sh baseline
./scripts/run-k8s-tests.sh stress
./scripts/run-k8s-tests.sh interop
```

### 6.4 Manual Testing (jika script bermasalah)

**Baseline Test - Single Run:**

```bash
k6 run \
  --env BASE_URL="http://192.168.1.100:30000" \
  --env SUT="microservices-k8s" \
  --env SCENARIO="baseline" \
  --env RUN_NUMBER="1" \
  --env TEST_DATE="2026-01-18" \
  --env NODE_INFO="master-worker" \
  --out json=test-results/raw/k6-baseline-run1.json \
  loadtest/k6/k8s-enhanced-test.js
```

**Stress Test - Single Run:**

```bash
k6 run \
  --env BASE_URL="http://192.168.1.100:30000" \
  --env SUT="microservices-k8s" \
  --env SCENARIO="stress" \
  --env RUN_NUMBER="1" \
  --env TEST_DATE="2026-01-18" \
  --env NODE_INFO="master-worker" \
  --out json=test-results/raw/k6-stress-run1.json \
  loadtest/k6/k8s-enhanced-test.js
```

**For n=30 runs, use loop:**

**PowerShell:**
```powershell
for ($i=1; $i -le 30; $i++) {
    Write-Host "Running baseline test $i of 30..."
    k6 run `
      --env BASE_URL="http://192.168.1.100:30000" `
      --env SUT="microservices-k8s" `
      --env SCENARIO="baseline" `
      --env RUN_NUMBER="$i" `
      --out "json=test-results/raw/k6-baseline-run$i.json" `
      loadtest/k6/k8s-enhanced-test.js
    
    Start-Sleep -Seconds 30  # Cool-down
}
```

**Bash:**
```bash
for i in {1..30}; do
    echo "Running baseline test $i of 30..."
    k6 run \
      --env BASE_URL="http://192.168.1.100:30000" \
      --env SUT="microservices-k8s" \
      --env SCENARIO="baseline" \
      --env RUN_NUMBER="$i" \
      --out "json=test-results/raw/k6-baseline-run$i.json" \
      loadtest/k6/k8s-enhanced-test.js
    
    sleep 30  # Cool-down
done
```

### 6.5 Monitor During Testing

**Terminal 1 - Watch Pods:**
```bash
watch -n 2 'kubectl get pods -n jelita-system -o wide'
```

**Terminal 2 - Watch HPA:**
```bash
watch -n 5 'kubectl get hpa -n jelita-system'
```

**Terminal 3 - Resource Usage:**
```bash
watch -n 10 'kubectl top pods -n jelita-system'
```

**Terminal 4 - Logs (if needed):**
```bash
kubectl logs -f -l app=registration -n jelita-system --all-containers=true
```

---

## 7. ANALISIS STATISTIK

### 7.1 Install Python Dependencies

```bash
pip install pandas numpy scipy statsmodels matplotlib seaborn
```

### 7.2 Run Statistical Analysis

```bash
cd prototype_engV3

# Run analysis script
python scripts/statistical_analysis.py test-results/raw

# Output will be saved to test-results/analysis/
```

### 7.3 Output Files

Setelah analisis selesai, file-file berikut akan dibuat:

```
test-results/analysis/
├── raw_metrics.csv                              # Raw data dari semua runs
├── comparison_microservices-k8s_vs_monolith_baseline.csv
├── comparison_microservices-k8s_vs_monolith_stress.csv
├── statistical_report_microservices-k8s_vs_monolith_baseline.txt
├── statistical_report_microservices-k8s_vs_monolith_stress.txt
├── comparison_*.png                             # Box plots
├── degradation_analysis.csv                     # Soak test analysis
└── soak_test_time_series.png                   # Time-series plots
```

### 7.4 Interpretasi Hasil

**Welch's T-Test:**
- `p_value < 0.05`: Perbedaan signifikan secara statistik
- `p_value >= 0.05`: Tidak ada perbedaan signifikan

**Cohen's d (Effect Size):**
- `< 0.2`: Negligible effect
- `0.2 - 0.5`: Small effect
- `0.5 - 0.8`: Medium effect
- `> 0.8`: Large effect

**Confidence Intervals (95%):**
- Jika CI tidak overlap: Strong evidence of difference
- Jika CI overlap sedikit: Possible difference
- Jika CI overlap banyak: No clear difference

**Percent Difference:**
- Positif: Group 1 lebih tinggi dari Group 2
- Negatif: Group 1 lebih rendah dari Group 2
- Magnitude menunjukkan practical significance

### 7.5 Contoh Interpretasi

```
Metric: throughput
  Group 1 (K8s): Mean=150 req/s, CI=[145, 155]
  Group 2 (Docker): Mean=120 req/s, CI=[115, 125]
  p-value: 0.001 (significant)
  Cohen's d: 1.2 (large effect)
  Percent Difference: +25%

Interpretasi:
✅ Perbedaan signifikan secara statistik (p < 0.05)
✅ Effect size besar (Cohen's d > 0.8)
✅ K8s 25% lebih tinggi throughput
✅ Confidence intervals tidak overlap (strong evidence)
```

---

## 8. INTEROPERABILITY TESTING

### 8.1 Setup Mock OSS-RBA (jika belum ada)

```bash
cd prototype_engV3/mock-oss-rba

# Install dependencies
npm install

# Start mock server
node server-enhanced.js

# Server akan berjalan di http://localhost:4000
```

### 8.2 Run Interoperability Tests

```bash
k6 run \
  --env BASE_URL="http://192.168.1.100:30000" \
  --env OSS_RBA_URL="http://localhost:4000" \
  loadtest/k6/k8s-interoperability-test.js
```

### 8.3 Compliance Metrics

Test akan menghasilkan metrics berikut:

| Metric | Target | Description |
|--------|--------|-------------|
| `conformance_rate` | >95% | SPBE standard conformance |
| `security_compliance_rate` | >95% | Security requirements met |
| `privacy_compliance_rate` | >95% | Data privacy compliance (PDP) |
| `governance_compliance_rate` | >90% | API governance standards |
| `audit_trail_rate` | >98% | Audit logging coverage |

### 8.4 Review Results

```bash
# Results saved to test-results/
# File: interoperability-test-<timestamp>.json

# Check compliance summary
cat test-results/interoperability-test-*.json | jq '.compliance_summary'
```

**Contoh Output:**

```json
{
  "conformance_rate": "96.50%",
  "security_rate": "97.20%",
  "privacy_rate": "95.80%",
  "governance_rate": "92.30%",
  "audit_trail_rate": "98.50%",
  "overall_compliance": "96.06%"
}
```

---

## 9. LONG-TERM SUSTAINABILITY TESTING

### 9.1 Run Soak Test (24 Hours)

⚠️ **Warning:** Test ini akan berjalan selama 24 jam. Pastikan:
- Cluster stabil
- Monitoring aktif
- Tidak ada maintenance scheduled

```bash
# Start soak test
k6 run \
  --env BASE_URL="http://192.168.1.100:30000" \
  --env SOAK_DURATION="24h" \
  loadtest/k6/k8s-soak-test.js
```

**Atau gunakan script:**

```bash
# Automated script
./scripts/run-k8s-tests.sh soak

# Custom duration (e.g., 12 hours for testing)
./scripts/run-k8s-tests.sh soak 12h
```

### 9.2 Monitor Soak Test

**K8s Metrics (terminal terpisah):**

```bash
# Watch pod status
watch -n 30 'kubectl get pods -n jelita-system'

# Watch resource usage
watch -n 60 'kubectl top pods -n jelita-system'

# Watch HPA behavior
watch -n 60 'kubectl get hpa -n jelita-system'
```

**Collect Metrics Periodically:**

```bash
# Create monitoring script
cat > monitor-soak.sh << 'EOF'
#!/bin/bash
while true; do
    timestamp=$(date +%Y-%m-%d_%H-%M-%S)
    kubectl top pods -n jelita-system > "test-results/metrics_$timestamp.txt"
    kubectl get hpa -n jelita-system >> "test-results/metrics_$timestamp.txt"
    sleep 3600  # Every hour
done
EOF

chmod +x monitor-soak.sh
./monitor-soak.sh &
```

### 9.3 Expected Behaviors

**Healthy System:**
- ✅ Response time remains stable (no significant growth)
- ✅ Error rate stays < 5%
- ✅ Memory usage stable (no continuous increase)
- ✅ Connection failures minimal
- ✅ HPA scales appropriately

**Red Flags:**
- ❌ Response time increases linearly over time
- ❌ Error rate increases gradually
- ❌ Memory usage grows continuously
- ❌ Frequent connection failures
- ❌ Pod restarts increasing

### 9.4 Analyze Soak Test Results

```bash
# After 24 hours, run statistical analysis
python scripts/statistical_analysis.py test-results/raw

# Check degradation analysis
cat test-results/analysis/degradation_analysis.csv

# View time-series plot
# Open: test-results/analysis/soak_test_time_series.png
```

**Key Metrics to Review:**

1. **Response Time Growth:**
   - `slope` near 0: Stable (good)
   - `slope` positive & significant: Degradation (bad)

2. **Error Rate Over Time:**
   - Should remain < 5%
   - No increasing trend

3. **Percent Change:**
   - Response time: < 10% increase acceptable
   - Error rate: Should not increase

---

## 10. REPORTING DAN DOKUMENTASI

### 10.1 Generate Comprehensive Report

Script otomatis akan membuat template report:

```bash
# Report akan dibuat di: test-results/reports/COMPREHENSIVE_TEST_REPORT_<date>.md
```

### 10.2 Fill in Report Template

Edit file report dan isi dengan actual results:

```markdown
## 4. Performance Test Results

### 4.1 Baseline Scenario (35 VU)

**Summary Statistics (n=30 runs):**

| Metric | Mean | SD | 95% CI | Min | Max |
|--------|------|----|----|-----|-----|
| Throughput (req/s) | 150.5 | 12.3 | [146.2, 154.8] | 125 | 175 |
| Avg Response Time (ms) | 234.5 | 45.6 | [220.1, 248.9] | 180 | 320 |
| P95 Response Time (ms) | 450.2 | 78.9 | [425.3, 475.1] | 350 | 600 |
| Error Rate (%) | 1.2 | 0.5 | [1.0, 1.4] | 0.5 | 2.5 |

[... dan seterusnya]
```

### 10.3 Include Evidence

**Screenshots:**
- K8s dashboard showing pod distribution
- Grafana metrics (if available)
- HPA scaling events
- Resource usage over time

**Data Files:**
- CSV exports dari statistical analysis
- Charts & plots
- K8s metrics dumps

### 10.4 Create Presentation Slides

Buat slides untuk highlight:

1. **Multi-Node Setup:**
   - Diagram cluster architecture
   - Pod distribution across nodes

2. **Statistical Rigor:**
   - Sample size justification
   - Box plots with CI
   - Effect size interpretation

3. **Compliance Results:**
   - Compliance rate summary
   - Security validation results
   - Audit trail coverage

4. **Sustainability:**
   - 24-hour stability metrics
   - Degradation analysis
   - Resource leak detection

---

## 11. TROUBLESHOOTING

### 11.1 Kubernetes Issues

**Problem: Pods not starting**

```bash
# Check pod status
kubectl describe pod <pod-name> -n jelita-system

# Check logs
kubectl logs <pod-name> -n jelita-system

# Common issues:
# 1. ImagePullBackOff - Image tidak tersedia
# 2. CrashLoopBackOff - Container crash
# 3. Pending - Resource tidak cukup
```

**Solution:**

```bash
# For ImagePullBackOff:
# Verify image exists on node:
docker images | grep jelita

# For CrashLoopBackOff:
# Check application logs:
kubectl logs <pod-name> -n jelita-system --previous

# For Pending:
# Check node resources:
kubectl describe node <node-name>
kubectl top node
```

**Problem: HPA not scaling**

```bash
# Check HPA status
kubectl describe hpa <hpa-name> -n jelita-system

# Check metrics-server
kubectl top pods -n jelita-system

# If metrics-server not working (K3s has it built-in):
# Check metrics-server pods
kubectl get pods -n kube-system | grep metrics

# Restart metrics-server if needed
kubectl rollout restart deployment metrics-server -n kube-system
```

**Problem: Network policies blocking traffic**

```bash
# Temporarily disable network policies
kubectl delete networkpolicy --all -n jelita-system

# Run tests
# If tests pass, network policy is the issue

# Re-apply network policies
kubectl apply -f k8s/network-policies.yaml
```

### 11.2 K6 Testing Issues

**Problem: Connection refused**

```bash
# Check if API Gateway is accessible
curl http://192.168.1.100:30000/health

# Check service
kubectl get service api-gateway -n jelita-system

# Check if pods are running
kubectl get pods -n jelita-system
```

**Problem: High error rate in tests**

```bash
# Check application logs
kubectl logs -l app=registration -n jelita-system --tail=100

# Check database connectivity
kubectl exec -it <user-management-pod> -n jelita-system -- sh
# Inside pod:
mysql -h mysql -u root -pJelitaMySQL2024 -e "SHOW DATABASES;"
```

**Problem: K6 script errors**

```bash
# Test script locally first
k6 run --vus 1 --duration 10s loadtest/k6/k8s-enhanced-test.js

# Check environment variables
echo $BASE_URL
```

### 11.3 Statistical Analysis Issues

**Problem: Python package errors**

```bash
# Reinstall packages
pip install --upgrade pandas numpy scipy statsmodels matplotlib seaborn

# Or use virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate  # Windows
pip install pandas numpy scipy statsmodels matplotlib seaborn
```

**Problem: No data files found**

```bash
# Check if test results exist
ls -la test-results/raw/

# Verify JSON files are valid
cat test-results/raw/k6-*.json | jq .

# If files are corrupted, re-run tests
```

**Problem: MANOVA fails**

```bash
# MANOVA requires at least 2 groups
# If only testing K8s (no comparison), MANOVA will be skipped
# This is normal behavior

# If comparing K8s vs Docker, ensure both datasets exist
```

---

## 12. LAMPIRAN

### 12.1 File Structure

```
prototype_engV3/
├── k8s/                                    # Kubernetes manifests
│   ├── namespace.yaml
│   ├── mysql-deployment.yaml
│   ├── user-management-deployment.yaml
│   ├── registration-deployment.yaml
│   ├── workflow-deployment.yaml
│   ├── survey-deployment.yaml
│   ├── archive-deployment.yaml
│   ├── api-gateway-deployment.yaml
│   └── network-policies.yaml
├── loadtest/
│   └── k6/
│       ├── k8s-enhanced-test.js          # Main performance tests
│       ├── k8s-soak-test.js              # 24-hour soak test
│       └── k8s-interoperability-test.js  # Compliance tests
├── scripts/
│   ├── statistical_analysis.py           # Statistical analysis
│   ├── run-k8s-tests.sh                  # Bash automation
│   └── run-k8s-tests.ps1                 # PowerShell automation
├── test-results/
│   ├── raw/                              # K6 JSON outputs
│   ├── analysis/                         # Statistical results
│   └── reports/                          # Final reports
└── [existing microservices directories]
```

### 12.2 Command Cheat Sheet

**Kubernetes:**

```bash
# Get all resources
kubectl get all -n jelita-system

# Describe resource
kubectl describe <resource-type> <name> -n jelita-system

# View logs
kubectl logs <pod-name> -n jelita-system

# Execute command in pod
kubectl exec -it <pod-name> -n jelita-system -- /bin/sh

# Port forward (for debugging)
kubectl port-forward service/api-gateway 3000:3000 -n jelita-system

# Delete all resources in namespace
kubectl delete all --all -n jelita-system

# Scale deployment
kubectl scale deployment <name> --replicas=5 -n jelita-system

# View HPA
kubectl get hpa -n jelita-system -w

# View resource usage
kubectl top pods -n jelita-system
kubectl top nodes
```

**K6:**

```bash
# Basic run
k6 run script.js

# With VUs and duration
k6 run --vus 10 --duration 30s script.js

# With environment variables
k6 run --env BASE_URL=http://example.com script.js

# Output to JSON
k6 run --out json=output.json script.js

# View results
k6 inspect output.json
```

### 12.3 Resource Calculations

**Minimum Cluster Resources:**

```
Total: 6 CPU cores, 8 GB RAM

Breakdown:
- MySQL: 1 CPU, 2 GB RAM
- User Management: 2 pods × (0.5 CPU, 0.5 GB) = 1 CPU, 1 GB
- Registration: 3 pods × (0.6 CPU, 0.5 GB) = 1.8 CPU, 1.5 GB
- Workflow: 3 pods × (0.6 CPU, 0.5 GB) = 1.8 CPU, 1.5 GB
- Survey: 2 pods × (0.3 CPU, 0.25 GB) = 0.6 CPU, 0.5 GB
- Archive: 2 pods × (0.3 CPU, 0.25 GB) = 0.6 CPU, 0.5 GB
- API Gateway: 2 pods × (0.3 CPU, 0.25 GB) = 0.6 CPU, 0.5 GB

Total Requests: 6.4 CPU, 7.75 GB RAM
With overhead: ~8 CPU, 10 GB RAM recommended
```

**Our Setup:**
- Master: 4 CPU, 8 GB (sufficient for control plane + some workload)
- Worker: 4 CPU, 6 GB (additional workload capacity)
- **Total: 8 CPU, 8 GB** (tight but workable)

**Optimization Tips:**
- Keep MySQL on Master (single instance)
- Distribute microservices across both nodes
- Use pod anti-affinity
- Monitor and adjust replica counts based on actual load

### 12.4 Testing Timeline

**Phase 1: Setup (Day 1)**
- Install K3s on both VMs (1 hour)
- Join worker to master (15 minutes)
- Build and deploy microservices (2 hours)
- Verify deployment (1 hour)

**Phase 2: Performance Testing (Day 2-3)**
- Baseline testing: 30 runs × 15 min = 7.5 hours
- Cool-down periods: 30 runs × 30 sec = 15 min
- Stress testing: 30 runs × 12 min = 6 hours
- Cool-down periods: 15 min
- **Total: ~14-16 hours** (can run overnight)

**Phase 3: Interoperability Testing (Day 3)**
- Setup mock OSS-RBA (30 min)
- Run interoperability tests (1 hour)
- Review compliance results (1 hour)
- **Total: ~2.5 hours**

**Phase 4: Soak Testing (Day 4-5)**
- 24-hour soak test
- Periodic monitoring
- **Total: 24+ hours**

**Phase 5: Analysis & Reporting (Day 6)**
- Statistical analysis (1 hour)
- Generate reports (2 hours)
- Review and interpret results (3 hours)
- Prepare presentation (2 hours)
- **Total: ~8 hours**

**Total Time: 6 days (minimum)**

### 12.5 Expected Results Template

**Performance Comparison (Hypothesis):**

| Metric | Docker Single-Host | K8s Multi-Node | Expected Change |
|--------|-------------------|----------------|----------------|
| Throughput (baseline) | 120 req/s | 145-160 req/s | +20-33% |
| P95 Latency (baseline) | 500 ms | 450-550 ms | Similar |
| Error Rate (baseline) | <2% | <2% | Similar |
| Throughput (stress) | 180 req/s | 220-250 req/s | +22-39% |
| P95 Latency (stress) | 1200 ms | 1000-1400 ms | Similar/Better |
| Error Rate (stress) | <5% | <5% | Similar |

**Interoperability Compliance (Target):**

| Metric | Target | Expected |
|--------|--------|----------|
| SPBE Conformance | >95% | 96-98% |
| Security Compliance | >95% | 95-97% |
| Privacy Compliance | >95% | 95-97% |
| Governance Compliance | >90% | 92-95% |
| Audit Trail | >98% | 98-99% |

---

## KESIMPULAN

Panduan ini menyediakan framework komprehensif untuk:

✅ **Production-Grade Validation**
- Multi-node Kubernetes cluster
- Real distributed environment
- Production-like configurations

✅ **Statistical Rigor**
- n=30 sample size
- Welch's t-test, MANOVA
- Effect sizes & confidence intervals

✅ **Security & Governance**
- Comprehensive compliance testing
- SPBE/OSS-RBA validation
- Data privacy verification

✅ **Long-term Sustainability**
- 24-hour soak testing
- Degradation detection
- Resource leak monitoring

✅ **Reproducibility**
- Automated scripts
- Detailed documentation
- Troubleshooting guide

**Untuk Jurnal Revisi:**

Dokumentasikan semua hasil testing dengan:
1. Screenshots dari K8s cluster
2. Statistical analysis outputs
3. Compliance test results
4. Soak test degradation analysis
5. Comparative tables
6. Charts and visualizations

**Contact & Support:**
Jika ada pertanyaan atau issues, dokumentasikan di:
- GitHub Issues
- Testing log files
- Error screenshots

---

**Good luck with your testing! 🚀**

**Dibuat:** January 2026  
**Versi:** 2.0  
**Update:** Sesuai kebutuhan testing
