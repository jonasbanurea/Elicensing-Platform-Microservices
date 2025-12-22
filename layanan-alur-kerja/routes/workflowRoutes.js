const express = require('express');
const Disposisi = require('../models/Disposisi');
const KajianTeknis = require('../models/KajianTeknis');
const DraftIzin = require('../models/DraftIzin');
const RevisiDraft = require('../models/RevisiDraft');
const { validateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Lightweight routes to align with load-test expectations
router.get('/api/disposisi', validateToken, async (req, res) => {
  try {
    const list = await Disposisi.findAll({ limit: 20, order: [['created_at', 'DESC']] });
    res.status(200).json({ success: true, message: 'Disposisi list', data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch disposisi', error: error.message });
  }
});

router.post('/api/disposisi', validateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const { permohonan_id, opd_id, catatan_disposisi } = req.body;
    const newDisposisi = await Disposisi.create({
      permohonan_id,
      nomor_registrasi: req.body.nomor_registrasi || null,
      opd_id: opd_id || 1,
      disposisi_dari: req.user.id,
      catatan_disposisi: catatan_disposisi || 'Auto generated',
      status: 'pending',
      tanggal_disposisi: new Date(),
    });
    res.status(201).json({ success: true, message: 'Disposisi created', data: newDisposisi });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create disposisi', error: error.message });
  }
});

router.post('/api/kajian-teknis', validateToken, requireRole(['OPD']), async (req, res) => {
  try {
    const { disposisi_id, permohonan_id, hasil_kajian, rekomendasi, catatan_teknis } = req.body;
    const kajian = await KajianTeknis.create({
      disposisi_id,
      permohonan_id,
      opd_id: req.user.id,
      reviewer_id: req.user.id,
      hasil_kajian: hasil_kajian || 'disetujui',
      rekomendasi: rekomendasi || 'OK',
      catatan_teknis: catatan_teknis || 'Auto',
      tanggal_kajian: new Date(),
    });
    res.status(201).json({ success: true, message: 'Kajian teknis created', data: kajian });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create kajian teknis', error: error.message });
  }
});

router.get('/api/draft-izin', validateToken, async (req, res) => {
  try {
    const drafts = await DraftIzin.findAll({ limit: 10, order: [['created_at', 'DESC']] });
    res.status(200).json({ success: true, message: 'Draft list', data: drafts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch drafts', error: error.message });
  }
});

router.put('/api/draft-izin/:id/setujui', validateToken, requireRole(['Pimpinan']), async (req, res) => {
  try {
    const draft = await DraftIzin.findByPk(req.params.id);
    if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });
    await draft.update({ status: 'disetujui', disetujui_oleh: req.user.id, tanggal_persetujuan: new Date() });
    res.status(200).json({ success: true, message: 'Draft approved', data: draft });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve draft', error: error.message });
  }
});

// Receive trigger for technical workflow
router.post('/api/internal/receive-trigger', async (req, res) => {
  try {
    const { permohonan_id, opd_id } = req.body;

    const newDisposisi = await Disposisi.create({
      permohonan_id,
      opd_id,
      status: 'Pending',
    });

    res.status(201).json(newDisposisi);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create disposisi', details: error.message });
  }
});

// Input technical review
router.post('/api/workflow/kajian-teknis', validateToken, requireRole(['OPD']), async (req, res) => {
  try {
    const { 
      permohonan_id, 
      opd_id,
      hasil_kajian, 
      rekomendasi,
      catatan_teknis,
      lampiran 
    } = req.body;

    const newKajianTeknis = await KajianTeknis.create({
      permohonan_id,
      opd_id,
      reviewer_id: req.user.id,
      hasil_kajian,
      rekomendasi,
      catatan_teknis,
      lampiran,
      tanggal_kajian: new Date()
    });

    res.status(201).json({
      message: 'Kajian teknis berhasil dibuat',
      data: newKajianTeknis
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal membuat kajian teknis', details: error.message });
  }
});

// Create Disposisi OPD (Admin assigns to OPD)
router.post('/api/workflow/disposisi-opd', validateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const { 
      permohonan_id, 
      nomor_registrasi,
      opd_id,
      catatan_disposisi 
    } = req.body;

    const newDisposisi = await Disposisi.create({
      permohonan_id,
      nomor_registrasi,
      opd_id,
      disposisi_dari: req.user.id,
      catatan_disposisi,
      status: 'pending',
      tanggal_disposisi: new Date()
    });

    res.status(201).json({
      message: 'Disposisi ke OPD berhasil dibuat',
      data: newDisposisi
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal membuat disposisi', details: error.message });
  }
});

// Forward to Pimpinan (Admin forwards draft license to leadership)
router.post('/api/workflow/forward-to-pimpinan', validateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const { 
      permohonan_id,
      nomor_registrasi,
      nomor_draft,
      isi_draft 
    } = req.body;

    const newDraft = await DraftIzin.create({
      permohonan_id,
      nomor_registrasi,
      nomor_draft,
      isi_draft,
      dibuat_oleh: req.user.id,
      status: 'dikirim_ke_pimpinan',
      tanggal_kirim_pimpinan: new Date()
    });

    res.status(201).json({
      message: 'Draft izin berhasil dikirim ke pimpinan',
      data: newDraft
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengirim draft ke pimpinan', details: error.message });
  }
});

// Revisi Draft Izin (Pimpinan requests revision)
router.post('/api/workflow/revisi-draft', validateToken, requireRole(['Pimpinan']), async (req, res) => {
  try {
    const { 
      draft_id,
      catatan_revisi 
    } = req.body;

    // Update status draft menjadi perlu_revisi
    const draft = await DraftIzin.findByPk(draft_id);
    if (!draft) {
      return res.status(404).json({ error: 'Draft tidak ditemukan' });
    }

    await draft.update({ status: 'perlu_revisi' });

    // Buat record revisi
    const newRevisi = await RevisiDraft.create({
      draft_id,
      diminta_oleh: req.user.id,
      catatan_revisi,
      status: 'pending',
      tanggal_revisi: new Date()
    });

    res.status(201).json({
      message: 'Permintaan revisi draft berhasil dibuat',
      data: {
        revisi: newRevisi,
        draft: draft
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal membuat permintaan revisi', details: error.message });
  }
});

module.exports = router;