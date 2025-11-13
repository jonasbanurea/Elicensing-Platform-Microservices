const sequelize = require('../utils/database');
const SKM = require('../models/SKM');

async function setupDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connection has been established successfully.');

    // Sync all models
    await sequelize.sync({ force: false });
    console.log('✓ All models were synchronized successfully.');

    // Show created tables
    const [tables] = await sequelize.query("SHOW TABLES");
    console.log('\n✓ Tables in database:');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`  ${index + 1}. ${tableName}`);
    });

    console.log('\n✓ Database setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Unable to setup database:', error);
    process.exit(1);
  }
}

setupDatabase();
