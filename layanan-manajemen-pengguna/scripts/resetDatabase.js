// Reset auth/user database to a clean state for repeatable tests
const sequelize = require('../utils/database');
const User = require('../models/User'); // Import User model to ensure it's registered

async function resetDatabase() {
  try {
    console.log('🔄 Resetting auth database...');
    await sequelize.drop();
    console.log('✓ All tables dropped');

    await sequelize.sync({ force: true });
    console.log('✓ Tables recreated');

    console.log('✅ Reset completed. Run seedTestData.js next.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to reset auth database:', err.message);
    process.exit(1);
  }
}

resetDatabase();
