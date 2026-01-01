// Reset survey service database for consistent benchmarks
const sequelize = require('../utils/database');
const SKM = require('../models/SKM'); // Import SKM model to ensure it's registered

async function resetDatabase() {
  try {
    console.log('🔄 Resetting survey database...');
    
    // First, drop all tables (including SKM)
    await sequelize.drop();
    console.log('✓ Tables dropped');
    
    // Recreate all tables
    await sequelize.sync({ force: true });
    console.log('✓ Tables recreated');
    
    console.log('✅ Reset completed. Run seedTestData.js next.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to reset survey database:', err.message);
    process.exit(1);
  }
}

resetDatabase();
