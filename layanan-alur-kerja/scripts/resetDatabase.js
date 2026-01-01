// Reset workflow service database for repeatable runs
const sequelize = require('../utils/database');
// Import all models to ensure they're registered
const Disposisi = require('../models/Disposisi');
const DraftIzin = require('../models/DraftIzin');
const KajianTeknis = require('../models/KajianTeknis');
const RevisiDraft = require('../models/RevisiDraft');

async function resetDatabase() {
  try {
    console.log('🔄 Resetting workflow database...');
    await sequelize.drop();
    console.log('✓ Tables dropped');
    await sequelize.sync({ force: true });
    console.log('✓ Tables recreated');
    console.log('✅ Reset completed. Run seedTestData.js next.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to reset workflow database:', err.message);
    process.exit(1);
  }
}

resetDatabase();
