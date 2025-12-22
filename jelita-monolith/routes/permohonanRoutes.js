// routes/permohonanRoutes.js - Application/Registration Routes
const express = require('express');
const Permohonan = require('../models/Permohonan');
const Dokumen = require('../models/Dokumen');
const SKM = require('../models/SKM');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Tiny in-memory cache to avoid repeated list scans under load
const listCache = new Map();
function getCached(key) {
  const entry = listCache.get(key);
  if (entry && entry.exp > Date.now()) return entry.value;
  listCache.delete(key);
  return null;
}
function setCached(key, value, ttlMs = 5000) {
  listCache.set(key, { value, exp: Date.now() + ttlMs });
}

// Create a new application
router.post('/api/permohonan', authMiddleware, async (req, res) => {
  try {
    const { data_pemohon } = req.body;
    const user_id = req.user.id;

    const newPermohonan = await Permohonan.create({
      user_id,
      status: 'draft',
      data_pemohon,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Permohonan created successfully',
      data: newPermohonan
    });
  } catch (error) {
    console.error('Create permohonan error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create application', 
      error: error.message 
    });
  }
});

// Submit application (change status to submitted)
router.post('/api/permohonan/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const permohonan = await Permohonan.findByPk(id);
    
    if (!permohonan) {
      return res.status(404).json({ 
        success: false,
        message: 'Application not found' 
      });
    }

    if (permohonan.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    // Generate registration number with random suffix to avoid unique collisions under load
    const timestamp = Date.now();
    const nonce = Math.floor(Math.random() * 1_000_000);
    const nomor_registrasi = `REG-${timestamp}-${nonce}`;

    await permohonan.update({
      status: 'submitted',
      nomor_registrasi,
      updated_at: new Date()
    });

    // Ensure SKM record exists immediately after submission to avoid 404 lookups
    await SKM.findOrCreate({
      where: { permohonan_id: permohonan.id },
      defaults: {
        permohonan_id: permohonan.id,
        user_id: permohonan.user_id,
        nomor_registrasi,
        jawaban_json: {},
        status: 'pending',
        notified_at: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: permohonan
    });
  } catch (error) {
    console.error('Submit permohonan error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit application', 
      error: error.message 
    });
  }
});

// Get all applications (for admin/staff) with pagination to avoid large scans under load
router.get('/api/permohonan', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    // If user is Pemohon, only show their applications
    if (req.user.peran === 'Pemohon') {
      where.user_id = req.user.id;
    }

    if (status) {
      where.status = status;
    }

    // Basic pagination defaults (aggressive to keep p95 under SLA)
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 25);
    const offset = parseInt(req.query.offset, 10) || 0;

    // Cached hot path for admin viewing submitted list
    const cacheKey = `${req.user.peran}-${status || 'all'}-${limit}-${offset}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const permohonan = await Permohonan.findAll({
      where,
      limit,
      offset,
      order: [['updated_at', 'DESC']],
      // Return only key fields to shrink payload and speed serialization
      attributes: ['id', 'user_id', 'nomor_registrasi', 'status', 'updated_at'],
      raw: true,
    });

    setCached(cacheKey, permohonan);

    res.json({
      success: true,
      data: permohonan
    });
  } catch (error) {
    console.error('Get permohonan error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve applications', 
      error: error.message 
    });
  }
});

// Get application by ID
router.get('/api/permohonan/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const permohonan = await Permohonan.findByPk(id, {
      attributes: ['id', 'user_id', 'nomor_registrasi', 'status', 'data_pemohon', 'created_at', 'updated_at'],
      raw: true,
    });

    if (!permohonan) {
      return res.status(404).json({ 
        success: false,
        message: 'Application not found' 
      });
    }

    // Check access
    if (req.user.peran === 'Pemohon' && permohonan.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      data: permohonan
    });
  } catch (error) {
    console.error('Get permohonan by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve application', 
      error: error.message 
    });
  }
});

// Update application status (for admin)
router.put('/api/permohonan/:id/status', authMiddleware, authorize('Admin', 'OPD'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const permohonan = await Permohonan.findByPk(id);
    if (!permohonan) {
      return res.status(404).json({ 
        success: false,
        message: 'Application not found' 
      });
    }

    await permohonan.update({
      status,
      updated_at: new Date()
    });

    // When approved, ensure SKM entry exists for survey submission
    if (status === 'approved') {
      await SKM.findOrCreate({
        where: { permohonan_id: permohonan.id },
        defaults: {
          permohonan_id: permohonan.id,
          user_id: permohonan.user_id,
          nomor_registrasi: permohonan.nomor_registrasi,
          jawaban_json: {},
          status: 'pending',
          notified_at: new Date()
        }
      });
    }

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: permohonan
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update application status', 
      error: error.message 
    });
  }
});

module.exports = router;
