// Seed pendaftaran service with deterministic dataset matching monolith
const sequelize = require('../utils/database');
const Permohonan = require('../models/Permohonan');
const Dokumen = require('../models/Dokumen');

async function seed() {
  try {
    console.log('🌱 Seeding pendaftaran database...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    // Clear existing data and reset autoincrement to avoid FK mismatches
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    await sequelize.query('TRUNCATE TABLE dokumen;');
    await sequelize.query('TRUNCATE TABLE permohonan;');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    const permohonanData = [];
    for (let i = 1; i <= 100; i++) {
      const userId = ((i - 1) % 50) + 1; // Align with pemohon users
      permohonanData.push({
        user_id: userId,
        nomor_registrasi: i <= 50 ? `REG-2024-${String(i).padStart(4, '0')}` : null,
        status: i <= 30 ? 'approved' : i <= 50 ? 'submitted' : 'draft',
        data_pemohon: {
          nama: `Pemohon ${userId}`,
          alamat: `Jl. Test No. ${i}`,
          jenis_izin: ['IMB', 'SIUP', 'TDP', 'HO'][i % 4],
          luas_bangunan: 100 + i * 10,
          tahun: 2024
        },
        created_at: new Date(2024, 0, i),
        updated_at: new Date(2024, 0, i)
      });
    }

    const permohonan = await Permohonan.bulkCreate(permohonanData, { validate: true });
    console.log(`✅ Permohonan created: ${permohonan.length}`);

    const dokumenData = [];
    for (let i = 1; i <= 100; i++) {
      dokumenData.push({
        permohonan_id: i,
        jenis_dokumen: 'KTP',
        nama_file: `ktp-${i}.pdf`,
        path_file: `/uploads/ktp-${i}.pdf`,
        ukuran_file: 512000 + i * 1000,
        status_verifikasi: i <= 30 ? 'verified' : i <= 50 ? 'pending' : 'pending'
      });
      dokumenData.push({
        permohonan_id: i,
        jenis_dokumen: 'Surat Permohonan',
        nama_file: `surat-${i}.pdf`,
        path_file: `/uploads/surat-${i}.pdf`,
        ukuran_file: 768000 + i * 1500,
        status_verifikasi: i <= 30 ? 'verified' : i <= 50 ? 'pending' : 'pending'
      });
    }

    const dokumen = await Dokumen.bulkCreate(dokumenData, { validate: true });
    console.log(`✅ Dokumen created: ${dokumen.length}`);

    console.log('\nSeed summary:');
    console.log(' - Approved permohonan: 30');
    console.log(' - Submitted permohonan: 20');
    console.log(' - Draft permohonan: 50');
    console.log(' - Dokumen per permohonan: 2');
    console.log('Default users/password live in auth service seed (password123).');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed pendaftaran database:', err.message);
    process.exit(1);
  }
}

seed();
