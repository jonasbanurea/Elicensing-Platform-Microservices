// scripts/createPemohonUser.js
// Create test user Pemohon untuk testing

const bcrypt = require('bcryptjs');
const sequelize = require('../utils/database');
const User = require('../models/User');

async function createPemohonUser() {
  try {
    console.log('👤 Creating Pemohon test user...');
    
    await sequelize.authenticate();
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { username: 'pemohon_demo' } });
    
    if (existingUser) {
      console.log('⚠️  User "pemohon_demo" already exists');
      process.exit(0);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    // Create user
    const user = await User.create({
      username: 'pemohon_demo',
      password_hash: hashedPassword,
      nama_lengkap: 'Pemohon Demo',
      role: 'Pemohon'
    });
    
    console.log('✓ Pemohon user created:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Username: ${user.username}`);
    console.log(`  - Password: demo123`);
    console.log(`  - Role: ${user.role}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create Pemohon user:', error.message);
    process.exit(1);
  }
}

createPemohonUser();
