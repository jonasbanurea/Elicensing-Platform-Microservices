const sequelize = require('../utils/database');
const Permohonan = require('../models/Permohonan');
const Dokumen = require('../models/Dokumen');

async function setupDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully.');

    console.log('\nSyncing models...');
    await sequelize.sync({ force: false }); // Set force: true to drop existing tables
    console.log('✓ Database models synced successfully.');

    console.log('\nDatabase setup complete!');
    console.log('Tables created:');
    console.log('- permohonan');
    console.log('- dokumen');

    process.exit(0);
  } catch (error) {
    console.error('✗ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
