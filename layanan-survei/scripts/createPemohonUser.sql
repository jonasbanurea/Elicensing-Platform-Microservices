-- Create Pemohon User for Testing Survey Service
USE jelita_users;

-- Insert Pemohon user (username: pemohon_demo, password: demo123)
INSERT INTO users (username, password_hash, nama_lengkap, role, createdAt, updatedAt)
VALUES (
  'pemohon_demo',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: demo123
  'Demo Pemohon User',
  'Pemohon',
  NOW(),
  NOW()
);

-- Show all users with Pemohon role
SELECT 
  id, 
  username, 
  nama_lengkap, 
  role,
  createdAt
FROM users 
WHERE role = 'Pemohon';

-- Show all users (for reference)
SELECT 
  id, 
  username, 
  nama_lengkap, 
  role
FROM users
ORDER BY role, id;
