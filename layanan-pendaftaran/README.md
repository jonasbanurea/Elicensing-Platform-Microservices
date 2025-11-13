# Layanan Pendaftaran - Quick Start Guide

## ✅ Setup Complete!

Layanan Pendaftaran (Application Service) sudah siap digunakan dengan 9 endpoint lengkap.

---

## 🚀 Cara Menjalankan

### 1. Install Dependencies (Sekali saja)
```powershell
cd d:\KULIAH\TESIS\prototype\layanan-pendaftaran
npm install
```

### 2. Setup Database (Sekali saja)
```powershell
node scripts/createDatabase.js
node scripts/setupDatabase.js
```

### 3. Jalankan Server
```powershell
node server.js
```

Server akan berjalan di: **http://localhost:3010**

---

## 📦 Postman Testing

### Import Collection
1. Buka Postman
2. Import files dari folder `postman/`:
   - `Application_Service.postman_collection.json`
   - `Application_Service.postman_environment.json`
3. Pilih environment: **Application Service - Development**

### Mendapatkan Token
**PENTING:** Sebelum testing, dapatkan token dari User Service:

```powershell
# Jalankan User Service di terminal terpisah
cd d:\KULIAH\TESIS\prototype\layanan-manajemen-pengguna
$env:PORT=3001; node server.js
```

Lalu di Postman:
1. Import collection User Auth Service
2. Jalankan **Sign In** (username: `demo`, password: `demo123`)
3. Token otomatis tersimpan di `AUTH_HEADER`

---

## 🧪 Testing Flow (Happy Path)

### Urutan Testing Recommended:

```
1. Login di User Service ✓
   ↓
2. POST /api/permohonan (Create)
   ↓
3. POST /api/permohonan/:id/dokumen (Upload KTP)
   ↓
4. POST /api/permohonan/:id/dokumen (Upload Surat Kuasa)
   ↓
5. POST /api/dokumen/:id/verifikasi (Verify - Admin/OPD)
   ↓
6. POST /api/permohonan/:id/registrasi (Finalize - Admin/OPD)
   ↓
7. GET /api/permohonan/:id/tanda-terima (Generate PDF)
   ↓
8. GET /api/permohonan/:id/status (Check Status)
   ↓
9. POST /api/internal/trigger-workflow (Trigger Workflow)
```

---

## 📋 Endpoint Summary

| # | Endpoint | Method | Auth | Role | Deskripsi |
|---|----------|--------|------|------|-----------|
| 1 | `/api/permohonan` | POST | ✓ | Any | Create permohonan baru |
| 2 | `/api/permohonan/:id` | PUT | ✓ | Owner/Admin/OPD | Update data permohonan |
| 3 | `/api/permohonan/:id/dokumen` | POST | ✓ | Owner | Upload dokumen (max 5MB) |
| 4 | `/api/dokumen/:id/verifikasi` | POST | ✓ | Admin/OPD | Verifikasi dokumen |
| 5 | `/api/permohonan/:id/notifikasi-perbaikan` | POST | ✓ | Admin/OPD | Kirim notifikasi perbaikan |
| 6 | `/api/permohonan/:id/registrasi` | POST | ✓ | Admin/OPD | Finalisasi & buat nomor registrasi |
| 7 | `/api/permohonan/:id/tanda-terima` | GET | ✓ | Owner/Admin/OPD | Generate PDF tanda terima |
| 8 | `/api/permohonan/:id/status` | GET | ✓ | Owner/Admin/OPD/Pimpinan | Cek status permohonan |
| 9 | `/api/internal/trigger-workflow` | POST | ✗ | Internal | Trigger workflow service |

---

## 📁 Struktur File

```
layanan-pendaftaran/
├── server.js                    # Main server
├── package.json                 # Dependencies
├── .env                         # Configuration
├── models/
│   ├── Permohonan.js           # Permohonan model
│   └── Dokumen.js              # Dokumen model
├── routes/
│   └── permohonanRoutes.js     # All 9 endpoints
├── middleware/
│   └── authMiddleware.js       # JWT validation & role check
├── utils/
│   └── database.js             # Sequelize config
├── scripts/
│   ├── createDatabase.js       # Create DB
│   └── setupDatabase.js        # Create tables
├── postman/
│   ├── Application_Service.postman_collection.json
│   ├── Application_Service.postman_environment.json
│   └── TESTING_GUIDE.md        # Panduan lengkap testing
└── uploads/                     # File upload folder (auto-created)
```

---

## 🔑 Environment Variables

File `.env` sudah dikonfigurasi dengan:

```properties
PORT=3010
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Enter*123
DB_NAME=jelita_permohonan
JWT_SECRET=FFbdqS6NVE7ARw08MNUAj0+sqXo7ZCEbZF7igEbMUH6tni78oAjzSPqYXvoyP02N
WORKFLOW_SERVICE_URL=http://localhost:3020
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

---

## 🎯 Example Request

### Create Permohonan
```json
POST http://localhost:3010/api/permohonan
Authorization: Bearer YOUR_TOKEN

{
    "data_pemohon": {
        "nama": "John Doe",
        "alamat": "Jl. Merdeka No. 123",
        "telepon": "081234567890",
        "email": "john@example.com",
        "jenis_izin": "Izin Mendirikan Bangunan",
        "lokasi_izin": "Jl. Sudirman No. 45"
    }
}
```

### Upload Dokumen
```
POST http://localhost:3010/api/permohonan/1/dokumen
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

file: [Select your file]
jenis_dokumen: KTP
```

---

## 🐛 Common Issues

### 1. "401 Unauthorized - No token provided"
- Pastikan sudah login ke User Service
- Copy token ke environment variable `AUTH_HEADER`

### 2. "403 Forbidden - Access denied"
- Endpoint memerlukan role Admin/OPD
- Login dengan user Admin atau OPD

### 3. "File upload error"
- Max file size: 5MB
- Allowed types: jpeg, jpg, png, pdf, doc, docx
- Gunakan body type `form-data` bukan `raw`

### 4. "Cannot generate PDF - No nomor_registrasi"
- Permohonan harus sudah finalize terlebih dahulu
- Jalankan endpoint "Finalize & Register" dulu

---

## 📖 Dokumentasi Lengkap

Lihat file `postman/TESTING_GUIDE.md` untuk:
- Penjelasan detail setiap endpoint
- Expected request & response
- Skenario testing lengkap
- Troubleshooting guide
- API reference

---

## 🔄 Status Permohonan

| Status | Deskripsi |
|--------|-----------|
| `draft` | Baru dibuat, belum lengkap |
| `perlu_perbaikan` | Butuh revisi dari pemohon |
| `menunggu_verifikasi` | Dokumen dalam proses verifikasi |
| `terdaftar` | Sudah finalize dan dapat nomor registrasi |
| `diproses` | Dalam proses workflow teknis |
| `selesai` | Proses selesai |

---

## 🎉 Ready to Test!

Server sedang berjalan di **http://localhost:3010**

Gunakan Postman untuk testing semua endpoint. Happy testing! 🚀

