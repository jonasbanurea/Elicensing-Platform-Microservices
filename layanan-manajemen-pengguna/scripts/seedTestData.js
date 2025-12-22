// Seed auth/user service with deterministic test data aligned with monolith
const bcrypt = require('bcryptjs');
const sequelize = require('../utils/database');
const User = require('../models/User');

async function seed() {
  try {
    console.log('🌱 Seeding auth database with test users...');

    await sequelize.authenticate();
    console.log('✓ Connection established');

    // Ensure tables exist
    await sequelize.sync({ alter: true });

    const password = await bcrypt.hash('password123', 10);

    const pemohonUsers = Array.from({ length: 50 }, (_, i) => ({
      username: `pemohon${i + 1}`,
      password_hash: password,
      nama_lengkap: `Test Pemohon ${i + 1}`,
      role: 'Pemohon'
    }));

    const adminUsers = Array.from({ length: 10 }, (_, i) => ({
      username: `admin${i + 1}`,
      password_hash: password,
      nama_lengkap: `Test Admin ${i + 1}`,
      role: 'Admin'
    }));

    const opdUsers = Array.from({ length: 10 }, (_, i) => ({
      username: `opd${i + 1}`,
      password_hash: password,
      nama_lengkap: `Test OPD ${i + 1}`,
      role: 'OPD'
    }));

    const pimpinanUsers = Array.from({ length: 5 }, (_, i) => ({
      username: `pimpinan${i + 1}`,
      password_hash: password,
      nama_lengkap: `Test Pimpinan ${i + 1}`,
      role: 'Pimpinan'
    }));

    const users = await User.bulkCreate(
      [...pemohonUsers, ...adminUsers, ...opdUsers, ...pimpinanUsers],
      { ignoreDuplicates: true }
    );

    console.log(`✅ Seeded users: ${users.length}`);
    console.log('   - Pemohon:', pemohonUsers.length);
    console.log('   - Admin:', adminUsers.length);
    console.log('   - OPD:', opdUsers.length);
    console.log('   - Pimpinan:', pimpinanUsers.length);
    console.log('\nDefault password for all accounts: password123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed auth database:', err.message);
    process.exit(1);
  }
}

seed();
