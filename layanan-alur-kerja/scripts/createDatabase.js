const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  let connection;
  
  try {
    // Connect to MySQL without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'jelita_workflow';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database '${dbName}' created or already exists`);

    await connection.end();
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error creating database:', error);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

createDatabase();
