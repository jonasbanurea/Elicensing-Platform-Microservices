# Panduan Pengujian User & Auth Service dengan Postman

## Daftar Isi
1. [Persiapan](#persiapan)
2. [Import Collection & Environment](#import-collection--environment)
3. [Konfigurasi Environment](#konfigurasi-environment)
4. [Menjalankan Pengujian](#menjalankan-pengujian)
5. [Troubleshooting](#troubleshooting)

---

## Persiapan

### 1. Install Postman
- Download dan install Postman dari [postman.com/downloads](https://www.postman.com/downloads/)
- Atau gunakan Postman Web (login di [postman.com](https://www.postman.com))

### 2. Pastikan Service Berjalan
Sebelum melakukan pengujian, pastikan layanan-manajemen-pengguna sudah berjalan:

```powershell
cd d:\KULIAH\TESIS\prototype\layanan-manajemen-pengguna
npm install
node server.js
```

Atau jika menggunakan nodemon:
```powershell
npm run dev
```

Pastikan muncul pesan:
```
User & Auth Service is running on port 3005
```

### 3. Persiapkan Database
Pastikan database sudah dikonfigurasi dan memiliki minimal 1 user untuk testing. File `.env` harus sudah terisi:

```
PORT=3005
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=nama_database
JWT_SECRET=your_generated_jwt_secret_here
```

---

## Import Collection & Environment

### Cara 1: Import via File

1. **Buka Postman**
2. **Import Collection:**
   - Klik tombol **Import** di kiri atas
   - Pilih tab **File**
   - Browse ke: `d:\KULIAH\TESIS\prototype\layanan-manajemen-pengguna\postman\User_Auth_Service.postman_collection.json`
   - Klik **Import**
   
3. **Import Environment:**
   - Klik tombol **Import** lagi
   - Browse ke: `d:\KULIAH\TESIS\prototype\layanan-manajemen-pengguna\postman\User_Auth_Service.postman_environment.json`
   - Klik **Import**

### Cara 2: Drag & Drop

Cukup drag and drop kedua file JSON ke jendela Postman.

---

## Konfigurasi Environment

### Aktifkan Environment

1. Klik dropdown **Environment** di kanan atas (biasanya tertulis "No Environment")
2. Pilih **User Auth Service - Development**

### Sesuaikan Variable (jika perlu)

Klik icon mata (👁️) di sebelah dropdown environment untuk melihat/edit variable:

| Variable | Value Default | Keterangan |
|----------|---------------|------------|
| `BASE_URL` | `http://localhost:3005` | URL service (sesuaikan PORT jika berbeda) |
| `TOKEN` | (kosong) | Akan terisi otomatis setelah signin |
| `AUTH_HEADER` | (kosong) | Akan terisi otomatis setelah signin |
| `USER_ID` | `1` | ID user untuk testing endpoint peran |

Jika service Anda berjalan di port berbeda, edit `BASE_URL` sesuai kebutuhan.

---

## Menjalankan Pengujian

### Workflow Testing yang Disarankan

```
1. Sign In (dapatkan token)
   ↓
2. Validate Token (cek token valid)
   ↓
3. Get User Role & Permissions (akses protected endpoint)
```

---

### 1. **POST /api/auth/signin** - Sign In

**Tujuan:** Login dan mendapatkan JWT token

#### Langkah-langkah:
1. Buka collection **User & Auth Service - Layanan Manajemen Pengguna**
2. Buka folder **Authentication**
3. Klik request **Sign In**
4. Di tab **Body**, sesuaikan username dan password dengan user yang ada di database:
   ```json
   {
       "username": "demo",
       "password": "demo123"
   }
   ```
5. Klik **Send**

#### Expected Response (200 OK):
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjk5..."
}
```

#### Apa yang Terjadi Otomatis:
- Token disimpan ke environment variable `TOKEN`
- Variable `AUTH_HEADER` terisi dengan format `Bearer <token>`
- Anda bisa lihat di tab **Tests** → **Console** (Ctrl+Alt+C)

#### Jika Gagal:
- **404 User not found** → Username tidak ada di database
- **401 Invalid credentials** → Password salah
- **500 Internal server error** → Cek koneksi database atau log server

---

### 2. **GET /api/auth/validate** - Validate Token

**Tujuan:** Memvalidasi token JWT yang didapat dari signin

#### Langkah-langkah:
1. Klik request **Validate Token**
2. Pastikan di tab **Headers** sudah ada:
   - Key: `Authorization`
   - Value: `{{AUTH_HEADER}}` (otomatis mengambil dari environment)
3. Klik **Send**

#### Expected Response (200 OK):
```json
{
    "valid": true,
    "user": {
        "id": 1,
        "role": "Admin"
    }
}
```

#### Automated Tests:
Collection sudah include automated tests yang akan:
- ✅ Memastikan status code 200
- ✅ Memastikan token valid
- ✅ Memastikan user memiliki id dan role

Lihat hasil test di tab **Test Results** setelah send request.

#### Jika Gagal:
- **401 No token provided** → Token tidak terkirim (pastikan sudah signin dulu)
- **401 Invalid or expired token** → Token expired (signin ulang) atau JWT_SECRET berbeda

---

### 3. **GET /api/users/:id/peran** - Get User Role & Permissions

**Tujuan:** Mendapatkan role dan hak akses user (protected endpoint)

#### Langkah-langkah:
1. Buka folder **Users**
2. Klik request **Get User Role & Permissions**
3. Di tab **Params**, sesuaikan path variable `:id`:
   - Key: `id`
   - Value: `1` (atau ID user lain yang ingin dicek)
4. Pastikan di tab **Headers** sudah ada:
   - Key: `Authorization`
   - Value: `{{AUTH_HEADER}}`
5. Klik **Send**

#### Expected Response (200 OK):
```json
{
    "id": 1,
    "username": "demo",
    "role": "Admin",
    "access": [
        "manage_users",
        "view_reports",
        "manage_system"
    ]
}
```

#### Access Rights berdasarkan Role:

| Role | Access Permissions |
|------|-------------------|
| **Pemohon** | `create_permohonan`, `view_own_status` |
| **Admin** | `manage_users`, `view_reports`, `manage_system` |
| **OPD** | `review_permohonan`, `comment` |
| **Pimpinan** | `approve_permohonan`, `view_reports` |

#### Automated Tests:
- ✅ Status code 200
- ✅ Response memiliki id, username, role, access
- ✅ Role adalah salah satu dari enum valid
- ✅ Access adalah array

#### Jika Gagal:
- **401 No token provided** → Signin dulu untuk mendapat token
- **404 User not found** → User dengan ID tersebut tidak ada di database
- **500 Internal server error** → Cek koneksi database

---

## Testing Skenario Lengkap

### Skenario 1: Happy Path (Success Flow)
```
1. POST /api/auth/signin
   Body: { "username": "demo", "password": "demo123" }
   Expected: 200 OK, dapat token
   
2. GET /api/auth/validate
   Header: Authorization: Bearer <token>
   Expected: 200 OK, { "valid": true, "user": {...} }
   
3. GET /api/users/1/peran
   Header: Authorization: Bearer <token>
   Expected: 200 OK, { "id": 1, "role": "...", "access": [...] }
```

### Skenario 2: Unauthorized Access (No Token)
```
1. GET /api/auth/validate
   (tanpa Authorization header)
   Expected: 401 Unauthorized, "No token provided"
   
2. GET /api/users/1/peran
   (tanpa Authorization header)
   Expected: 401 Unauthorized
```

### Skenario 3: Invalid Credentials
```
1. POST /api/auth/signin
   Body: { "username": "demo", "password": "wrongpassword" }
   Expected: 401 Unauthorized, "Invalid credentials"
   
2. POST /api/auth/signin
   Body: { "username": "nonexistent", "password": "password" }
   Expected: 404 Not Found, "User not found"
```

### Skenario 4: Expired Token
```
1. Tunggu token expire (default: 1 jam)
2. GET /api/auth/validate
   Header: Authorization: Bearer <expired_token>
   Expected: 401 Unauthorized, "Invalid or expired token"
```

---

## Advanced: Run Collection dengan Runner

Untuk menjalankan semua request sekaligus:

1. Klik kanan pada collection **User & Auth Service**
2. Pilih **Run collection**
3. Pastikan semua request tercentang
4. Klik **Run User & Auth Service**
5. Lihat hasil test summary

**Catatan:** Request harus dijalankan berurutan (Sign In dulu) agar token tersedia untuk request berikutnya.

---

## Advanced: Pre-request Script untuk Otomasi

Jika ingin otomatis login sebelum request protected endpoint, tambahkan Pre-request Script:

```javascript
// Pre-request Script untuk endpoint yang butuh auth
const BASE_URL = pm.environment.get("BASE_URL");
const TOKEN = pm.environment.get("TOKEN");

// Jika token belum ada, lakukan signin otomatis
if (!TOKEN) {
    pm.sendRequest({
        url: BASE_URL + '/api/auth/signin',
        method: 'POST',
        header: {
            'Content-Type': 'application/json'
        },
        body: {
            mode: 'raw',
            raw: JSON.stringify({
                username: 'demo',
                password: 'demo123'
            })
        }
    }, function (err, res) {
        if (!err && res.code === 200) {
            const jsonData = res.json();
            pm.environment.set("TOKEN", jsonData.token);
            pm.environment.set("AUTH_HEADER", "Bearer " + jsonData.token);
        }
    });
}
```

---

## Troubleshooting

### Problem: "Could not get response" / Connection refused
**Solusi:**
- Pastikan service sedang berjalan (cek terminal)
- Cek PORT di environment variable sesuai dengan PORT service
- Pastikan tidak ada firewall yang memblokir

### Problem: "Invalid or expired token"
**Solusi:**
- Jalankan ulang request Sign In untuk mendapat token baru
- Token default expire dalam 1 jam (bisa diubah di JWT sign options)
- Pastikan JWT_SECRET di .env sama dengan yang digunakan saat signin

### Problem: "User not found" saat Sign In
**Solusi:**
- Buat user test di database terlebih dahulu
- Atau jalankan seeder/migration jika sudah ada
- Cek username di request body sesuai dengan data di database

### Problem: Environment variable tidak otomatis terisi
**Solusi:**
- Pastikan environment sudah dipilih (cek dropdown kanan atas)
- Buka tab **Tests** di request Sign In, pastikan script ada
- Buka Console (Ctrl+Alt+C) untuk lihat log error

### Problem: Database connection error
**Solusi:**
- Cek file `.env` sudah terisi dengan benar
- Pastikan MySQL/database service berjalan
- Test koneksi database secara manual
- Cek credentials DB_USER dan DB_PASSWORD

---

## Tips & Best Practices

1. **Gunakan Environment untuk berbagai stage:**
   - Duplikasi environment untuk Development, Staging, Production
   - Sesuaikan BASE_URL untuk masing-masing

2. **Save response examples:**
   - Setelah berhasil test, klik **Save Response** → **Save as Example**
   - Berguna untuk dokumentasi dan sharing dengan tim

3. **Gunakan Collection Variables untuk data sensitif:**
   - Jangan commit environment file dengan credential ke git
   - Gunakan `.gitignore` untuk `*.postman_environment.json`

4. **Monitor via Console:**
   - Buka Console (View → Show Postman Console atau Ctrl+Alt+C)
   - Lihat request/response detail dan log dari scripts

5. **Export Collection untuk sharing:**
   - Klik ... di collection → Export
   - Share JSON file dengan tim (tanpa environment credentials)

---

## Referensi Endpoint

| Method | Endpoint | Auth Required | Deskripsi |
|--------|----------|---------------|-----------|
| POST | `/api/auth/signin` | ❌ | Login dan dapatkan JWT token |
| GET | `/api/auth/validate` | ✅ | Validasi JWT token |
| GET | `/api/users/:id/peran` | ✅ | Dapatkan role dan permissions user |

---

## Next Steps

Setelah berhasil testing User & Auth Service, Anda bisa:
1. Tambahkan endpoint signup (POST /api/auth/signup)
2. Implementasi refresh token mechanism
3. Tambahkan endpoint untuk update user role
4. Implementasi audit log untuk signin activity
5. Test integration dengan microservice lain

---

**Catatan:** Dokumentasi ini diasumsikan menggunakan service yang berjalan di `http://localhost:3005`. Sesuaikan PORT jika berbeda.

**Last Updated:** November 11, 2025
