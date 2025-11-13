const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  try {
    // Connect without specifying database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('Connected to MySQL server');

    // Create database
    const dbName = process.env.DB_NAME;
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✓ Database '${dbName}' created or already exists`);

    await connection.end();
    console.log('\nDatabase creation complete!');
    console.log('You can now run: node scripts/setupDatabase.js');
  } catch (error) {
    console.error('✗ Database creation failed:', error.message);
    process.exit(1);
  }
}

createDatabase();
