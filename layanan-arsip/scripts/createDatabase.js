// scripts/createDatabase.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  let connection;
  
  try {
    // Connect to MySQL server (without specific database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('✓ Connected to MySQL server');

    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`✓ Database '${process.env.DB_NAME}' created or already exists`);

    console.log('\n✓ Database setup completed successfully\n');

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDatabase();
