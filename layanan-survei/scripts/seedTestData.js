// Seed survey/SKM service with deterministic records
const sequelize = require('../utils/database');
const SKM = require('../models/SKM');

async function seed() {
  try {
    console.log('🌱 Seeding survey database...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    await SKM.destroy({ where: {} });

    const records = [];
    for (let i = 1; i <= 30; i++) {
      const completed = i <= 18;
      const answers = Array.from({ length: 9 }, (_, idx) => ({
        pertanyaan: idx + 1,
        nilai: ((idx + i) % 4) + 1
      }));
      const totalScore = answers.reduce((sum, a) => sum + a.nilai, 0);
      const averageScore = totalScore / answers.length;
      const skmValue = (averageScore / 4) * 100;

      records.push({
        permohonan_id: i,
        user_id: ((i - 1) % 50) + 1,
        nomor_registrasi: `REG-2024-${String(i).padStart(4, '0')}`,
        jawaban_json: { answers },
        status: completed ? 'completed' : 'pending',
        submitted_at: completed ? new Date(2024, 2, i) : null,
        notified_at: new Date(2024, 1, i),
        download_unlocked: completed && i % 3 === 0,
        download_unlocked_at: completed && i % 3 === 0 ? new Date(2024, 2, i + 1) : null,
        created_at: new Date(2024, 1, i),
        updated_at: new Date(2024, 1, i)
      });
    }

    const skm = await SKM.bulkCreate(records, { validate: true });

    console.log(`✅ SKM records created: ${skm.length}`);
    console.log('📌 Completed:', skm.filter(s => s.status === 'completed').length);
    console.log('📌 Pending:', skm.filter(s => s.status === 'pending').length);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed survey database:', err.message);
    process.exit(1);
  }
}

seed();
