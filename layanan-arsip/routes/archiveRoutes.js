// routes/archiveRoutes.js
const express = require('express');
const Arsip = require('../models/Arsip');
const { validateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// 1. Receive archiving trigger from Workflow or Survey service (Internal - no auth)
router.post('/api/internal/arsipkan-dokumen', async (req, res) => {
  try {
    const { permohonan_id, nomor_registrasi, user_id, triggered_from } = req.body;

    // Check if archive already exists
    let arsip = await Arsip.findOne({ where: { permohonan_id } });

    if (arsip) {
      // Update existing archive
      arsip.triggered_from = triggered_from || 'unknown';
      arsip.status = 'pending';
      await arsip.save();

      return res.status(200).json({
        message: 'Archive trigger received (already exists)',
        data: {
          arsip_id: arsip.id,
          permohonan_id: arsip.permohonan_id,
          status: arsip.status
        }
      });
    }

    // Create new archive record
    arsip = await Arsip.create({
      permohonan_id,
      nomor_registrasi,
      status: 'pending',
      triggered_from: triggered_from || 'unknown'
    });

    res.status(201).json({
      message: 'Dokumen berhasil diarsipkan',
      data: {
        arsip_id: arsip.id,
        permohonan_id: arsip.permohonan_id,
        nomor_registrasi: arsip.nomor_registrasi,
        status: arsip.status
      }
    });
  } catch (error) {
    console.error('Error receiving archive trigger:', error);
    res.status(500).json({ error: 'Gagal menerima trigger arsip', details: error.message });
  }
});

// 2. Archive license document (Admin/OPD)
router.post('/api/arsip/archive-izin', validateToken, requireRole(['Admin', 'OPD']), async (req, res) => {
  try {
    const { permohonan_id, nomor_registrasi, jenis_izin, file_path, metadata_json } = req.body;

    // Find existing archive or create new
    let arsip = await Arsip.findOne({ where: { permohonan_id } });

    if (arsip) {
      // Update existing archive
      arsip.nomor_registrasi = nomor_registrasi || arsip.nomor_registrasi;
      arsip.jenis_izin = jenis_izin || arsip.jenis_izin;
      arsip.file_path = file_path;
      arsip.metadata_json = metadata_json;
      arsip.archived_at = new Date();
      arsip.status = 'archived';
      await arsip.save();
    } else {
      // Create new archive
      arsip = await Arsip.create({
        permohonan_id,
        nomor_registrasi,
        jenis_izin,
        file_path,
        metadata_json,
        archived_at: new Date(),
        status: 'archived'
      });
    }

    res.status(201).json({
      message: 'License archived successfully',
      data: {
        arsip_id: arsip.id,
        permohonan_id: arsip.permohonan_id,
        nomor_registrasi: arsip.nomor_registrasi,
        file_path: arsip.file_path,
        archived_at: arsip.archived_at,
        status: arsip.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error archiving license', details: error.message });
  }
});

// 3. Set access rights for OPD (Admin)
router.post('/api/arsip/set-hak-akses', validateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const { arsip_id, opd_ids } = req.body;

    // Validate input
    if (!arsip_id || !opd_ids || !Array.isArray(opd_ids)) {
      return res.status(400).json({ error: 'arsip_id and opd_ids (array) are required' });
    }

    const arsip = await Arsip.findByPk(arsip_id);
    
    if (!arsip) {
      return res.status(404).json({ error: 'Archive not found' });
    }

    // Update access rights
    const existingAccess = arsip.hak_akses_opd || [];
    const updatedAccess = [...new Set([...existingAccess, ...opd_ids])]; // Merge and remove duplicates
    
    arsip.hak_akses_opd = updatedAccess;
    await arsip.save();

    res.status(200).json({
      message: 'Access rights updated successfully',
      data: {
        arsip_id: arsip.id,
        permohonan_id: arsip.permohonan_id,
        nomor_registrasi: arsip.nomor_registrasi,
        hak_akses_opd: arsip.hak_akses_opd
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error setting access rights', details: error.message });
  }
});

// 4. Get archived license data by ID (Admin/OPD - with access check for OPD)
router.get('/api/arsip/:id', validateToken, requireRole(['Admin', 'OPD', 'Pimpinan']), async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const arsip = await Arsip.findByPk(id);

    if (!arsip) {
      return res.status(404).json({ error: 'Archive not found' });
    }

    // Access control for OPD
    if (userRole === 'OPD') {
      const hasAccess = arsip.hak_akses_opd && arsip.hak_akses_opd.includes(userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to view this archive' });
      }
    }

    // Update status to 'accessed' if archived
    if (arsip.status === 'archived') {
      arsip.status = 'accessed';
      await arsip.save();
    }

    res.status(200).json({
      message: 'Archive data retrieved successfully',
      data: arsip
    });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving archive', details: error.message });
  }
});

module.exports = router;