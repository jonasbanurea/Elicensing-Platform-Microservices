# Testing Guide - Survey (SKM) Service

## 📋 Daftar Isi
1. [Pendahuluan](#pendahuluan)
2. [Prasyarat](#prasyarat)
3. [Setup Environment](#setup-environment)
4. [Arsitektur SKM Flow](#arsitektur-skm-flow)
5. [Endpoint Overview](#endpoint-overview)
6. [Testing Step-by-Step](#testing-step-by-step)
7. [SKM Calculation](#skm-calculation)
8. [Troubleshooting](#troubleshooting)

---

## 1. Pendahuluan

### 1.1 Tentang Survey (SKM) Service
Survey Service adalah microservice yang mengelola **Survei Kepuasan Masyarakat (SKM)** yang wajib diisi oleh pemohon setelah izin disetujui. Service ini mengatur:

- **Notifikasi SKM**: Kirim notifikasi survei kepada pemohon
- **Form SKM**: Menyediakan 9 pertanyaan standar SKM
- **Submit SKM**: Pemohon mengisi dan submit survei
- **Rekap SKM**: Admin melihat statistik hasil survei
- **Unlock Download**: Buka akses download izin setelah SKM selesai
- **Trigger Archive**: Trigger pengarsipan setelah download

### 1.2 Port & Database
- **Port**: 3030
- **Database**: `jelita_survei`
- **Base URL**: `http://localhost:3030`

### 1.3 SKM Standar Nasional
Berdasarkan **Permenpan RB No. 14 Tahun 2017**, SKM mengukur 9 unsur pelayanan publik:

1. Persyaratan
2. Prosedur
3. Waktu Pelayanan
4. Biaya/Tarif
5. Produk Spesifikasi Jenis Pelayanan
6. Kompetensi Pelaksana
7. Perilaku Pelaksana
8. Sarana dan Prasarana
9. Penanganan Pengaduan, Saran, dan Masukan

### 1.4 Integrasi dengan Service Lain
```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  Application     │       │  Survey (SKM)    │       │  Archive         │
│  Service         │──────►│  Service         │──────►│  Service         │
│  (3010)          │       │  (3030)          │       │  (3040)          │
└──────────────────┘       └──────────────────┘       └──────────────────┘
      │                            │                            │
      │ 1. Izin Disetujui          │ 4. SKM Completed           │
      │ 2. Send Notifikasi         │ 5. Unlock Download         │
      │                            │ 6. Trigger Arsip           │
      │ 3. Pemohon Fill SKM        │                            │
      └────────────────────────────┘ 7. Download Izin           │
                                                                 │
                                     8. Arsipkan Dokumen ────────┘
```

---

## 2. Prasyarat

### 2.1 Software Requirements
✅ Node.js v14+ terinstall  
✅ MySQL Server 8.0+ running  
✅ Postman Desktop App atau Postman Web  
✅ User & Auth Service (Port 3001) berjalan  
✅ Application Service (Port 3010) berjalan  

### 2.2 Test Data Requirements
Pastikan Anda memiliki:
- ✅ User dengan role **Admin** (username: `demo`, password: `demo123`)
- ✅ User dengan role **Pemohon** (untuk testing submit SKM)
- ✅ Minimal 1 permohonan yang sudah disetujui dari Workflow Service

### 2.3 Database Setup
```bash
# Masuk ke direktori layanan-survei
cd d:\KULIAH\TESIS\prototype\layanan-survei

# Install dependencies
npm install

# Buat database
node scripts/createDatabase.js

# Sync models (create tables)
node scripts/setupDatabase.js
```

**Expected Output**:
```
✓ Database connection has been established successfully.
✓ All models were synchronized successfully.

✓ Tables in database:
  1. skm

✓ Database setup completed!
```

---

## 3. Setup Environment

### 3.1 Import Collection & Environment ke Postman

**Step 1: Import Collection**
1. Buka Postman
2. Click **Import** (kiri atas)
3. Drag & drop file: `postman/Survey_Service.postman_collection.json`
4. Click **Import**

**Step 2: Import Environment**
1. Click **Import** lagi
2. Drag & drop file: `postman/Survey_Service.postman_environment.json`
3. Click **Import**

**Step 3: Aktifkan Environment**
1. Pilih dropdown di kanan atas (No Environment)
2. Pilih **"Survey Service Environment"**

### 3.2 Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `survey_base_url` | `http://localhost:3030` | Base URL Survey Service |
| `auth_base_url` | `http://localhost:3001` | Base URL Auth Service |
| `application_base_url` | `http://localhost:3010` | Base URL Application Service |
| `archive_base_url` | `http://localhost:3040` | Base URL Archive Service |
| `accessToken` | (auto-saved) | JWT token dari login |
| `admin_username` | `demo` | Username untuk Admin |
| `admin_password` | `demo123` | Password untuk Admin |
| `permohonan_id` | (manual/auto) | ID permohonan dari Application Service |
| `pemohon_user_id` | (manual) | ID user pemohon |
| `skm_id` | (auto-saved) | ID SKM yang dibuat |

---

## 4. Arsitektur SKM Flow

### 4.1 Complete SKM Workflow

```
┌────────────────────────────────────────────────────────────────┐
│                    COMPLETE SKM FLOW                            │
└────────────────────────────────────────────────────────────────┘

1. PERMOHONAN DISETUJUI
   ├─ Workflow Service: Draft izin disetujui Pimpinan
   └─ Application Service: Update status permohonan = "Disetujui"

2. KIRIM NOTIFIKASI SKM
   ├─ Admin/OPD: POST /api/skm/notifikasi
   ├─ Create SKM record (status: pending)
   └─ Send email/SMS dengan link survei (production)

3. PEMOHON AKSES FORM SKM
   ├─ GET /api/skm/form (no auth)
   ├─ Tampilkan 9 pertanyaan standar SKM
   └─ Skala jawaban: 1-4 untuk setiap pertanyaan

4. PEMOHON SUBMIT SKM
   ├─ Pemohon: POST /api/skm/submit
   ├─ Update SKM record (status: completed)
   ├─ Calculate SKM value (0-100)
   └─ Determine category (Sangat Baik, Baik, Kurang Baik, Tidak Baik)

5. UNLOCK DOWNLOAD ACCESS
   ├─ Auto: POST /api/internal/buka-akses-download
   ├─ Update download_unlocked = true
   └─ Notify Application Service

6. PEMOHON DOWNLOAD IZIN
   ├─ Pemohon: GET /api/permohonan/:id/download-izin
   └─ Application Service return PDF izin

7. TRIGGER PENGARSIPAN
   ├─ Auto: POST /api/internal/trigger-pengarsipan
   ├─ Survey Service → Archive Service
   └─ Archive Service: Simpan dokumen ke arsip

8. ADMIN LIHAT REKAP SKM
   └─ Admin: GET /api/skm/rekap
```

### 4.2 Database Schema

**Table: `skm`**
```sql
CREATE TABLE skm (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permohonan_id INT NOT NULL,
  user_id INT NOT NULL COMMENT 'ID pemohon',
  nomor_registrasi VARCHAR(255),
  jawaban_json JSON NOT NULL COMMENT 'Jawaban survei',
  status ENUM('pending', 'completed') DEFAULT 'pending',
  submitted_at DATETIME,
  notified_at DATETIME,
  download_unlocked BOOLEAN DEFAULT FALSE,
  download_unlocked_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

---

## 5. Endpoint Overview

### 5.1 Summary Table

| # | Endpoint | Method | Role | Description |
|---|----------|--------|------|-------------|
| 1 | `/api/skm/notifikasi` | POST | Admin, OPD | Kirim notifikasi SKM |
| 2 | `/api/skm/form` | GET | Public | Get form SKM |
| 3 | `/api/skm/submit` | POST | Pemohon | Submit jawaban SKM |
| 4 | `/api/skm/rekap` | GET | Admin, OPD, Pimpinan | Rekap hasil SKM |
| 5 | `/api/internal/buka-akses-download` | POST | Internal | Unlock download |
| 6 | `/api/internal/trigger-pengarsipan` | POST | Internal | Trigger archive |

### 5.2 Authentication
- Endpoint 1, 3, 4: Memerlukan **Bearer Token** JWT
- Endpoint 2: **Public** (no auth)
- Endpoint 5, 6: **Internal** (no auth, service-to-service)

---

## 6. Testing Step-by-Step

### 6.1 Persiapan: Start Services

```bash
# Terminal 1 - Auth Service
cd d:\KULIAH\TESIS\prototype\layanan-manajemen-pengguna
npm start

# Terminal 2 - Application Service
cd d:\KULIAH\TESIS\prototype\layanan-pendaftaran
npm start

# Terminal 3 - Survey Service
cd d:\KULIAH\TESIS\prototype\layanan-survei
npm start
```

### 6.2 Test 1: Send Notifikasi SKM

**Objective**: Admin mengirim notifikasi kepada pemohon untuk mengisi SKM.

**Prerequisites**:
- ✅ Login sebagai Admin (token tersimpan)
- ✅ Memiliki `permohonan_id` yang sudah disetujui
- ✅ Memiliki `pemohon_user_id`

**Request**:
```http
POST http://localhost:3030/api/skm/notifikasi
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "permohonan_id": 1,
  "user_id": 5,
  "nomor_registrasi": "REG/2024/01/0001"
}
```

**Expected Response** (200 OK):
```json
{
  "message": "Notifikasi SKM berhasil dikirim",
  "data": {
    "permohonan_id": 1,
    "nomor_registrasi": "REG/2024/01/0001",
    "survey_link": "http://localhost:3030/survey/1",
    "skm_id": 1,
    "notified_at": "2024-01-20T10:00:00.000Z"
  }
}
```

**Validation Points**:
- ✅ Status code 200
- ✅ Response memiliki `survey_link`
- ✅ `skm_id` tersimpan di environment
- ✅ SKM record dibuat dengan status `'pending'`

---

### 6.3 Test 2: Get Form SKM

**Objective**: Pemohon mengakses form untuk melihat pertanyaan SKM.

**Prerequisites**:
- ✅ **TIDAK perlu login** (public endpoint)

**Request**:
```http
GET http://localhost:3030/api/skm/form
# NO AUTHORIZATION HEADER
```

**Expected Response** (200 OK):
```json
{
  "message": "Form SKM berhasil diambil",
  "data": {
    "title": "Survei Kepuasan Masyarakat (SKM)",
    "description": "Mohon luangkan waktu Anda untuk mengisi survei kepuasan layanan kami",
    "questions": [
      {
        "id": 1,
        "pertanyaan": "Bagaimana pendapat Saudara tentang kesesuaian persyaratan pelayanan dengan jenis pelayanannya?",
        "unsur": "Persyaratan",
        "skala": [
          { "nilai": 1, "label": "Tidak Sesuai" },
          { "nilai": 2, "label": "Kurang Sesuai" },
          { "nilai": 3, "label": "Sesuai" },
          { "nilai": 4, "label": "Sangat Sesuai" }
        ]
      },
      {
        "id": 2,
        "pertanyaan": "Bagaimana pemahaman Saudara tentang kemudahan prosedur pelayanan di unit ini?",
        "unsur": "Prosedur",
        "skala": [
          { "nilai": 1, "label": "Tidak Mudah" },
          { "nilai": 2, "label": "Kurang Mudah" },
          { "nilai": 3, "label": "Mudah" },
          { "nilai": 4, "label": "Sangat Mudah" }
        ]
      }
      // ... 7 pertanyaan lainnya
    ],
    "additional": {
      "saran": "Saran dan masukan untuk perbaikan layanan (opsional)"
    }
  }
}
```

**Validation Points**:
- ✅ Status code 200
- ✅ Form memiliki 9 pertanyaan
- ✅ Setiap pertanyaan memiliki skala 1-4
- ✅ Tidak memerlukan authentication

---

### 6.4 Test 3: Submit SKM

**Objective**: Pemohon submit jawaban survei SKM.

**Prerequisites**:
- ✅ Login sebagai **Pemohon** (token tersimpan)
- ✅ Memiliki `permohonan_id`

**Request**:
```http
POST http://localhost:3030/api/skm/submit
Authorization: Bearer {{accessToken}}  # Token Pemohon
Content-Type: application/json

{
  "permohonan_id": 1,
  "jawaban_json": {
    "answers": [
      {"id": 1, "nilai": 4, "unsur": "Persyaratan"},
      {"id": 2, "nilai": 4, "unsur": "Prosedur"},
      {"id": 3, "nilai": 3, "unsur": "Waktu Pelayanan"},
      {"id": 4, "nilai": 4, "unsur": "Biaya/Tarif"},
      {"id": 5, "nilai": 4, "unsur": "Produk Spesifikasi"},
      {"id": 6, "nilai": 4, "unsur": "Kompetensi Pelaksana"},
      {"id": 7, "nilai": 4, "unsur": "Perilaku Pelaksana"},
      {"id": 8, "nilai": 3, "unsur": "Sarana dan Prasarana"},
      {"id": 9, "nilai": 3, "unsur": "Penanganan Pengaduan"}
    ],
    "saran": "Pelayanan sudah sangat baik, hanya perlu peningkatan di sarana prasarana"
  }
}
```

**Expected Response** (201 Created):
```json
{
  "message": "Survei SKM berhasil disubmit",
  "data": {
    "skm_id": 1,
    "permohonan_id": 1,
    "status": "completed",
    "submitted_at": "2024-01-20T10:30:00.000Z",
    "score": {
      "total": 33,
      "average": "3.67",
      "skm_value": "91.67",
      "category": "Sangat Baik"
    }
  }
}
```

**Validation Points**:
- ✅ Status code 201
- ✅ Status berubah menjadi `'completed'`
- ✅ SKM value ter-calculate (0-100)
- ✅ Category ditentukan berdasarkan nilai SKM

---

### 6.5 Test 4: Get Rekap SKM

**Objective**: Admin melihat rekap dan statistik hasil SKM.

**Prerequisites**:
- ✅ Login sebagai **Admin/OPD/Pimpinan**
- ✅ Minimal 1 SKM sudah di-submit

**Request**:
```http
GET http://localhost:3030/api/skm/rekap?status=completed
Authorization: Bearer {{accessToken}}  # Token Admin
```

**Expected Response** (200 OK):
```json
{
  "message": "Rekap SKM berhasil diambil",
  "data": {
    "total_surveys": 5,
    "completed": 4,
    "pending": 1,
    "average_skm_value": "87.50",
    "category_distribution": {
      "Sangat Baik": 2,
      "Baik": 2,
      "Kurang Baik": 0,
      "Tidak Baik": 0
    },
    "surveys": [
      {
        "id": 1,
        "permohonan_id": 1,
        "nomor_registrasi": "REG/2024/01/0001",
        "status": "completed",
        "submitted_at": "2024-01-20T10:30:00.000Z",
        "skm_value": "91.67"
      },
      {
        "id": 2,
        "permohonan_id": 2,
        "nomor_registrasi": "REG/2024/01/0002",
        "status": "completed",
        "submitted_at": "2024-01-20T11:00:00.000Z",
        "skm_value": "83.33"
      }
    ]
  }
}
```

**Query Parameters**:
- `status`: Filter by status (`pending` or `completed`)
- `startDate`: Filter by tanggal awal (YYYY-MM-DD)
- `endDate`: Filter by tanggal akhir (YYYY-MM-DD)

**Validation Points**:
- ✅ Status code 200
- ✅ Statistik menampilkan average SKM value
- ✅ Category distribution tersedia
- ✅ List surveys dengan individual SKM values

---

### 6.6 Test 5: Buka Akses Download (Internal)

**Objective**: System otomatis unlock download access setelah SKM completed.

**Prerequisites**:
- ✅ SKM sudah di-submit (status: completed)

**Request**:
```http
POST http://localhost:3030/api/internal/buka-akses-download
Content-Type: application/json
# NO AUTHORIZATION HEADER (internal)

{
  "permohonan_id": 1
}
```

**Expected Response** (200 OK):
```json
{
  "message": "Akses download berhasil dibuka",
  "data": {
    "permohonan_id": 1,
    "download_unlocked": true,
    "download_unlocked_at": "2024-01-20T10:35:00.000Z"
  }
}
```

**Business Logic**:
1. Cek SKM record untuk `permohonan_id`
2. Validate SKM status = `'completed'`
3. Update `download_unlocked` = true
4. Notify Application Service (via axios)
5. Pemohon dapat download izin

**Validation Points**:
- ✅ Status code 200
- ✅ `download_unlocked` = true
- ✅ Timestamp `download_unlocked_at` terisi
- ✅ Tidak memerlukan authentication

---

### 6.7 Test 6: Trigger Pengarsipan (Internal)

**Objective**: System trigger Archive Service setelah pemohon download izin.

**Prerequisites**:
- ✅ Pemohon sudah download izin
- ✅ Archive Service berjalan di port 3040

**Request**:
```http
POST http://localhost:3030/api/internal/trigger-pengarsipan
Content-Type: application/json
# NO AUTHORIZATION HEADER (internal)

{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "user_id": 5
}
```

**Expected Response** (200 OK):
```json
{
  "message": "Pengarsipan berhasil ditrigger",
  "data": {
    "permohonan_id": 1,
    "archive_response": {
      "message": "Dokumen berhasil diarsipkan",
      "arsip_id": 1
    }
  }
}
```

**Business Logic**:
1. Survey Service menerima request dari Application Service
2. Survey Service call Archive Service `/api/internal/arsipkan-dokumen`
3. Archive Service simpan dokumen ke database
4. Return response ke caller

**Validation Points**:
- ✅ Status code 200
- ✅ Archive Service ter-trigger
- ✅ Response dari Archive Service ditampilkan
- ✅ Tidak memerlukan authentication

---

## 7. SKM Calculation

### 7.1 Formula Perhitungan

**Step 1: Hitung Total Score**
```
Total Score = Σ (Nilai setiap pertanyaan)
Contoh: 4 + 4 + 3 + 4 + 4 + 4 + 4 + 3 + 3 = 33
```

**Step 2: Hitung Average Score**
```
Average Score = Total Score / Jumlah Pertanyaan
Contoh: 33 / 9 = 3.67
```

**Step 3: Convert ke Skala 0-100**
```
SKM Value = (Average Score / 4) × 100
Contoh: (3.67 / 4) × 100 = 91.67
```

### 7.2 Kategori Nilai SKM

Berdasarkan Permenpan RB No. 14 Tahun 2017:

| Nilai SKM | Kategori | Mutu Pelayanan | Kinerja Unit Pelayanan |
|-----------|----------|----------------|------------------------|
| 88.31 - 100.00 | **Sangat Baik** | A | Sangat Baik |
| 76.61 - 88.30 | **Baik** | B | Baik |
| 65.00 - 76.60 | **Kurang Baik** | C | Kurang Baik |
| 25.00 - 64.99 | **Tidak Baik** | D | Tidak Baik |

### 7.3 Contoh Perhitungan

**Skenario 1: Nilai Sempurna**
```json
{
  "answers": [
    {"nilai": 4}, {"nilai": 4}, {"nilai": 4}, 
    {"nilai": 4}, {"nilai": 4}, {"nilai": 4},
    {"nilai": 4}, {"nilai": 4}, {"nilai": 4}
  ]
}
```
- Total: 36
- Average: 36/9 = 4.00
- SKM Value: (4/4) × 100 = **100.00** → **Sangat Baik**

**Skenario 2: Nilai Rata-rata**
```json
{
  "answers": [
    {"nilai": 3}, {"nilai": 3}, {"nilai": 3},
    {"nilai": 3}, {"nilai": 3}, {"nilai": 3},
    {"nilai": 3}, {"nilai": 3}, {"nilai": 3}
  ]
}
```
- Total: 27
- Average: 27/9 = 3.00
- SKM Value: (3/4) × 100 = **75.00** → **Kurang Baik**

**Skenario 3: Nilai Mixed**
```json
{
  "answers": [
    {"nilai": 4}, {"nilai": 4}, {"nilai": 3},
    {"nilai": 4}, {"nilai": 4}, {"nilai": 4},
    {"nilai": 4}, {"nilai": 3}, {"nilai": 3}
  ]
}
```
- Total: 33
- Average: 33/9 = 3.67
- SKM Value: (3.67/4) × 100 = **91.67** → **Sangat Baik**

---

## 8. Troubleshooting

### 8.1 Common Errors

#### Error: "SKM belum diselesaikan"
**Cause**: Trying to unlock download sebelum SKM completed  
**Solution**:
- Pastikan pemohon sudah submit SKM
- Check SKM status di database: `SELECT status FROM skm WHERE permohonan_id = 1;`

#### Error: "SKM tidak ditemukan"
**Cause**: Tidak ada SKM record untuk permohonan_id  
**Solution**:
- Kirim notifikasi dulu dengan endpoint `/api/skm/notifikasi`
- Atau submit SKM akan auto-create record baru

#### Error: "Failed to trigger Archive Service"
**Cause**: Archive Service tidak running atau URL salah  
**Solution**:
```bash
# Check Archive Service
netstat -ano | findstr :3040

# Check .env
ARCHIVE_SERVICE_URL=http://localhost:3040
```

#### Error: "Access denied. Required role: Pemohon"
**Cause**: Login dengan role selain Pemohon untuk submit SKM  
**Solution**:
- Login dengan user role Pemohon
- Endpoint submit SKM hanya untuk Pemohon

---

### 8.2 Database Verification

**Check SKM Records**:
```sql
SELECT * FROM jelita_survei.skm;
```

**Check SKM by Status**:
```sql
SELECT 
  id, 
  permohonan_id, 
  nomor_registrasi,
  status,
  download_unlocked,
  submitted_at
FROM jelita_survei.skm
WHERE status = 'completed';
```

**Calculate Manual SKM Value**:
```sql
SELECT 
  permohonan_id,
  jawaban_json,
  status,
  submitted_at
FROM jelita_survei.skm
WHERE permohonan_id = 1;
```

---

### 8.3 Testing Checklist

#### Pre-Flight Checklist
- [ ] MySQL Server running
- [ ] Database `jelita_survei` created
- [ ] Table `skm` created
- [ ] User & Auth Service running (port 3001)
- [ ] Application Service running (port 3010)
- [ ] Survey Service running (port 3030)
- [ ] Postman collection imported
- [ ] Postman environment imported & activated
- [ ] Test users created (Admin, Pemohon)
- [ ] At least 1 permohonan disetujui

#### Testing Flow Checklist
- [ ] **Test 1**: Login sebagai Admin → Token tersimpan
- [ ] **Test 2**: Send Notifikasi SKM → `skm_id` tersimpan
- [ ] **Test 3**: Get Form SKM → 9 pertanyaan ditampilkan
- [ ] **Test 4**: Login sebagai Pemohon → Token tersimpan
- [ ] **Test 5**: Submit SKM → SKM value ter-calculate
- [ ] **Test 6**: Get Rekap SKM → Statistik ditampilkan
- [ ] **Test 7**: Buka Akses Download → download_unlocked = true
- [ ] **Test 8**: Trigger Pengarsipan → Archive Service triggered
- [ ] **Test 9**: Verify all data in database

#### Validation Checklist
- [ ] All responses have correct status codes
- [ ] All automated Postman tests pass
- [ ] Environment variables auto-saved correctly
- [ ] Role-based access control working
- [ ] SKM calculation accurate
- [ ] Internal endpoints work without auth
- [ ] Service-to-service communication working

---

## 9. Integration Testing

### 9.1 End-to-End Flow

**Complete flow from Izin Disetujui to Arsip**:

```
1. [Workflow Service] POST /api/workflow/forward-to-pimpinan
   → Admin kirim draft ke Pimpinan
   
2. [Workflow Service] Pimpinan approve draft
   → Status draft = "disetujui"

3. [Application Service] Update permohonan status
   → Status = "Disetujui"

4. [Survey Service] POST /api/skm/notifikasi
   → Admin kirim notifikasi SKM ke pemohon

5. [Survey Service] GET /api/skm/form
   → Pemohon akses form SKM

6. [Survey Service] POST /api/skm/submit
   → Pemohon submit jawaban SKM
   → SKM value calculated

7. [Survey Service] POST /api/internal/buka-akses-download (auto)
   → Unlock download access
   → Notify Application Service

8. [Application Service] GET /api/permohonan/:id/download-izin
   → Pemohon download izin (PDF)

9. [Survey Service] POST /api/internal/trigger-pengarsipan (auto)
   → Trigger Archive Service

10. [Archive Service] POST /api/internal/arsipkan-dokumen
    → Dokumen disimpan ke arsip
```

### 9.2 Performance Benchmarks
- Notifikasi SKM: < 100ms
- Get Form SKM: < 50ms (static data)
- Submit SKM: < 150ms (with calculation)
- Rekap SKM: < 200ms (with stats calculation)
- Unlock Download: < 100ms
- Trigger Archive: < 150ms (network call)

---

## 10. Appendix

### 10.1 Sample SKM JSON

**Perfect Score (100)**:
```json
{
  "permohonan_id": 1,
  "jawaban_json": {
    "answers": [
      {"id": 1, "nilai": 4, "unsur": "Persyaratan"},
      {"id": 2, "nilai": 4, "unsur": "Prosedur"},
      {"id": 3, "nilai": 4, "unsur": "Waktu Pelayanan"},
      {"id": 4, "nilai": 4, "unsur": "Biaya/Tarif"},
      {"id": 5, "nilai": 4, "unsur": "Produk Spesifikasi"},
      {"id": 6, "nilai": 4, "unsur": "Kompetensi Pelaksana"},
      {"id": 7, "nilai": 4, "unsur": "Perilaku Pelaksana"},
      {"id": 8, "nilai": 4, "unsur": "Sarana dan Prasarana"},
      {"id": 9, "nilai": 4, "unsur": "Penanganan Pengaduan"}
    ],
    "saran": "Pelayanan sangat memuaskan!"
  }
}
```

**Average Score (75)**:
```json
{
  "permohonan_id": 2,
  "jawaban_json": {
    "answers": [
      {"id": 1, "nilai": 3, "unsur": "Persyaratan"},
      {"id": 2, "nilai": 3, "unsur": "Prosedur"},
      {"id": 3, "nilai": 3, "unsur": "Waktu Pelayanan"},
      {"id": 4, "nilai": 3, "unsur": "Biaya/Tarif"},
      {"id": 5, "nilai": 3, "unsur": "Produk Spesifikasi"},
      {"id": 6, "nilai": 3, "unsur": "Kompetensi Pelaksana"},
      {"id": 7, "nilai": 3, "unsur": "Perilaku Pelaksana"},
      {"id": 8, "nilai": 3, "unsur": "Sarana dan Prasarana"},
      {"id": 9, "nilai": 3, "unsur": "Penanganan Pengaduan"}
    ],
    "saran": "Pelayanan sudah baik, perlu ditingkatkan lagi"
  }
}
```

### 10.2 HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET/POST request |
| 201 | Created | Successful POST (SKM created) |
| 400 | Bad Request | SKM belum completed, validation error |
| 401 | Unauthorized | No token or invalid token |
| 403 | Forbidden | Token valid but wrong role |
| 404 | Not Found | SKM tidak ditemukan |
| 500 | Internal Server Error | Database error, archive service down |

---

## 📝 Conclusion

Selamat! Anda telah menyelesaikan setup dan testing untuk **Survey (SKM) Service**.

**What's Next**:
- ✅ Integrate dengan Archive Service
- ✅ Add email/SMS notification (production)
- ✅ Implement dashboard monitoring SKM
- ✅ Export SKM statistics to Excel/PDF
- ✅ Add reminder notification for pending SKM

**Support**:
- Documentation: `README.md`
- Postman Collection: `postman/Survey_Service.postman_collection.json`
- Environment: `postman/Survey_Service.postman_environment.json`

---

**Happy Testing! 🚀**
