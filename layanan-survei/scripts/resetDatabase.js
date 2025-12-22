// Reset survey service database for consistent benchmarks
const sequelize = require('../utils/database');

async function resetDatabase() {
  try {
    console.log('🔄 Resetting survey database...');
    await sequelize.drop();
    console.log('✓ Tables dropped');
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
