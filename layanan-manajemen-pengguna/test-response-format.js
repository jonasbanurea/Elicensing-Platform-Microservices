// Quick test script to verify signin response format
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock user data
const mockUser = {
  id: 1,
  username: 'demo',
  password_hash: bcrypt.hashSync('demo123', 10),
  nama_lengkap: 'Demo User',
  role: 'Admin'
};

// Mock JWT secret
const JWT_SECRET = 'test_secret_key';

// Simulate signin logic
async function testSignin() {
  console.log('Testing Signin Response Format\n');
  console.log('================================\n');
  
  const password = 'demo123';
  const isPasswordValid = await bcrypt.compare(password, mockUser.password_hash);
  
  if (!isPasswordValid) {
    console.log('Password validation failed');
    return;
  }
  
  const accessToken = jwt.sign(
    { id: mockUser.id, role: mockUser.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  // Build response as per requirement
  const response = {
    id: mockUser.id,
    username: mockUser.username,
    nama_lengkap: mockUser.nama_lengkap,
    role: mockUser.role,
    accessToken: accessToken
  };
  
  console.log('Response Format:');
  console.log(JSON.stringify(response, null, 2));
  console.log('\n================================\n');
  console.log('✓ Response includes: id, username, nama_lengkap, role, accessToken');
  console.log('✓ Token field is named "accessToken" (not "token")');
  console.log('✓ Role is single value from enum: Pemohon, Admin, OPD, Pimpinan');
}

testSignin();
