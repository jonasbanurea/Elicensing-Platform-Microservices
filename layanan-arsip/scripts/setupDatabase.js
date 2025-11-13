// scripts/setupDatabase.js
const sequelize = require('../utils/database');
const Arsip = require('../models/Arsip');

async function setupDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connection has been established successfully.');

    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✓ All models were synchronized successfully.');

    // List tables
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
    `);
    
    console.log('\n✓ Tables in database:');
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.TABLE_NAME}`);
    });

    console.log('\n✓ Database setup completed!\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
