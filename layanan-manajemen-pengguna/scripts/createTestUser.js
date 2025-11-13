// Script untuk membuat test user di database
const bcrypt = require('bcryptjs');
const sequelize = require('../utils/database');
const User = require('../models/User');

async function createTestUser() {
  try {
    // Sync database (create table if not exists)
    await sequelize.sync({ force: false });
    console.log('Database synced successfully');

    // Hash password
    const password = 'demo123';
    const password_hash = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username: 'demo' } });
    
    if (existingUser) {
      console.log('Test user already exists:');
      console.log('Username: demo');
      console.log('Password: demo123');
      console.log('Role:', existingUser.role);
      return;
    }

    // Create test user
    const user = await User.create({
      username: 'demo',
      email: 'demo@example.com',
      password_hash: password_hash,
      nama_lengkap: 'Demo User',
      idKecamatan: null,
      idKelurahan: null,
      idOpd: null,
      idBidangBappeda: null,
      nm_instansi: 'Demo Instance',
      status_user: 0,
      role: 'Admin'
    });

    console.log('Test user created successfully!');
    console.log('Username: demo');
    console.log('Password: demo123');
    console.log('Role:', user.role);
    console.log('\nYou can now test signin with these credentials.');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await sequelize.close();
  }
}

createTestUser();
