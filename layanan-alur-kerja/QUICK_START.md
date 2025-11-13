# 🎯 PANDUAN SINGKAT TESTING - WORKFLOW SERVICE

## ✅ STATUS SETUP

### Database
- ✅ Database `jelita_workflow` telah dibuat
- ✅ Tabel `disposisi`, `kajian_teknis`, `draft_izin`, `revisi_draft` telah dibuat
- ✅ Foreign keys dan constraints telah dikonfigurasi

### Server
- ✅ Dependencies terinstall (express, sequelize, mysql2, jsonwebtoken, axios)
- ✅ Server berjalan di **Port 3020**
- ✅ Workflow Service siap digunakan

---

## 🚀 QUICK START TESTING

### 1. Import ke Postman

**Collection & Environment**:
- File: `postman/Workflow_Service.postman_collection.json`
- File: `postman/Workflow_Service.postman_environment.json`

**Cara Import**:
1. Buka Postman
2. Klik **Import** (kiri atas)
3. Drag & drop kedua file JSON
4. Pilih environment **"Workflow Service Environment"** di dropdown kanan atas

---

### 2. Environment Variables yang Perlu Diisi Manual

Sebelum testing, set nilai berikut di environment:

| Variable | Cara Mendapat Nilai | Contoh |
|----------|---------------------|--------|
| `permohonan_id` | Dari Application Service → Buat permohonan baru | `1` |
| `opd_user_id` | Dari database → SELECT id FROM jelita_users.users WHERE role='OPD' | `2` |

**Query untuk mendapat OPD User ID**:
```sql
SELECT id, username, nama_lengkap, role 
FROM jelita_users.users 
WHERE role = 'OPD' 
LIMIT 1;
```

Jika belum ada user OPD, buat dengan:
```sql
INSERT INTO jelita_users.users (username, password_hash, nama_lengkap, role)
VALUES (
  'opd_demo', 
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: demo123
  'Demo OPD User',
  'OPD'
);
```

---

### 3. Urutan Testing (5 Endpoint)

#### 📍 Test 1: Login sebagai Admin
**Collection**: User & Auth Service (port 3001)  
**Request**: POST /api/auth/signin  
**Body**:
```json
{
  "username": "demo",
  "password": "demo123"
}
```
✅ Token akan otomatis tersimpan di `{{accessToken}}`

---

#### 📍 Test 2: Create Disposisi OPD
**Request**: POST /api/workflow/disposisi-opd  
**Body**:
```json
{
  "permohonan_id": {{permohonan_id}},
  "nomor_registrasi": "REG/2024/01/0001",
  "opd_id": {{opd_user_id}},
  "catatan_disposisi": "Mohon segera dilakukan kajian teknis untuk permohonan ini"
}
```
**Expected**: Status 201, `disposisi_id` tersimpan otomatis

---

#### 📍 Test 3: Login sebagai OPD
**Collection**: User & Auth Service  
**Request**: POST /api/auth/signin  
**Body**:
```json
{
  "username": "opd_demo",
  "password": "demo123"
}
```
✅ Token OPD akan mengganti token Admin di `{{accessToken}}`

---

