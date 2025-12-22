// Seed workflow service with deterministic records for benchmarking
const sequelize = require('../utils/database');
const Disposisi = require('../models/Disposisi');
const KajianTeknis = require('../models/KajianTeknis');
const DraftIzin = require('../models/DraftIzin');
const RevisiDraft = require('../models/RevisiDraft');

async function seed() {
  try {
    console.log('🌱 Seeding workflow database...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    // Clean existing data
    await RevisiDraft.destroy({ where: {} });
    await KajianTeknis.destroy({ where: {} });
    await DraftIzin.destroy({ where: {} });
    await Disposisi.destroy({ where: {} });

    // Disposisi dataset
    const disposisiData = [];
    for (let i = 1; i <= 30; i++) {
      const status = i <= 15 ? 'selesai' : i <= 20 ? 'dikerjakan' : 'pending';
      disposisiData.push({
        permohonan_id: i,
        nomor_registrasi: `REG-2024-${String(i).padStart(4, '0')}`,
        opd_id: ((i - 1) % 10) + 1,
        disposisi_dari: ((i - 1) % 10) + 1,
        catatan_disposisi: `Disposisi untuk permohonan ${i}`,
        status,
        tanggal_disposisi: new Date(2024, 0, i)
      });
    }
    const disposisi = await Disposisi.bulkCreate(disposisiData, { validate: true });

    // Kajian teknis for first 20 disposisi
    const kajianData = disposisi.slice(0, 20).map((d, idx) => ({
      disposisi_id: d.id,
      permohonan_id: d.permohonan_id,
      opd_id: d.opd_id,
      reviewer_id: d.opd_id,
      hasil_kajian: idx < 12 ? 'disetujui' : idx < 16 ? 'perlu_revisi' : 'ditolak',
      rekomendasi: `Rekomendasi untuk permohonan ${d.permohonan_id}`,
      catatan_teknis: 'Catatan teknis singkat',
      lampiran: [{ file: `kajian-${d.permohonan_id}.pdf`, size: 1024 + idx }],
      tanggal_kajian: new Date(2024, 1, idx + 1)
    }));
    const kajian = await KajianTeknis.bulkCreate(kajianData, { validate: true });

    // Draft izin for first 15 permohonan
    const draftData = kajian.slice(0, 15).map((k, idx) => ({
      permohonan_id: k.permohonan_id,
      nomor_registrasi: `REG-2024-${String(k.permohonan_id).padStart(4, '0')}`,
      nomor_draft: `DRAFT-${20240000 + idx + 1}`,
      isi_draft: `Draft konten untuk permohonan ${k.permohonan_id}`,
      dibuat_oleh: ((idx % 10) + 1),
      status: idx < 8 ? 'disetujui' : idx < 12 ? 'dikirim_ke_pimpinan' : 'perlu_revisi',
      tanggal_kirim_pimpinan: new Date(2024, 1, idx + 1),
      disetujui_oleh: idx < 8 ? ((idx % 5) + 1) : null,
      tanggal_persetujuan: idx < 8 ? new Date(2024, 1, idx + 2) : null
    }));
    const drafts = await DraftIzin.bulkCreate(draftData, { validate: true });

    // Revisi draft for drafts marked perlu_revisi
    const revisiData = drafts
      .filter(d => d.status === 'perlu_revisi')
      .map((d, idx) => ({
        draft_id: d.id,
        diminta_oleh: ((idx % 5) + 1),
        catatan_revisi: `Revisi untuk draft ${d.nomor_draft}`,
        status: idx % 2 === 0 ? 'selesai' : 'pending',
        tanggal_revisi: new Date(2024, 2, idx + 1),
        diselesaikan_oleh: idx % 2 === 0 ? ((idx % 10) + 1) : null,
        tanggal_selesai: idx % 2 === 0 ? new Date(2024, 2, idx + 2) : null
      }));
    const revisi = await RevisiDraft.bulkCreate(revisiData, { validate: true });

    console.log(`✅ Disposisi: ${disposisi.length}`);
    console.log(`✅ Kajian Teknis: ${kajian.length}`);
    console.log(`✅ Draft Izin: ${drafts.length}`);
    console.log(`✅ Revisi Draft: ${revisi.length}`);
    console.log('📌 Data linked to permohonan_id 1..30 to mirror monolith seed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed workflow database:', err.message);
    process.exit(1);
  }
}

seed();
