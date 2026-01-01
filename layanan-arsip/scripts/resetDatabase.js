// Reset archive service database for consistent benchmarks
const sequelize = require('../utils/database');
const Arsip = require('../models/Arsip'); // Import Arsip model to ensure it's registered

async function resetDatabase() {
  try {
    console.log('🔄 Resetting archive database...');
    await sequelize.drop();
    console.log('✓ Tables dropped');
    await sequelize.sync({ force: true });
    console.log('✓ Tables recreated');
    console.log('✅ Reset completed. Run seedTestData.js next.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to reset archive database:', err.message);
    process.exit(1);
  }
}

resetDatabase();
