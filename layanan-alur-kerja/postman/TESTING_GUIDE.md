# Testing Guide - Workflow Service (Layanan Alur Kerja)

## 📋 Daftar Isi
1. [Pendahuluan](#pendahuluan)
2. [Prasyarat](#prasyarat)
3. [Setup Environment](#setup-environment)
4. [Arsitektur Workflow](#arsitektur-workflow)
5. [Endpoint Overview](#endpoint-overview)
6. [Testing Step-by-Step](#testing-step-by-step)
7. [Role & Permissions](#role--permissions)
8. [Troubleshooting](#troubleshooting)

---

## 1. Pendahuluan

### 1.1 Tentang Workflow Service
Workflow Service adalah microservice yang mengelola **alur kerja internal** untuk pemrosesan permohonan izin dalam sistem Jelita. Service ini mengatur:

- **Disposisi**: Penugasan permohonan ke OPD (Organisasi Perangkat Daerah)
- **Kajian Teknis**: Review teknis oleh OPD
- **Draft Izin**: Pembuatan dan pengiriman draft izin ke Pimpinan
- **Revisi Draft**: Permintaan revisi dari Pimpinan

### 1.2 Port & Database
- **Port**: 3020
- **Database**: `jelita_workflow`
- **Base URL**: `http://localhost:3020`

### 1.3 Integrasi dengan Service Lain
```
┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│  User & Auth        │       │  Application        │       │  Workflow           │
│  Service (3001)     │◄──────┤  Service (3010)     │◄──────┤  Service (3020)     │
│                     │       │                     │       │                     │
│  - JWT Generation   │       │  - Permohonan       │       │  - Disposisi        │
│  - User Validation  │       │  - Registrasi       │       │  - Kajian Teknis    │
│                     │       │  - Trigger Workflow │       │  - Draft Izin       │
└─────────────────────┘       └─────────────────────┘       └─────────────────────┘
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
- ✅ User dengan role **OPD** (untuk testing kajian teknis)
- ✅ User dengan role **Pimpinan** (untuk testing revisi draft)
- ✅ Minimal 1 permohonan yang sudah ter-registrasi dari Application Service

### 2.3 Database Setup
```bash
# Masuk ke direktori layanan-alur-kerja
cd d:\KULIAH\TESIS\prototype\layanan-alur-kerja

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
  1. disposisi
  2. kajian_teknis
  3. draft_izin
  4. revisi_draft

✓ Database setup completed!
```

---

## 3. Setup Environment

### 3.1 Import Collection & Environment ke Postman

**Step 1: Import Collection**
1. Buka Postman
2. Click **Import** (kiri atas)
3. Drag & drop file: `postman/Workflow_Service.postman_collection.json`
4. Click **Import**

**Step 2: Import Environment**
1. Click **Import** lagi
2. Drag & drop file: `postman/Workflow_Service.postman_environment.json`
3. Click **Import**

**Step 3: Aktifkan Environment**
1. Pilih dropdown di kanan atas (No Environment)
2. Pilih **"Workflow Service Environment"**

### 3.2 Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `workflow_base_url` | `http://localhost:3020` | Base URL Workflow Service |
| `auth_base_url` | `http://localhost:3001` | Base URL Auth Service |
| `application_base_url` | `http://localhost:3010` | Base URL Application Service |
| `accessToken` | (auto-saved) | JWT token dari login |
| `admin_username` | `demo` | Username untuk Admin |
| `admin_password` | `demo123` | Password untuk Admin |
| `permohonan_id` | (manual/auto) | ID permohonan dari Application Service |
| `opd_user_id` | (manual) | ID user dengan role OPD |
| `disposisi_id` | (auto-saved) | ID disposisi yang dibuat |
| `kajian_id` | (auto-saved) | ID kajian teknis yang dibuat |
| `draft_id` | (auto-saved) | ID draft izin yang dibuat |
| `revisi_id` | (auto-saved) | ID revisi yang dibuat |

---

## 4. Arsitektur Workflow

### 4.1 Workflow Diagram

```
┌──────────────┐
│  Permohonan  │
│  Ter-        │
│  registrasi  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  1. DISPOSISI OPD    │  ◄─── Admin membuat disposisi
│  (Admin)             │       ke OPD tertentu
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  2. KAJIAN TEKNIS    │  ◄─── OPD melakukan kajian
│  (OPD)               │       (disetujui/ditolak/
└──────┬───────────────┘       perlu_revisi)
       │
       ▼
┌──────────────────────┐
│  3. DRAFT IZIN       │  ◄─── Admin membuat draft
│  (Admin)             │       & kirim ke Pimpinan
└──────┬───────────────┘
       │
       ├─────────────────────┐
       │                     │
       ▼                     ▼
┌──────────────┐      ┌─────────────────┐
│  DISETUJUI   │      │  4. REVISI      │  ◄─── Pimpinan minta
│  (Pimpinan)  │      │  (Pimpinan)     │       revisi draft
└──────────────┘      └─────┬───────────┘
                            │
                            ▼
                      ┌──────────────────┐
                      │  Admin perbaiki  │
                      │  draft (loop ke  │
                      │  step 3)         │
                      └──────────────────┘
```

### 4.2 Database Schema

**Table: `disposisi`**
```sql
CREATE TABLE disposisi (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permohonan_id INT NOT NULL,
  nomor_registrasi VARCHAR(255),
  opd_id INT NOT NULL COMMENT 'User ID dengan role OPD',
  disposisi_dari INT NOT NULL COMMENT 'User ID Admin yang membuat',
  catatan_disposisi TEXT,
  status ENUM('pending', 'dikerjakan', 'selesai', 'ditolak') DEFAULT 'pending',
  tanggal_disposisi DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

**Table: `kajian_teknis`**
```sql
CREATE TABLE kajian_teknis (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permohonan_id INT NOT NULL,
  opd_id INT NOT NULL,
  reviewer_id INT NOT NULL COMMENT 'User ID OPD yang review',
  hasil_kajian ENUM('disetujui', 'ditolak', 'perlu_revisi'),
  rekomendasi TEXT,
  catatan_teknis TEXT,
  lampiran JSON COMMENT 'Array of attachment objects',
  tanggal_kajian DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

**Table: `draft_izin`**
```sql
CREATE TABLE draft_izin (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permohonan_id INT NOT NULL,
  nomor_registrasi VARCHAR(255),
  nomor_draft VARCHAR(255) UNIQUE NOT NULL,
  isi_draft TEXT NOT NULL,
  dibuat_oleh INT NOT NULL COMMENT 'User ID Admin',
  status ENUM('draft', 'dikirim_ke_pimpinan', 'disetujui', 'perlu_revisi', 'ditolak') 
    DEFAULT 'draft',
  tanggal_kirim_pimpinan DATETIME,
  disetujui_oleh INT COMMENT 'User ID Pimpinan',
  tanggal_persetujuan DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

**Table: `revisi_draft`**
```sql
CREATE TABLE revisi_draft (
  id INT PRIMARY KEY AUTO_INCREMENT,
  draft_id INT NOT NULL REFERENCES draft_izin(id),
  diminta_oleh INT NOT NULL COMMENT 'User ID Pimpinan',
  catatan_revisi TEXT NOT NULL,
  status ENUM('pending', 'dikerjakan', 'selesai') DEFAULT 'pending',
  tanggal_revisi DATETIME DEFAULT CURRENT_TIMESTAMP,
  diselesaikan_oleh INT COMMENT 'User ID Admin',
  tanggal_selesai DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

---

## 5. Endpoint Overview

### 5.1 Summary Table

| # | Endpoint | Method | Role | Description |
|---|----------|--------|------|-------------|
| 1 | `/api/workflow/disposisi-opd` | POST | Admin | Membuat disposisi ke OPD |
| 2 | `/api/workflow/kajian-teknis` | POST | OPD | Input hasil kajian teknis |
| 3 | `/api/workflow/forward-to-pimpinan` | POST | Admin | Kirim draft ke Pimpinan |
| 4 | `/api/workflow/revisi-draft` | POST | Pimpinan | Minta revisi draft |
| 5 | `/api/internal/receive-trigger` | POST | Internal | Terima trigger dari App Service |

### 5.2 Authentication
Semua endpoint (kecuali #5) menggunakan **Bearer Token** JWT di header:
```
Authorization: Bearer <accessToken>
```

Token didapat dari endpoint `/api/auth/signin` di User & Auth Service (Port 3001).

---

## 6. Testing Step-by-Step

### 6.1 Persiapan: Login & Dapatkan Token

**Step 1: Start All Services**
```bash
# Terminal 1 - Auth Service
cd d:\KULIAH\TESIS\prototype\layanan-manajemen-pengguna
npm start

# Terminal 2 - Application Service
cd d:\KULIAH\TESIS\prototype\layanan-pendaftaran
npm start

# Terminal 3 - Workflow Service
cd d:\KULIAH\TESIS\prototype\layanan-alur-kerja
npm start
```

**Step 2: Login sebagai Admin**

Gunakan collection **User & Auth Service** di Postman:
- Request: `POST {{auth_base_url}}/api/auth/signin`
- Body:
```json
{
  "username": "demo",
  "password": "demo123"
}
```

**Expected Response** (200 OK):
```json
{
  "id": 1,
  "username": "demo",
  "nama_lengkap": "Demo Admin",
  "role": "Admin",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

✅ Token akan otomatis tersimpan di environment variable `accessToken`.

---

### 6.2 Test 1: Create Disposisi OPD

**Objective**: Admin menugaskan permohonan ke OPD untuk kajian teknis.

**Prerequisites**:
- ✅ Login sebagai Admin (token tersimpan)
- ✅ Memiliki `permohonan_id` dari Application Service
- ✅ Memiliki `opd_user_id` (ID user dengan role OPD)

**Request**:
```http
POST http://localhost:3020/api/workflow/disposisi-opd
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "opd_id": 2,
  "catatan_disposisi": "Mohon segera dilakukan kajian teknis untuk permohonan ini"
}
```

**Expected Response** (201 Created):
```json
{
  "message": "Disposisi ke OPD berhasil dibuat",
  "data": {
    "id": 1,
    "permohonan_id": 1,
    "nomor_registrasi": "REG/2024/01/0001",
    "opd_id": 2,
    "disposisi_dari": 1,
    "catatan_disposisi": "Mohon segera dilakukan kajian teknis untuk permohonan ini",
    "status": "pending",
    "tanggal_disposisi": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Automated Tests** (Postman):
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Disposisi has correct structure", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('id');
    pm.expect(jsonData.data.status).to.equal('pending');
});

// Save disposisi_id
pm.environment.set("disposisi_id", pm.response.json().data.id);
```

**Validation Points**:
- ✅ Status code 201
- ✅ Response memiliki `message` dan `data`
- ✅ `status` bernilai `'pending'`
- ✅ `disposisi_dari` terisi dengan ID user yang login (Admin)
- ✅ `tanggal_disposisi` terisi otomatis
- ✅ `disposisi_id` tersimpan di environment

---

### 6.3 Test 2: Input Kajian Teknis

**Objective**: OPD melakukan kajian teknis dan memberikan rekomendasi.

**Prerequisites**:
- ✅ Logout dari Admin, login sebagai **OPD**
- ✅ Memiliki `permohonan_id` yang akan dikaji

**Request**:
```http
POST http://localhost:3020/api/workflow/kajian-teknis
Authorization: Bearer {{accessToken}}  # Token OPD
Content-Type: application/json

{
  "permohonan_id": 1,
  "opd_id": 2,
  "hasil_kajian": "disetujui",
  "rekomendasi": "Permohonan disetujui dengan catatan untuk memperhatikan aspek lingkungan",
  "catatan_teknis": "Lokasi memenuhi syarat zonasi. Tidak ada kendala teknis yang signifikan.",
  "lampiran": [
    {
      "nama_file": "peta_lokasi_survey.pdf",
      "url": "/uploads/peta_lokasi_survey.pdf"
    },
    {
      "nama_file": "foto_kondisi_eksisting.jpg",
      "url": "/uploads/foto_kondisi.jpg"
    }
  ]
}
```

**Expected Response** (201 Created):
```json
{
  "message": "Kajian teknis berhasil dibuat",
  "data": {
    "id": 1,
    "permohonan_id": 1,
    "opd_id": 2,
    "reviewer_id": 2,
    "hasil_kajian": "disetujui",
    "rekomendasi": "Permohonan disetujui dengan catatan untuk memperhatikan aspek lingkungan",
    "catatan_teknis": "Lokasi memenuhi syarat zonasi. Tidak ada kendala teknis yang signifikan.",
    "lampiran": [
      {
        "nama_file": "peta_lokasi_survey.pdf",
        "url": "/uploads/peta_lokasi_survey.pdf"
      },
      {
        "nama_file": "foto_kondisi_eksisting.jpg",
        "url": "/uploads/foto_kondisi.jpg"
      }
    ],
    "tanggal_kajian": "2024-01-15T11:00:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z",
    "created_at": "2024-01-15T11:00:00.000Z"
  }
}
```

**Nilai `hasil_kajian` yang Valid**:
- `"disetujui"` - Permohonan direkomendasikan untuk disetujui
- `"ditolak"` - Permohonan tidak memenuhi syarat
- `"perlu_revisi"` - Perlu perbaikan/kelengkapan dokumen

**Automated Tests** (Postman):
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Reviewer ID filled automatically", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.reviewer_id).to.not.be.null;
});

pm.environment.set("kajian_id", pm.response.json().data.id);
```

**Validation Points**:
- ✅ Status code 201
- ✅ `reviewer_id` terisi otomatis dari JWT token (user yang login)
- ✅ `hasil_kajian` sesuai ENUM yang valid
- ✅ `lampiran` tersimpan sebagai JSON array
- ✅ `tanggal_kajian` terisi otomatis

---

### 6.4 Test 3: Forward Draft to Pimpinan

**Objective**: Admin membuat draft izin dan mengirimkannya ke Pimpinan untuk review.

**Prerequisites**:
- ✅ Login sebagai **Admin**
- ✅ Kajian teknis sudah selesai dengan hasil `"disetujui"`

**Request**:
```http
POST http://localhost:3020/api/workflow/forward-to-pimpinan
Authorization: Bearer {{accessToken}}  # Token Admin
Content-Type: application/json

{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "nomor_draft": "DRAFT/2024/01/0001",
  "isi_draft": "KEPUTUSAN KEPALA DAERAH\nNOMOR: DRAFT/2024/01/0001\n\nTENTANG\nPERSETUJUAN IZIN MENDIRIKAN BANGUNAN\n\nKEPALA DAERAH,\n\nMenimbang:\na. Bahwa berdasarkan permohonan dari Pemohon tertanggal 10 Januari 2024...\nb. Bahwa berdasarkan hasil kajian teknis dari Dinas Terkait...\n\nMengingat:\n1. Undang-Undang Nomor 28 Tahun 2002 tentang Bangunan Gedung;\n2. Peraturan Daerah Nomor 5 Tahun 2020 tentang Izin Mendirikan Bangunan;\n\nMEMUTUSKAN:\n\nMenetapkan:\nKESATU: Menyetujui permohonan izin mendirikan bangunan...\nKEDUA: Izin berlaku selama 2 (dua) tahun sejak ditetapkan...\nKETIGA: Keputusan ini mulai berlaku pada tanggal ditetapkan.\n\nDitetapkan di: Kota XYZ\nPada tanggal: 15 Januari 2024\n\nKEPALA DAERAH,\n\n(Nama Pejabat)\nNIP. 19700101 199001 1 001"
}
```

**Expected Response** (201 Created):
```json
{
  "message": "Draft izin berhasil dikirim ke pimpinan",
  "data": {
    "id": 1,
    "permohonan_id": 1,
    "nomor_registrasi": "REG/2024/01/0001",
    "nomor_draft": "DRAFT/2024/01/0001",
    "isi_draft": "KEPUTUSAN KEPALA DAERAH...",
    "dibuat_oleh": 1,
    "status": "dikirim_ke_pimpinan",
    "tanggal_kirim_pimpinan": "2024-01-15T14:00:00.000Z",
    "disetujui_oleh": null,
    "tanggal_persetujuan": null,
    "updated_at": "2024-01-15T14:00:00.000Z",
    "created_at": "2024-01-15T14:00:00.000Z"
  }
}
```

**Automated Tests** (Postman):
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Draft status is dikirim_ke_pimpinan", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.status).to.equal('dikirim_ke_pimpinan');
    pm.expect(jsonData.data).to.have.property('tanggal_kirim_pimpinan');
});

pm.environment.set("draft_id", pm.response.json().data.id);
```

**Validation Points**:
- ✅ Status code 201
- ✅ `status` otomatis menjadi `'dikirim_ke_pimpinan'`
- ✅ `tanggal_kirim_pimpinan` terisi otomatis
- ✅ `dibuat_oleh` terisi dengan ID Admin yang login
- ✅ `nomor_draft` harus unique (tidak boleh duplikat)

---

### 6.5 Test 4: Request Revisi Draft

**Objective**: Pimpinan meminta revisi terhadap draft izin yang dikirimkan.

**Prerequisites**:
- ✅ Logout dari Admin, login sebagai **Pimpinan**
- ✅ Memiliki `draft_id` yang akan direvisi

**Request**:
```http
POST http://localhost:3020/api/workflow/revisi-draft
Authorization: Bearer {{accessToken}}  # Token Pimpinan
Content-Type: application/json

{
  "draft_id": 1,
  "catatan_revisi": "Mohon untuk memperbaiki bagian pertimbangan hukum pada poin b. Tambahkan referensi ke Perda terbaru No. 5 Tahun 2024. Serta pastikan format penomoran sesuai dengan standar terbaru."
}
```

**Expected Response** (201 Created):
```json
{
  "message": "Permintaan revisi draft berhasil dibuat",
  "data": {
    "revisi": {
      "id": 1,
      "draft_id": 1,
      "diminta_oleh": 3,
      "catatan_revisi": "Mohon untuk memperbaiki bagian pertimbangan hukum...",
      "status": "pending",
      "tanggal_revisi": "2024-01-15T15:00:00.000Z",
      "diselesaikan_oleh": null,
      "tanggal_selesai": null,
      "updated_at": "2024-01-15T15:00:00.000Z",
      "created_at": "2024-01-15T15:00:00.000Z"
    },
    "draft": {
      "id": 1,
      "permohonan_id": 1,
      "nomor_registrasi": "REG/2024/01/0001",
      "nomor_draft": "DRAFT/2024/01/0001",
      "isi_draft": "KEPUTUSAN KEPALA DAERAH...",
      "dibuat_oleh": 1,
      "status": "perlu_revisi",  // ← Status updated
      "tanggal_kirim_pimpinan": "2024-01-15T14:00:00.000Z",
      "disetujui_oleh": null,
      "tanggal_persetujuan": null,
      "updated_at": "2024-01-15T15:00:00.000Z",
      "created_at": "2024-01-15T14:00:00.000Z"
    }
  }
}
```

**Automated Tests** (Postman):
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Draft status updated to perlu_revisi", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.draft.status).to.equal('perlu_revisi');
});

pm.test("Revisi record created with pending status", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.revisi.status).to.equal('pending');
});

pm.environment.set("revisi_id", pm.response.json().data.revisi.id);
```

**Validation Points**:
- ✅ Status code 201
- ✅ Draft status berubah menjadi `'perlu_revisi'`
- ✅ Record baru dibuat di tabel `revisi_draft`
- ✅ Revisi status default `'pending'`
- ✅ `diminta_oleh` terisi dengan ID Pimpinan yang login
- ✅ Response mengembalikan **both** revisi record AND updated draft

**Business Logic**:
1. Endpoint ini melakukan **2 operasi**:
   - Update status draft → `'perlu_revisi'`
   - Create new record di tabel `revisi_draft`
2. Admin akan melihat permintaan revisi dan memperbaiki draft
3. Setelah diperbaiki, Admin akan kirim ulang ke Pimpinan (loop ke Test 3)

---

### 6.6 Test 5: Receive Trigger (Internal)

**Objective**: Application Service memicu workflow setelah registrasi permohonan.

**Prerequisites**:
- ✅ Workflow Service berjalan di port 3020

**Note**: 
⚠️ Endpoint ini **BUKAN untuk testing manual** via Postman oleh user.  
⚠️ Endpoint ini dipanggil **OTOMATIS** oleh Application Service.

**How It Works**:
```javascript
// Di Application Service (layanan-pendaftaran)
// routes/permohonanRoutes.js - endpoint registrasi

const axios = require('axios');

router.post('/api/permohonan/:id/registrasi', async (req, res) => {
  // ... generate nomor registrasi ...
  
  // Trigger workflow service
  try {
    await axios.post('http://localhost:3020/api/internal/receive-trigger', {
      permohonan_id: id,
      opd_id: assignedOpdId
    });
  } catch (error) {
    console.error('Failed to trigger workflow:', error.message);
  }
  
  // ... return response ...
});
```

**Request** (jika ingin test manual):
```http
POST http://localhost:3020/api/internal/receive-trigger
Content-Type: application/json
# NO AUTHORIZATION HEADER (internal communication)

{
  "permohonan_id": 1,
  "opd_id": 2
}
```

**Expected Response** (201 Created):
```json
{
  "id": 1,
  "permohonan_id": 1,
  "opd_id": 2,
  "status": "Pending",
  "updated_at": "2024-01-15T16:00:00.000Z",
  "created_at": "2024-01-15T16:00:00.000Z"
}
```

**Validation Points**:
- ✅ Status code 201
- ✅ **TIDAK memerlukan authentication** (no Bearer token)
- ✅ Otomatis create record Disposisi dengan status `'Pending'`
- ✅ Dipanggil oleh Application Service, bukan oleh user

---

## 7. Role & Permissions

### 7.1 Role Matrix

| Endpoint | Pemohon | Admin | OPD | Pimpinan |
|----------|---------|-------|-----|----------|
| `POST /api/workflow/disposisi-opd` | ❌ | ✅ | ❌ | ❌ |
| `POST /api/workflow/kajian-teknis` | ❌ | ❌ | ✅ | ❌ |
| `POST /api/workflow/forward-to-pimpinan` | ❌ | ✅ | ❌ | ❌ |
| `POST /api/workflow/revisi-draft` | ❌ | ❌ | ❌ | ✅ |
| `POST /api/internal/receive-trigger` | N/A | N/A | N/A | N/A |

### 7.2 Role Descriptions

**Admin**:
- Membuat disposisi ke OPD
- Membuat draft izin
- Mengirim draft ke Pimpinan
- Memperbaiki draft berdasarkan revisi

**OPD (Organisasi Perangkat Daerah)**:
- Melakukan kajian teknis
- Memberikan rekomendasi (disetujui/ditolak/perlu_revisi)
- Upload lampiran hasil survey

**Pimpinan**:
- Review draft izin
- Menyetujui atau meminta revisi draft
- Memberikan catatan revisi

**Pemohon**:
- Tidak memiliki akses ke Workflow Service
- Hanya dapat melihat status melalui Application Service

---

## 8. Troubleshooting

### 8.1 Common Errors

#### Error: "Token tidak valid atau sudah kadaluarsa"
**Cause**: JWT token expired (default 1 hour)  
**Solution**:
```bash
# Login ulang untuk mendapat token baru
POST {{auth_base_url}}/api/auth/signin
```

#### Error: "Access denied. Required role: Admin"
**Cause**: Mencoba akses endpoint dengan role yang salah  
**Solution**:
- Pastikan login dengan user yang memiliki role yang sesuai
- Lihat Role Matrix di section 7.1

#### Error: "Duplicate entry for key 'nomor_draft'"
**Cause**: `nomor_draft` harus unique  
**Solution**:
```json
{
  "nomor_draft": "DRAFT/2024/01/0002"  // Increment nomor
}
```

#### Error: "Draft tidak ditemukan"
**Cause**: `draft_id` tidak ada di database  
**Solution**:
- Pastikan sudah membuat draft dengan endpoint forward-to-pimpinan
- Cek `draft_id` di environment variable

#### Error: "Cannot read property 'id' of undefined"
**Cause**: Token tidak terbaca atau middleware auth error  
**Solution**:
```javascript
// Pastikan header Authorization ada
Authorization: Bearer {{accessToken}}

// Pastikan environment variable accessToken terisi
console.log(pm.environment.get("accessToken"));
```

---

### 8.2 Database Verification

**Check Disposisi**:
```sql
SELECT * FROM jelita_workflow.disposisi;
```

**Check Kajian Teknis**:
```sql
SELECT * FROM jelita_workflow.kajian_teknis;
```

**Check Draft Izin**:
```sql
SELECT * FROM jelita_workflow.draft_izin;
```

**Check Revisi**:
```sql
SELECT * FROM jelita_workflow.revisi_draft;
```

**Join Query - Full Workflow**:
```sql
SELECT 
  d.nomor_registrasi,
  d.status AS disposisi_status,
  kt.hasil_kajian,
  kt.rekomendasi,
  di.nomor_draft,
  di.status AS draft_status,
  rd.catatan_revisi
FROM disposisi d
LEFT JOIN kajian_teknis kt ON d.permohonan_id = kt.permohonan_id
LEFT JOIN draft_izin di ON d.permohonan_id = di.permohonan_id
LEFT JOIN revisi_draft rd ON di.id = rd.draft_id
WHERE d.permohonan_id = 1;
```

---

### 8.3 Server Logs

**Enable Debug Logs**:
```javascript
// server.js - tambahkan middleware logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Body:', req.body);
  console.log('User:', req.user);
  next();
});
```

**Check Server Status**:
```bash
# Windows PowerShell
netstat -ano | findstr :3020

# Jika ada proses, kill dengan PID
taskkill /PID <PID> /F
```

---

## 9. Testing Checklist

### 9.1 Pre-Flight Checklist
- [ ] MySQL Server running
- [ ] Database `jelita_workflow` created
- [ ] All tables created (disposisi, kajian_teknis, draft_izin, revisi_draft)
- [ ] User & Auth Service running (port 3001)
- [ ] Application Service running (port 3010)
- [ ] Workflow Service running (port 3020)
- [ ] Postman collection imported
- [ ] Postman environment imported & activated
- [ ] Test users created (Admin, OPD, Pimpinan)
- [ ] At least 1 permohonan ter-registrasi

### 9.2 Testing Flow Checklist
- [ ] **Test 1**: Login sebagai Admin → Token tersimpan
- [ ] **Test 2**: Create Disposisi OPD → `disposisi_id` tersimpan
- [ ] **Test 3**: Login sebagai OPD → Token tersimpan
- [ ] **Test 4**: Input Kajian Teknis → `kajian_id` tersimpan
- [ ] **Test 5**: Login sebagai Admin → Token tersimpan
- [ ] **Test 6**: Forward Draft to Pimpinan → `draft_id` tersimpan
- [ ] **Test 7**: Login sebagai Pimpinan → Token tersimpan
- [ ] **Test 8**: Request Revisi Draft → `revisi_id` tersimpan
- [ ] **Test 9**: Verify all data in database

### 9.3 Validation Checklist
- [ ] All responses have correct status codes
- [ ] All automated Postman tests pass
- [ ] Environment variables auto-saved correctly
- [ ] Role-based access control working
- [ ] Timestamps generated automatically
- [ ] Foreign keys properly linked
- [ ] JSON fields (lampiran) saved correctly
- [ ] ENUM values validated

---

## 10. Integration Testing

### 10.1 End-to-End Flow

**Full workflow dari Permohonan sampai Draft Izin**:

```
1. [Application Service] POST /api/permohonan
   → Pemohon membuat permohonan

2. [Application Service] POST /api/permohonan/:id/dokumen
   → Upload dokumen persyaratan

3. [Application Service] POST /api/dokumen/:id/verifikasi
   → Admin verifikasi dokumen

4. [Application Service] POST /api/permohonan/:id/registrasi
   → Admin registrasi → Generate nomor REG/YYYY/MM/XXXX
   → TRIGGER WORKFLOW SERVICE (automatic)

5. [Workflow Service] POST /api/workflow/disposisi-opd
   → Admin disposisi ke OPD

6. [Workflow Service] POST /api/workflow/kajian-teknis
   → OPD input hasil kajian

7. [Workflow Service] POST /api/workflow/forward-to-pimpinan
   → Admin kirim draft ke Pimpinan

8. [Workflow Service] POST /api/workflow/revisi-draft (optional)
   → Pimpinan minta revisi
   → Loop ke step 7 (perbaikan draft)

9. [Application Service] GET /api/permohonan/:id/status
   → Pemohon cek status permohonan
```

### 10.2 Testing Script (Run All)

Buat Postman Collection Runner untuk menjalankan semua test secara berurutan:

1. Login Admin
2. Create Disposisi
3. Login OPD
4. Input Kajian Teknis
5. Login Admin
6. Forward to Pimpinan
7. Login Pimpinan
8. Request Revisi

**Run via Postman Runner**:
- Click **Collection** → **Run**
- Select all requests
- Set iterations: 1
- Click **Run Workflow Service**

---

## 11. Performance & Best Practices

### 11.1 Response Time Benchmarks
- Disposisi creation: < 100ms
- Kajian teknis creation: < 150ms (with JSON lampiran)
- Draft forward: < 200ms (with long text)
- Revisi request: < 150ms (2 DB operations)

### 11.2 Security Best Practices
✅ Always use HTTPS in production  
✅ JWT tokens expire in 1 hour  
✅ Role-based access enforced via middleware  
✅ Internal endpoints (`/api/internal/*`) tidak boleh exposed ke public  
✅ Validate ENUM values before DB insert  

### 11.3 Data Validation
✅ `nomor_draft` must be unique  
✅ `hasil_kajian` must be one of: disetujui, ditolak, perlu_revisi  
✅ `status` (disposisi) must be: pending, dikerjakan, selesai, ditolak  
✅ `lampiran` must be valid JSON array  
✅ Foreign keys (permohonan_id, opd_id, etc.) must exist  

---

## 12. Appendix

### 12.1 Sample Data

**Sample Disposisi**:
```json
{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "opd_id": 2,
  "catatan_disposisi": "Mohon segera dilakukan kajian teknis untuk permohonan ini. Prioritas tinggi."
}
```

**Sample Kajian Teknis**:
```json
{
  "permohonan_id": 1,
  "opd_id": 2,
  "hasil_kajian": "disetujui",
  "rekomendasi": "Permohonan dapat disetujui dengan ketentuan sebagai berikut:\n1. Memperhatikan aspek lingkungan\n2. Mengikuti ketentuan GSB (Garis Sempadan Bangunan)\n3. Melengkapi IMB dalam 30 hari",
  "catatan_teknis": "Berdasarkan survey lapangan:\n- Lokasi sesuai RTRW\n- Tidak ada kendala teknis\n- Akses jalan memadai",
  "lampiran": [
    {"nama_file": "survey_report.pdf", "url": "/uploads/survey_report.pdf"},
    {"nama_file": "foto_lokasi.jpg", "url": "/uploads/foto_lokasi.jpg"}
  ]
}
```

**Sample Draft Izin**:
```json
{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "nomor_draft": "DRAFT/IMB/2024/01/0001",
  "isi_draft": "KEPUTUSAN KEPALA DAERAH NOMOR: DRAFT/IMB/2024/01/0001\n\nTENTANG PERSETUJUAN IZIN MENDIRIKAN BANGUNAN\n\n[... full content ...]"
}
```

### 12.2 HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation error, missing fields |
| 401 | Unauthorized | No token or invalid token |
| 403 | Forbidden | Token valid but wrong role |
| 404 | Not Found | Resource not found (e.g., draft_id) |
| 500 | Internal Server Error | Database error, server crash |

### 12.3 Environment Variable Reference

```javascript
// {{workflow_base_url}}
"http://localhost:3020"

// {{accessToken}}
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJkZW1vIiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNzA1MzIxMjAwLCJleHAiOjE3MDUzMjQ4MDB9.XXXXX"

// {{permohonan_id}}
1

// {{opd_user_id}}
2

// {{disposisi_id}}
1

// {{kajian_id}}
1

// {{draft_id}}
1

// {{revisi_id}}
1
```

---

## 📝 Conclusion

Selamat! Anda telah menyelesaikan setup dan testing untuk **Workflow Service**.

**What's Next**:
- ✅ Integrate dengan frontend (if any)
- ✅ Add notification service (email/SMS) for disposisi
- ✅ Implement dashboard untuk monitoring workflow
- ✅ Add approval flow untuk Pimpinan (approve/reject draft)
- ✅ Export draft as PDF for official documents

**Support**:
- Documentation: `README.md`
- Postman Collection: `postman/Workflow_Service.postman_collection.json`
- Environment: `postman/Workflow_Service.postman_environment.json`

---

**Happy Testing! 🚀**
