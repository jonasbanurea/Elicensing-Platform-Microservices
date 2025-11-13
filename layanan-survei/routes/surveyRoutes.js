const express = require('express');
const SKM = require('../models/SKM');
const { validateToken, requireRole } = require('../middleware/authMiddleware');
const axios = require('axios');

const router = express.Router();

// 1. Send notification for SKM survey (Admin/OPD triggers this)
router.post('/api/skm/notifikasi', validateToken, requireRole(['Admin', 'OPD']), async (req, res) => {
  try {
    const { permohonan_id, user_id, nomor_registrasi } = req.body;

    // Check if SKM already exists for this permohonan
    let skm = await SKM.findOne({ where: { permohonan_id } });

    if (!skm) {
      // Create new SKM record with pending status
      skm = await SKM.create({
        permohonan_id,
        user_id,
        nomor_registrasi,
        jawaban_json: {},
        status: 'pending',
        notified_at: new Date()
      });
    } else {
      // Update notified_at timestamp
      await skm.update({ notified_at: new Date() });
    }

    // In production: send email/SMS with survey link
    const surveyLink = `http://localhost:3030/survey/${permohonan_id}`;

    res.status(200).json({ 
      message: 'Notifikasi SKM berhasil dikirim',
      data: {
        permohonan_id,
        nomor_registrasi,
        survey_link: surveyLink,
        skm_id: skm.id,
        notified_at: skm.notified_at
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengirim notifikasi', details: error.message });
  }
});

// 2. Get SKM form questions (Public - no auth required, or Pemohon only)
router.get('/api/skm/form', async (req, res) => {
  try {
    // Standard SKM questions based on Permenpan RB No. 14 Tahun 2017
    const formQuestions = {
      title: 'Survei Kepuasan Masyarakat (SKM)',
      description: 'Mohon luangkan waktu Anda untuk mengisi survei kepuasan layanan kami',
      questions: [
        {
          id: 1,
          pertanyaan: 'Bagaimana pendapat Saudara tentang kesesuaian persyaratan pelayanan dengan jenis pelayanannya?',
          unsur: 'Persyaratan',
          skala: [
            { nilai: 1, label: 'Tidak Sesuai' },
            { nilai: 2, label: 'Kurang Sesuai' },
            { nilai: 3, label: 'Sesuai' },
            { nilai: 4, label: 'Sangat Sesuai' }
          ]
        },
        {
          id: 2,
          pertanyaan: 'Bagaimana pemahaman Saudara tentang kemudahan prosedur pelayanan di unit ini?',
          unsur: 'Prosedur',
          skala: [
            { nilai: 1, label: 'Tidak Mudah' },
            { nilai: 2, label: 'Kurang Mudah' },
            { nilai: 3, label: 'Mudah' },
            { nilai: 4, label: 'Sangat Mudah' }
          ]
        },
        {
          id: 3,
          pertanyaan: 'Bagaimana pendapat Saudara tentang kecepatan waktu dalam memberikan pelayanan?',
          unsur: 'Waktu Pelayanan',
          skala: [
            { nilai: 1, label: 'Tidak Cepat' },
            { nilai: 2, label: 'Kurang Cepat' },
            { nilai: 3, label: 'Cepat' },
            { nilai: 4, label: 'Sangat Cepat' }
          ]
        },
        {
          id: 4,
          pertanyaan: 'Bagaimana pendapat Saudara tentang kewajaran biaya/tarif dalam pelayanan?',
          unsur: 'Biaya/Tarif',
          skala: [
            { nilai: 1, label: 'Sangat Mahal' },
            { nilai: 2, label: 'Cukup Mahal' },
            { nilai: 3, label: 'Murah' },
            { nilai: 4, label: 'Gratis' }
          ]
        },
        {
          id: 5,
          pertanyaan: 'Bagaimana pendapat Saudara tentang kesesuaian produk pelayanan antara yang tercantum dalam standar pelayanan dengan hasil yang diberikan?',
          unsur: 'Produk Spesifikasi Jenis Pelayanan',
          skala: [
            { nilai: 1, label: 'Tidak Sesuai' },
            { nilai: 2, label: 'Kurang Sesuai' },
            { nilai: 3, label: 'Sesuai' },
            { nilai: 4, label: 'Sangat Sesuai' }
          ]
        },
        {
          id: 6,
          pertanyaan: 'Bagaimana pendapat Saudara tentang kompetensi/kemampuan petugas dalam pelayanan?',
          unsur: 'Kompetensi Pelaksana',
          skala: [
            { nilai: 1, label: 'Tidak Kompeten' },
            { nilai: 2, label: 'Kurang Kompeten' },
            { nilai: 3, label: 'Kompeten' },
            { nilai: 4, label: 'Sangat Kompeten' }
          ]
        },
        {
          id: 7,
          pertanyaan: 'Bagaimana pendapat Saudara tentang perilaku petugas dalam pelayanan terkait kesopanan dan keramahan?',
          unsur: 'Perilaku Pelaksana',
          skala: [
            { nilai: 1, label: 'Tidak Sopan dan Ramah' },
            { nilai: 2, label: 'Kurang Sopan dan Ramah' },
            { nilai: 3, label: 'Sopan dan Ramah' },
            { nilai: 4, label: 'Sangat Sopan dan Ramah' }
          ]
        },
        {
          id: 8,
          pertanyaan: 'Bagaimana pendapat Saudara tentang kualitas sarana dan prasarana?',
          unsur: 'Sarana dan Prasarana',
          skala: [
            { nilai: 1, label: 'Buruk' },
            { nilai: 2, label: 'Cukup' },
            { nilai: 3, label: 'Baik' },
            { nilai: 4, label: 'Sangat Baik' }
          ]
        },
        {
          id: 9,
          pertanyaan: 'Bagaimana pendapat Saudara tentang penanganan pengaduan pengguna layanan?',
          unsur: 'Penanganan Pengaduan',
          skala: [
            { nilai: 1, label: 'Tidak Ada' },
            { nilai: 2, label: 'Ada tetapi Tidak Berfungsi' },
            { nilai: 3, label: 'Berfungsi Kurang Maksimal' },
            { nilai: 4, label: 'Dikelola Dengan Baik' }
          ]
        }
      ],
      additional: {
        saran: 'Saran dan masukan untuk perbaikan layanan (opsional)'
      }
    };

    res.status(200).json({
      message: 'Form SKM berhasil diambil',
      data: formQuestions
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil form SKM', details: error.message });
  }
});

// 3. Submit SKM survey (Pemohon submits after completing)
router.post('/api/skm/submit', validateToken, requireRole(['Pemohon']), async (req, res) => {
  try {
    const { permohonan_id, jawaban_json } = req.body;

    // Find existing SKM record
    let skm = await SKM.findOne({ where: { permohonan_id } });

    if (!skm) {
      // Create new if not exists
      skm = await SKM.create({
        permohonan_id,
        user_id: req.user.id,
        jawaban_json,
        status: 'completed',
        submitted_at: new Date()
      });
    } else {
      // Update existing
      await skm.update({
        jawaban_json,
        status: 'completed',
        submitted_at: new Date()
      });
    }

    // Calculate SKM score
    const answers = jawaban_json.answers || [];
    const totalScore = answers.reduce((sum, ans) => sum + (ans.nilai || 0), 0);
    const averageScore = answers.length > 0 ? (totalScore / answers.length) : 0;
    const skmValue = (averageScore / 4) * 100; // Convert to 0-100 scale

    // Determine satisfaction category
    let category = '';
    if (skmValue >= 88.31) category = 'Sangat Baik';
    else if (skmValue >= 76.61) category = 'Baik';
    else if (skmValue >= 65.00) category = 'Kurang Baik';
    else category = 'Tidak Baik';

    res.status(201).json({
      message: 'Survei SKM berhasil disubmit',
      data: {
        skm_id: skm.id,
        permohonan_id: skm.permohonan_id,
        status: skm.status,
        submitted_at: skm.submitted_at,
        score: {
          total: totalScore,
          average: averageScore.toFixed(2),
          skm_value: skmValue.toFixed(2),
          category: category
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal submit survei', details: error.message });
  }
});

// 4. Recap SKM results (Admin/OPD views statistics)
router.get('/api/skm/rekap', validateToken, requireRole(['Admin', 'OPD', 'Pimpinan']), async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    // Build query conditions
    const whereConditions = {};
    if (status) whereConditions.status = status;
    if (startDate && endDate) {
      whereConditions.submitted_at = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const results = await SKM.findAll({ 
      where: whereConditions,
      order: [['submitted_at', 'DESC']]
    });

    // Calculate overall statistics
    const completedSurveys = results.filter(s => s.status === 'completed');
    const totalCompleted = completedSurveys.length;
    
    let totalSkmValue = 0;
    let categoryCount = { 'Sangat Baik': 0, 'Baik': 0, 'Kurang Baik': 0, 'Tidak Baik': 0 };

    completedSurveys.forEach(skm => {
      const answers = skm.jawaban_json.answers || [];
      const totalScore = answers.reduce((sum, ans) => sum + (ans.nilai || 0), 0);
      const averageScore = answers.length > 0 ? (totalScore / answers.length) : 0;
      const skmValue = (averageScore / 4) * 100;

      totalSkmValue += skmValue;

      if (skmValue >= 88.31) categoryCount['Sangat Baik']++;
      else if (skmValue >= 76.61) categoryCount['Baik']++;
      else if (skmValue >= 65.00) categoryCount['Kurang Baik']++;
      else categoryCount['Tidak Baik']++;
    });

    const averageSkmValue = totalCompleted > 0 ? (totalSkmValue / totalCompleted).toFixed(2) : 0;

    res.status(200).json({
      message: 'Rekap SKM berhasil diambil',
      data: {
        total_surveys: results.length,
        completed: totalCompleted,
        pending: results.filter(s => s.status === 'pending').length,
        average_skm_value: averageSkmValue,
        category_distribution: categoryCount,
        surveys: results.map(skm => {
          const answers = skm.jawaban_json.answers || [];
          const totalScore = answers.reduce((sum, ans) => sum + (ans.nilai || 0), 0);
          const avgScore = answers.length > 0 ? (totalScore / answers.length) : 0;
          const skmVal = (avgScore / 4) * 100;

          return {
            id: skm.id,
            permohonan_id: skm.permohonan_id,
            nomor_registrasi: skm.nomor_registrasi,
            status: skm.status,
            submitted_at: skm.submitted_at,
            skm_value: skmVal.toFixed(2)
          };
        })
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil rekap SKM', details: error.message });
  }
});

// 5. Unlock download access (Internal - triggered after SKM completion)
router.post('/api/internal/buka-akses-download', async (req, res) => {
  try {
    const { permohonan_id } = req.body;

    // Find SKM record
    const skm = await SKM.findOne({ where: { permohonan_id } });

    if (!skm) {
      return res.status(404).json({ error: 'SKM tidak ditemukan' });
    }

    if (skm.status !== 'completed') {
      return res.status(400).json({ error: 'SKM belum diselesaikan' });
    }

    // Unlock download access
    await skm.update({
      download_unlocked: true,
      download_unlocked_at: new Date()
    });

    // Notify Application Service to update permohonan status
    try {
      await axios.post(`${process.env.APPLICATION_SERVICE_URL}/api/internal/update-download-status`, {
        permohonan_id,
        download_enabled: true
      });
    } catch (error) {
      console.error('Failed to notify Application Service:', error.message);
    }

    res.status(200).json({
      message: 'Akses download berhasil dibuka',
      data: {
        permohonan_id,
        download_unlocked: true,
        download_unlocked_at: skm.download_unlocked_at
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal membuka akses download', details: error.message });
  }
});

// 6. Trigger archiving (Internal - triggered after applicant downloads license)
router.post('/api/internal/trigger-pengarsipan', async (req, res) => {
  try {
    const { permohonan_id, nomor_registrasi, user_id } = req.body;

    // Trigger Archive Service
    try {
      const archiveResponse = await axios.post(`${process.env.ARCHIVE_SERVICE_URL}/api/internal/arsipkan-dokumen`, {
        permohonan_id,
        nomor_registrasi,
        user_id,
        triggered_from: 'survey_service'
      });

      res.status(200).json({
        message: 'Pengarsipan berhasil ditrigger',
        data: {
          permohonan_id,
          archive_response: archiveResponse.data
        }
      });
    } catch (error) {
      console.error('Failed to trigger Archive Service:', error.message);
      res.status(500).json({ 
        error: 'Gagal trigger Archive Service',
        details: error.message 
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Gagal trigger pengarsipan', details: error.message });
  }
});

module.exports = router;