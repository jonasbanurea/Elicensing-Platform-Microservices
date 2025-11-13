// Script to create Pemohon user for testing
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createPemohonUser() {
  let connection;
  
  try {
    // Connect to MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: 'jelita_users'
    });

    console.log('✓ Connected to jelita_users database');

    // Hash password
    const passwordHash = await bcrypt.hash('demo123', 10);
    console.log('✓ Password hashed');

    // Check if Pemohon user already exists
    const [existing] = await connection.execute(
      'SELECT id, username FROM users WHERE username = ?',
      ['pemohon_demo']
    );

    if (existing.length > 0) {
      console.log('\n⚠️  User pemohon_demo already exists!');
      console.log(`   User ID: ${existing[0].id}`);
      console.log(`   Username: ${existing[0].username}`);
      
      // Show all Pemohon users
      const [pemohonUsers] = await connection.execute(
        'SELECT id, username, nama_lengkap, role FROM users WHERE role = ?',
        ['Pemohon']
      );
      
      console.log('\n📋 All Pemohon users:');
      console.table(pemohonUsers);
      
    } else {
      // Create new Pemohon user
      const [result] = await connection.execute(
        `INSERT INTO users (username, password_hash, nama_lengkap, role, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [
          'pemohon_demo',
          passwordHash,
          'Demo Pemohon User',
          'Pemohon'
        ]
      );

      console.log('\n✅ Pemohon user created successfully!');
      console.log(`   User ID: ${result.insertId}`);
      console.log(`   Username: pemohon_demo`);
      console.log(`   Password: demo123`);
      console.log(`   Role: Pemohon`);

      // Show the created user
      const [newUser] = await connection.execute(
        'SELECT id, username, nama_lengkap, role FROM users WHERE id = ?',
        [result.insertId]
      );
      
      console.log('\n📋 Created user details:');
      console.table(newUser);
    }

    // Show all users by role
    const [allUsers] = await connection.execute(
      'SELECT id, username, nama_lengkap, role FROM users ORDER BY role, id'
    );
    
    console.log('\n📊 All users in database:');
    console.table(allUsers);

    console.log('\n✓ Setup completed!');
    console.log('\n💡 Login credentials for testing:');
    console.log('   Username: pemohon_demo');
    console.log('   Password: demo123');
    console.log('   Role: Pemohon');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
createPemohonUser();