#### 📍 Test 4: Input Kajian Teknis
**Request**: POST /api/workflow/kajian-teknis  
**Body**:
```json
{
  "permohonan_id": {{permohonan_id}},
  "opd_id": {{opd_user_id}},
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
**Expected**: Status 201, `kajian_id` tersimpan, `reviewer_id` terisi otomatis

---

#### 📍 Test 5: Login sebagai Admin (lagi)
Ulangi Test 1 untuk mendapat token Admin

---

#### 📍 Test 6: Forward Draft to Pimpinan
**Request**: POST /api/workflow/forward-to-pimpinan  
**Body**:
```json
{
  "permohonan_id": {{permohonan_id}},
  "nomor_registrasi": "REG/2024/01/0001",
  "nomor_draft": "DRAFT/2024/01/0001",
  "isi_draft": "KEPUTUSAN KEPALA DAERAH\nNOMOR: DRAFT/2024/01/0001\n\nTENTANG\nPERSETUJUAN IZIN MENDIRIKAN BANGUNAN\n\nKEPALA DAERAH,\n\nMenimbang:\na. Bahwa berdasarkan permohonan...\nb. Bahwa berdasarkan hasil kajian teknis...\n\nMengingat:\n1. Undang-Undang...\n2. Peraturan Daerah...\n\nMEMUTUSKAN:\n\nMenetapkan:\nKESATU: Menyetujui permohonan izin...\nKEDUA: Izin berlaku selama...\nKETIGA: Keputusan ini mulai berlaku...\n\nDitetapkan di: ...\nPada tanggal: ...\n\nKEPALA DAERAH,\n\n(Nama Pejabat)"
}
```
**Expected**: Status 201, `draft_id` tersimpan, status `dikirim_ke_pimpinan`

---

#### 📍 Test 7: Login sebagai Pimpinan
**Note**: Buat user Pimpinan dulu jika belum ada
```sql
INSERT INTO jelita_users.users (username, password_hash, nama_lengkap, role)
VALUES (
  'pimpinan_demo', 
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Demo Pimpinan',
  'Pimpinan'
);
```

**Request**: POST /api/auth/signin  
**Body**:
```json
{
  "username": "pimpinan_demo",
  "password": "demo123"
}
```

---

#### 📍 Test 8: Request Revisi Draft
**Request**: POST /api/workflow/revisi-draft  
**Body**:
```json
{
  "draft_id": {{draft_id}},
  "catatan_revisi": "Mohon untuk memperbaiki bagian pertimbangan hukum pada poin b. Tambahkan referensi ke Perda terbaru No. 5 Tahun 2024. Serta pastikan format penomoran sesuai dengan standar terbaru."
}
```
**Expected**: 
- Status 201
- Draft status berubah menjadi `perlu_revisi`
- Record revisi dibuat dengan status `pending`
- `revisi_id` tersimpan

---

## 📊 Validasi di Database

### Check Disposisi
```sql
SELECT * FROM jelita_workflow.disposisi;
```

### Check Kajian Teknis
```sql
SELECT * FROM jelita_workflow.kajian_teknis;
```

### Check Draft Izin
```sql
SELECT * FROM jelita_workflow.draft_izin;
```

### Check Revisi Draft
```sql
SELECT * FROM jelita_workflow.revisi_draft;
```

### Full Workflow Query
```sql
SELECT 
  d.id AS disposisi_id,
  d.nomor_registrasi,
  d.status AS disposisi_status,
  kt.hasil_kajian,
  kt.rekomendasi,
  di.nomor_draft,
  di.status AS draft_status,
  rd.catatan_revisi,
  rd.status AS revisi_status
FROM disposisi d
LEFT JOIN kajian_teknis kt ON d.permohonan_id = kt.permohonan_id
LEFT JOIN draft_izin di ON d.permohonan_id = di.permohonan_id
LEFT JOIN revisi_draft rd ON di.id = rd.draft_id
WHERE d.permohonan_id = 1;
```

---

## 🔍 Expected Test Results

### ✅ Semua Test Harus Pass:

1. **Test 1 (Login Admin)**: 
   - Status: 200
   - Token tersimpan
   
2. **Test 2 (Disposisi OPD)**: 
   - Status: 201
   - `disposisi_id` tersimpan
   - `status` = 'pending'
   
3. **Test 3 (Login OPD)**: 
   - Status: 200
   - Token OPD tersimpan
   
4. **Test 4 (Kajian Teknis)**: 
   - Status: 201
   - `kajian_id` tersimpan
   - `reviewer_id` tidak null
   - `hasil_kajian` sesuai input
   
5. **Test 5 (Login Admin lagi)**: 
   - Status: 200
   - Token Admin tersimpan
   
6. **Test 6 (Forward Draft)**: 
   - Status: 201
   - `draft_id` tersimpan
   - `status` = 'dikirim_ke_pimpinan'
   - `tanggal_kirim_pimpinan` tidak null
   
7. **Test 7 (Login Pimpinan)**: 
   - Status: 200
   - Token Pimpinan tersimpan
   
8. **Test 8 (Revisi Draft)**: 
   - Status: 201
   - `revisi_id` tersimpan
   - Draft status = 'perlu_revisi'
   - Revisi status = 'pending'

---

## 🚨 Troubleshooting Common Issues

### Error: "Token tidak valid"
**Fix**: Login ulang, token mungkin expired (1 jam)

### Error: "Access denied. Required role: Admin"
**Fix**: Pastikan login dengan user role yang benar sesuai endpoint

### Error: "Duplicate entry for key 'nomor_draft'"
**Fix**: Ganti nomor draft (harus unique): `DRAFT/2024/01/0002`

### Error: "Draft tidak ditemukan"
**Fix**: Pastikan `draft_id` ada di environment variable dan valid

### Server tidak berjalan
**Fix**:
```powershell
# Check port
netstat -ano | findstr :3020

# Restart server
Set-Location -Path 'd:\KULIAH\TESIS\prototype\layanan-alur-kerja'
node server.js
```

---

## 📚 Dokumentasi Lengkap

- **Full Testing Guide**: `postman/TESTING_GUIDE.md` (50+ halaman)
- **README**: `README.md`
- **API Docs**: Lihat collection Postman

---

## 🎉 Selamat Testing!

Semua endpoint Workflow Service sudah siap diuji.

**Next Steps**:
1. Import Postman collection & environment
2. Buat user OPD dan Pimpinan (jika belum ada)
3. Dapatkan `permohonan_id` dari Application Service
4. Ikuti urutan testing 1-8
5. Verifikasi di database

**Support**: Jika ada masalah, cek TESTING_GUIDE.md untuk troubleshooting detail.
