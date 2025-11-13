# ✅ WORKFLOW SERVICE - SETUP COMPLETED!

## 🎉 Status Lengkap

### ✅ Yang Sudah Selesai

1. **Database Setup**
   - ✅ Database `jelita_workflow` telah dibuat
   - ✅ 4 tabel telah dibuat:
     - `disposisi`
     - `kajian_teknis`
     - `draft_izin`
     - `revisi_draft`
   - ✅ Foreign keys dan constraints dikonfigurasi

2. **Server Setup**
   - ✅ Dependencies terinstall
   - ✅ Server berjalan di **Port 3020**
   - ✅ 5 endpoint workflow siap digunakan

3. **Models Created**
   - ✅ Disposisi.js (enhanced)
   - ✅ KajianTeknis.js (enhanced)
   - ✅ DraftIzin.js (new)
   - ✅ RevisiDraft.js (new)

4. **Routes Implemented**
   - ✅ POST /api/workflow/disposisi-opd (Admin)
   - ✅ POST /api/workflow/kajian-teknis (OPD)
   - ✅ POST /api/workflow/forward-to-pimpinan (Admin)
   - ✅ POST /api/workflow/revisi-draft (Pimpinan)
   - ✅ POST /api/internal/receive-trigger (Internal)

5. **Documentation**
   - ✅ TESTING_GUIDE.md (50+ halaman)
   - ✅ README.md
   - ✅ QUICK_START.md
   - ✅ Postman Collection
   - ✅ Postman Environment

---

## 🚀 CARA MULAI TESTING

### Step 1: Buat User OPD dan Pimpinan

**Jalankan SQL berikut di MySQL**:

```sql
USE jelita_users;

-- User OPD (jika belum ada)
INSERT INTO users (username, password_hash, nama_lengkap, role, created_at, updated_at)
VALUES (
  'opd_demo',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: demo123
  'Demo OPD User',
  'OPD',
  NOW(),
  NOW()
);

-- User Pimpinan (jika belum ada)
INSERT INTO users (username, password_hash, nama_lengkap, role, created_at, updated_at)
VALUES (
  'pimpinan_demo',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: demo123
  'Demo Pimpinan',
  'Pimpinan',
  NOW(),
  NOW()
);

-- Cek semua user
SELECT id, username, nama_lengkap, role FROM users;
```

**Simpan ID user dengan role OPD** (akan digunakan di Postman).

---

### Step 2: Import ke Postman

1. Buka Postman
2. Klik **Import**
3. Import file:
   - `layanan-alur-kerja/postman/Workflow_Service.postman_collection.json`
   - `layanan-alur-kerja/postman/Workflow_Service.postman_environment.json`
4. Pilih environment **"Workflow Service Environment"**

---

### Step 3: Set Environment Variables

Di Postman, klik ikon mata (👁️) di kanan atas, lalu edit environment:

| Variable | Value | Keterangan |
|----------|-------|------------|
| `workflow_base_url` | `http://localhost:3020` | Sudah terisi |
| `auth_base_url` | `http://localhost:3001` | Sudah terisi |
| `permohonan_id` | **ISI MANUAL** | ID dari Application Service |
| `opd_user_id` | **ISI MANUAL** | ID user dengan role OPD |

**Cara mendapat permohonan_id**:
```sql
-- Dari Application Service
SELECT id, nomor_registrasi, status FROM jelita_permohonan.permohonan LIMIT 1;
```

Atau buat permohonan baru via Postman (Application Service collection).

---

### Step 4: Testing Flow

**Urutan pengujian 5 endpoint**:

#### 1️⃣ Login sebagai Admin
Collection: **User & Auth Service**  
Request: **POST /api/auth/signin**  
Body:
```json
{
  "username": "demo",
  "password": "demo123"
}
```
✅ Token tersimpan otomatis di `{{accessToken}}`

---

#### 2️⃣ Create Disposisi OPD
Collection: **Workflow Service**  
Request: **POST /api/workflow/disposisi-opd**  
Body:
```json
{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "opd_id": 2,
  "catatan_disposisi": "Mohon segera dilakukan kajian teknis"
}
```
**Expected**: Status 201, `disposisi_id` tersimpan

---

#### 3️⃣ Login sebagai OPD
Collection: **User & Auth Service**  
Request: **POST /api/auth/signin**  
Body:
```json
{
  "username": "opd_demo",
  "password": "demo123"
}
```
✅ Token OPD mengganti token Admin

---

#### 4️⃣ Input Kajian Teknis
Collection: **Workflow Service**  
Request: **POST /api/workflow/kajian-teknis**  
Body:
```json
{
  "permohonan_id": 1,
  "opd_id": 2,
  "hasil_kajian": "disetujui",
  "rekomendasi": "Permohonan disetujui dengan catatan...",
  "catatan_teknis": "Lokasi memenuhi syarat zonasi...",
  "lampiran": [
    {"nama_file": "survey.pdf", "url": "/uploads/survey.pdf"}
  ]
}
```
**Expected**: Status 201, `kajian_id` tersimpan

---

#### 5️⃣ Login sebagai Admin (lagi)
Ulangi step 1 untuk mendapat token Admin

---

#### 6️⃣ Forward Draft to Pimpinan
Collection: **Workflow Service**  
Request: **POST /api/workflow/forward-to-pimpinan**  
Body:
```json
{
  "permohonan_id": 1,
  "nomor_registrasi": "REG/2024/01/0001",
  "nomor_draft": "DRAFT/2024/01/0001",
  "isi_draft": "KEPUTUSAN KEPALA DAERAH\nNOMOR: DRAFT/2024/01/0001..."
}
```
**Expected**: Status 201, `draft_id` tersimpan, status `dikirim_ke_pimpinan`

