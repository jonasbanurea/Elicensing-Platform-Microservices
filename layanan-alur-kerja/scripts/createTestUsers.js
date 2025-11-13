const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUsers() {
  let connection;
  
  try {
    // Connect to MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'jelita_users' // Database dari User & Auth Service
    });

    console.log('✓ Connected to MySQL (jelita_users database)');

    // Hash password (demo123)
    const password = 'demo123';
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if OPD user exists
    const [opdCheck] = await connection.query(
      'SELECT id FROM users WHERE username = ?',
      ['opd_demo']
    );

    if (opdCheck.length === 0) {
      // Create OPD User
      await connection.query(
        `INSERT INTO users (username, password_hash, nama_lengkap, role, created_at, updated_at) 
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        ['opd_demo', passwordHash, 'Demo OPD User', 'OPD']
      );
      console.log('✓ OPD user created:');
    } else {
      console.log('✓ OPD user already exists:');
    }
    console.log('  Username: opd_demo');
    console.log('  Password: demo123');
    console.log('  Role: OPD');

    // Check if Pimpinan user exists
    const [pimpinanCheck] = await connection.query(
      'SELECT id FROM users WHERE username = ?',
      ['pimpinan_demo']
    );

    if (pimpinanCheck.length === 0) {
      // Create Pimpinan User
      await connection.query(
        `INSERT INTO users (username, password_hash, nama_lengkap, role, created_at, updated_at) 
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        ['pimpinan_demo', passwordHash, 'Demo Pimpinan', 'Pimpinan']
      );
      console.log('✓ Pimpinan user created:');
    } else {
      console.log('✓ Pimpinan user already exists:');
    }
    console.log('  Username: pimpinan_demo');
    console.log('  Password: demo123');
    console.log('  Role: Pimpinan');

    // Get all users to display IDs
    const [users] = await connection.query(
      'SELECT id, username, nama_lengkap, role FROM users WHERE role IN (?, ?, ?)',
      ['Admin', 'OPD', 'Pimpinan']
    );

    console.log('\n✓ All test users:');
    console.log('┌────┬─────────────────┬───────────────────┬──────────┐');
    console.log('│ ID │ Username        │ Nama Lengkap      │ Role     │');
    console.log('├────┼─────────────────┼───────────────────┼──────────┤');
    users.forEach(user => {
      console.log(`│ ${String(user.id).padEnd(2)} │ ${user.username.padEnd(15)} │ ${user.nama_lengkap.padEnd(17)} │ ${user.role.padEnd(8)} │`);
    });
    console.log('└────┴─────────────────┴───────────────────┴──────────┘');

    // Get OPD user ID for environment variable
    const opdUser = users.find(u => u.role === 'OPD');
    if (opdUser) {
      console.log('\n✓ OPD User ID untuk Postman environment:');
      console.log(`  opd_user_id = ${opdUser.id}`);
    }

    await connection.end();
    console.log('\n✓ Test users creation completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Set opd_user_id di Postman environment');
    console.log('2. Login dengan kredensial di atas untuk testing');
    console.log('3. Mulai testing workflow endpoints');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error creating test users:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

createTestUsers();
