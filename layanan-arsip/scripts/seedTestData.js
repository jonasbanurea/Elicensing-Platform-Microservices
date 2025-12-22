// Seed archive service with predictable records
const sequelize = require('../utils/database');
const Arsip = require('../models/Arsip');

async function seed() {
  try {
    console.log('🌱 Seeding archive database...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    await Arsip.destroy({ where: {} });

    const arsipData = [];
    for (let i = 1; i <= 20; i++) {
      arsipData.push({
        permohonan_id: i,
        nomor_registrasi: `REG-2024-${String(i).padStart(4, '0')}`,
        jenis_izin: ['IMB', 'SIUP', 'TDP', 'HO'][i % 4],
        file_path: `/arsip/izin-${i}.pdf`,
        metadata_json: { source: 'seed', permohonan_id: i },
        archived_at: new Date(2024, 2, i),
        hak_akses_opd: [((i - 1) % 10) + 1],
        status: i <= 10 ? 'archived' : 'accessed',
        triggered_from: 'seed-script'
      });
    }

    const arsip = await Arsip.bulkCreate(arsipData, { validate: true });

    console.log(`✅ Arsip records created: ${arsip.length}`);
    console.log('📌 Records reference permohonan_id 1..20 to mirror monolith approvals.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed archive database:', err.message);
    process.exit(1);
  }
}

seed();