---

#### 7️⃣ Login sebagai Pimpinan
Collection: **User & Auth Service**  
Request: **POST /api/auth/signin**  
Body:
```json
{
  "username": "pimpinan_demo",
  "password": "demo123"
}
```

---

#### 8️⃣ Request Revisi Draft
Collection: **Workflow Service**  
Request: **POST /api/workflow/revisi-draft**  
Body:
```json
{
  "draft_id": 1,
  "catatan_revisi": "Mohon perbaiki bagian pertimbangan hukum..."
}
```
**Expected**: 
- Status 201
- Draft status → `perlu_revisi`
- Revisi record dibuat
- `revisi_id` tersimpan

---

## 📊 Validasi Database

```sql
-- Check disposisi
SELECT * FROM jelita_workflow.disposisi;

-- Check kajian teknis
SELECT * FROM jelita_workflow.kajian_teknis;

-- Check draft izin
SELECT * FROM jelita_workflow.draft_izin;

-- Check revisi draft
SELECT * FROM jelita_workflow.revisi_draft;

-- Full workflow (join semua tabel)
SELECT 
  d.nomor_registrasi,
  d.status AS disposisi_status,
  kt.hasil_kajian,
  di.nomor_draft,
  di.status AS draft_status,
  rd.catatan_revisi
FROM disposisi d
LEFT JOIN kajian_teknis kt ON d.permohonan_id = kt.permohonan_id
LEFT JOIN draft_izin di ON d.permohonan_id = di.permohonan_id
LEFT JOIN revisi_draft rd ON di.id = rd.draft_id;
```

---

## 🔧 Troubleshooting

### Server tidak berjalan?
```powershell
Set-Location -Path 'd:\KULIAH\TESIS\prototype\layanan-alur-kerja'
node server.js
```

### Port 3020 sudah digunakan?
```powershell
netstat -ano | findstr :3020
taskkill /PID <PID> /F
```

### Token expired?
Login ulang untuk mendapat token baru (token berlaku 1 jam).

### Database error?
```powershell
# Recreate database
cd d:\KULIAH\TESIS\prototype\layanan-alur-kerja
node scripts/createDatabase.js
node scripts/setupDatabase.js
```

---

## 📂 File Structure

```
layanan-alur-kerja/
├── middleware/
│   └── authMiddleware.js           ✅ Created
├── models/
│   ├── Disposisi.js                ✅ Enhanced
│   ├── KajianTeknis.js             ✅ Enhanced
│   ├── DraftIzin.js                ✅ Created
│   └── RevisiDraft.js              ✅ Created
├── routes/
│   └── workflowRoutes.js           ✅ 5 endpoints
├── scripts/
│   ├── createDatabase.js           ✅ Created
│   ├── setupDatabase.js            ✅ Created
│   └── createTestUsers.js          ✅ Created
├── postman/
│   ├── Workflow_Service.postman_collection.json  ✅ Created
│   ├── Workflow_Service.postman_environment.json ✅ Created
│   └── TESTING_GUIDE.md            ✅ 50+ pages
├── utils/
│   └── database.js                 ✅ Configured
├── .env                            ✅ Configured
├── package.json                    ✅ Updated
├── server.js                       ✅ Running
├── README.md                       ✅ Complete
└── QUICK_START.md                  ✅ Complete
```

---

## 📚 Dokumentasi

- **Quick Start**: `QUICK_START.md` (panduan singkat)
- **Full Testing Guide**: `postman/TESTING_GUIDE.md` (50+ halaman)
- **README**: `README.md` (dokumentasi API)
- **Postman Collection**: `postman/Workflow_Service.postman_collection.json`
- **Postman Environment**: `postman/Workflow_Service.postman_environment.json`

---

## 🎯 Checklist Final

### Pre-Testing
- [ ] MySQL Server running
- [ ] User & Auth Service running (port 3001)
- [ ] Application Service running (port 3010)
- [ ] Workflow Service running (port 3020)
- [ ] User OPD dibuat
- [ ] User Pimpinan dibuat
- [ ] Postman collection imported
- [ ] Postman environment imported & activated
- [ ] Environment variables diisi (`permohonan_id`, `opd_user_id`)

### Testing
- [ ] Test 1: Login Admin ✅
- [ ] Test 2: Create Disposisi ✅
- [ ] Test 3: Login OPD ✅
- [ ] Test 4: Input Kajian Teknis ✅
- [ ] Test 5: Login Admin (lagi) ✅
- [ ] Test 6: Forward Draft ✅
- [ ] Test 7: Login Pimpinan ✅
- [ ] Test 8: Request Revisi ✅

### Validation
- [ ] Semua test Postman PASS
- [ ] Data tersimpan di database
- [ ] Environment variables auto-saved
- [ ] Role-based access working
- [ ] Timestamps generated correctly

---

## 🎉 SELESAI!

Layanan Alur Kerja (Workflow Service) **SIAP DIGUNAKAN**!

**Next Steps**:
1. ✅ Jalankan semua 3 services (auth, application, workflow)
2. ✅ Buat user OPD dan Pimpinan (SQL di atas)
3. ✅ Import Postman collection & environment
4. ✅ Set environment variables
5. ✅ Testing 8 steps di atas
6. ✅ Verifikasi di database

**Dokumentasi Lengkap**: Baca `postman/TESTING_GUIDE.md` untuk detail.

---

**Support**: Jika ada pertanyaan atau masalah, cek troubleshooting di TESTING_GUIDE.md.

**Happy Testing! 🚀**
