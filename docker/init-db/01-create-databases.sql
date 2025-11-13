-- Inisialisasi Database untuk Jelita Microservices
-- File ini akan dijalankan otomatis saat MySQL container pertama kali dibuat

-- Database untuk Layanan Manajemen Pengguna (Auth Service)
CREATE DATABASE IF NOT EXISTS jelita_users CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Database untuk Layanan Pendaftaran
CREATE DATABASE IF NOT EXISTS jelita_pendaftaran CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Database untuk Layanan Alur Kerja (Workflow)
CREATE DATABASE IF NOT EXISTS jelita_workflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Database untuk Layanan Survei (SKM)
CREATE DATABASE IF NOT EXISTS jelita_survei CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Database untuk Layanan Arsip
CREATE DATABASE IF NOT EXISTS jelita_arsip CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant privileges (optional, root already has all privileges)
GRANT ALL PRIVILEGES ON jelita_users.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON jelita_pendaftaran.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON jelita_workflow.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON jelita_survei.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON jelita_arsip.* TO 'root'@'%';

FLUSH PRIVILEGES;

-- Log completion
SELECT 'Databases created successfully!' AS Status;
