// scripts/setupDatabase.js
// Setup database untuk layanan-manajemen-pengguna

const sequelize = require('../utils/database');
const User = require('../models/User');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');
    
    // Sync models (create tables)
    await sequelize.sync({ alter: true });
    console.log('✓ All models synchronized');
    
    // Show tables
    const [results] = await sequelize.query('SHOW TABLES');
    console.log(`✓ Tables in database: ${results.map((r, i) => `${i+1}. ${Object.values(r)[0]}`).join(', ')}`);
    
    console.log('✓ Database setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
