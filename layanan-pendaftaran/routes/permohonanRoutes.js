const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const axios = require('axios');
const Permohonan = require('../models/Permohonan');
const Dokumen = require('../models/Dokumen');
const { validateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
const ARSIP_SERVICE_URL = process.env.ARSIP_SERVICE_URL || 'http://archive-service:3040';

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDF, and DOC files are allowed!'));
    }
  }
});

// OSS webhook callback to update status and trigger archiving (no auth, called by OSS mock)
router.post('/api/webhooks/oss/status-update', async (req, res) => {
  try {
    const { permohonan_id, reference_id, status, approval_number, metadata } = req.body || {};
    const targetId = permohonan_id || reference_id; // accept either field

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'permohonan_id or reference_id is required' });
    }

    const permohonan = await Permohonan.findByPk(targetId);
    if (!permohonan) {
      return res.status(404).json({ success: false, message: 'Permohonan not found' });
    }

    const newStatus = status || 'DISETUJUI';
    const nomor_registrasi = permohonan.nomor_registrasi || approval_number || `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await permohonan.update({
      status: newStatus,
      nomor_registrasi,
      updated_at: new Date()
    });

    // Trigger archiving asynchronously; do not fail callback if archive fails
    try {
      await axios.post(`${ARSIP_SERVICE_URL}/api/internal/arsipkan-dokumen`, {
        permohonan_id: permohonan.id,
        nomor_registrasi,
        triggered_from: 'oss-callback',
        metadata: metadata || {}
      }, { timeout: 5000 });
    } catch (archiveErr) {
      console.warn('Archive trigger failed', archiveErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Callback processed',
      data: {
        permohonan_id: permohonan.id,
        status: newStatus,
        nomor_registrasi
      }
    });
  } catch (error) {
    console.error('OSS callback handler error:', error);
    res.status(500).json({ success: false, message: 'Failed to process callback', error: error.message });
  }
});

// 1. Create a new application
router.post('/api/permohonan', validateToken, async (req, res) => {
  try {
    const { data_pemohon } = req.body;
    const user_id = req.user.id; // Get from JWT token

    const newPermohonan = await Permohonan.create({
      user_id,
      status: 'draft', // Initial status
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
    res.status(500).json({ 
      success: false,
      message: 'Failed to create application', 
      error: error.message 
    });
  }
});

// List applications with optional status + limit
router.get('/api/permohonan', validateToken, async (req, res) => {
  try {
    const { status, limit } = req.query;
    const where = {};
    if (status) where.status = status;

    // Non-admin users only see their own records
    if (!['Admin', 'OPD', 'Pimpinan'].includes(req.user.role)) {
      where.user_id = req.user.id;
    }

    const records = await Permohonan.findAll({
      where,
      limit: limit ? parseInt(limit, 10) : 20,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({ success: true, message: 'Permohonan list', data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch permohonan', error: error.message });
  }
});

// 2. Update an existing application
router.put('/api/permohonan/:id', validateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data_pemohon, status } = req.body;

    const permohonan = await Permohonan.findByPk(id);
    if (!permohonan) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user owns this application
    if (permohonan.user_id !== req.user.id && !['Admin', 'OPD'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await permohonan.update({
      data_pemohon: data_pemohon || permohonan.data_pemohon,
      status: status || permohonan.status,
      updated_at: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Permohonan updated successfully',
      data: permohonan
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to update application', 
      error: error.message 
    });
  }
});

// Get application detail
router.get('/api/permohonan/:id', validateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const permohonan = await Permohonan.findByPk(id);
    if (!permohonan) return res.status(404).json({ success: false, message: 'Application not found' });

    if (permohonan.user_id !== req.user.id && !['Admin', 'OPD', 'Pimpinan'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, message: 'Permohonan detail', data: permohonan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch detail', error: error.message });
  }
});

// Submit application (moves draft -> submitted)
router.post('/api/permohonan/:id/submit', validateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const permohonan = await Permohonan.findByPk(id);
    if (!permohonan) return res.status(404).json({ success: false, message: 'Application not found' });
    if (permohonan.user_id !== req.user.id && !['Admin', 'OPD'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await permohonan.update({ status: 'submitted', updated_at: new Date() });
    res.status(200).json({ success: true, message: 'Permohonan submitted', data: permohonan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit permohonan', error: error.message });
  }
});

// Update status (admin-only for approvals)
router.put('/api/permohonan/:id/status', validateToken, requireRole(['Admin', 'OPD', 'Pimpinan']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const permohonan = await Permohonan.findByPk(id);
    if (!permohonan) return res.status(404).json({ success: false, message: 'Application not found' });

    await permohonan.update({ status: status || permohonan.status, updated_at: new Date() });
    res.status(200).json({ success: true, message: 'Permohonan status updated', data: permohonan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
});

// 8. Get application status
router.get('/api/permohonan/:id/status', validateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const permohonan = await Permohonan.findByPk(id, {
      attributes: ['id', 'user_id', 'nomor_registrasi', 'status', 'created_at', 'updated_at'],
    });

    if (!permohonan) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user owns this application or is admin/OPD
    if (permohonan.user_id !== req.user.id && !['Admin', 'OPD', 'Pimpinan'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({
      message: 'Status retrieved successfully',
      data: permohonan
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve application status', 
      error: error.message 
    });
  }
});

// 3. Upload document for an application
router.post('/api/permohonan/:id/dokumen', validateToken, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { jenis_dokumen } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const permohonan = await Permohonan.findByPk(id);
    if (!permohonan) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user owns this application
    if (permohonan.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const dokumen = await Dokumen.create({
      permohonan_id: id,
      jenis_dokumen: jenis_dokumen || 'general',
      nama_file: req.file.originalname,
      path_file: req.file.path,
      ukuran_file: req.file.size,
      status_verifikasi: 'pending'
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      data: dokumen
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to upload document', 
      error: error.message 
    });
  }
});

// 4. Verify document (Admin/OPD only)
router.post('/api/dokumen/:id/verifikasi', validateToken, requireRole(['Admin', 'OPD']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status_verifikasi, catatan_verifikasi } = req.body;

    if (!['verified', 'rejected'].includes(status_verifikasi)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const dokumen = await Dokumen.findByPk(id);
    if (!dokumen) {
      return res.status(404).json({ message: 'Document not found' });
    }

    await dokumen.update({
      status_verifikasi,
      catatan_verifikasi,
      verified_by: req.user.id,
      verified_at: new Date()
    });

    res.status(200).json({
      message: 'Document verified successfully',
      data: dokumen
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to verify document', 
      error: error.message 
    });
  }
});

// 5. Send notification for correction (Admin/OPD only)
router.post('/api/permohonan/:id/notifikasi-perbaikan', validateToken, requireRole(['Admin', 'OPD']), async (req, res) => {
  try {
    const { id } = req.params;
    const { pesan, catatan } = req.body;

    const permohonan = await Permohonan.findByPk(id);
    if (!permohonan) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Update status to need revision
    await permohonan.update({
      status: 'perlu_perbaikan',
      updated_at: new Date()
    });

    // In real app, send email/SMS notification here
    const notifikasi = {
      permohonan_id: id,
      user_id: permohonan.user_id,
      pesan: pesan || 'Permohonan Anda memerlukan perbaikan',
      catatan: catatan,
      dikirim_oleh: req.user.id,
      tanggal_kirim: new Date()
    };

    res.status(200).json({
      message: 'Notification sent successfully',
      data: notifikasi
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to send notification', 
      error: error.message 
    });
  }
});

// 6. Finalize application and create registration number (Admin/OPD only)
router.post('/api/permohonan/:id/registrasi', validateToken, requireRole(['Admin', 'OPD']), async (req, res) => {
  try {
    const { id } = req.params;

    const permohonan = await Permohonan.findByPk(id);
    if (!permohonan) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (permohonan.nomor_registrasi) {
      return res.status(400).json({ message: 'Application already registered' });
    }

    // Generate registration number
    const tahun = new Date().getFullYear();
    const bulan = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const nomor_registrasi = `REG/${tahun}/${bulan}/${random}`;

    await permohonan.update({
      nomor_registrasi,
      status: 'terdaftar',
      updated_at: new Date()
    });

    res.status(200).json({
      message: 'Application registered successfully',
      data: {
        id: permohonan.id,
        nomor_registrasi: permohonan.nomor_registrasi,
        status: permohonan.status
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to register application', 
      error: error.message 
    });
  }
});

// 7. Generate receipt PDF (tanda terima)
router.get('/api/permohonan/:id/tanda-terima', validateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const permohonan = await Permohonan.findByPk(id);
    if (!permohonan) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user owns this application
    if (permohonan.user_id !== req.user.id && !['Admin', 'OPD'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!permohonan.nomor_registrasi) {
      return res.status(400).json({ message: 'Application not yet registered' });
    }

    // Create PDF
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=tanda-terima-${permohonan.nomor_registrasi}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('TANDA TERIMA PERMOHONAN', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Nomor Registrasi: ${permohonan.nomor_registrasi}`);
    doc.text(`Tanggal: ${new Date(permohonan.created_at).toLocaleDateString('id-ID')}`);
    doc.text(`Status: ${permohonan.status}`);
    doc.moveDown();
    doc.text('Data Pemohon:', { underline: true });
    doc.fontSize(10).text(JSON.stringify(permohonan.data_pemohon, null, 2));
    doc.moveDown();
    doc.fontSize(8).text('Dokumen ini dibuat secara otomatis oleh sistem', { align: 'center' });

    // Finalize PDF
    doc.end();
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to generate receipt', 
      error: error.message 
    });
  }
});

// 9. Internal endpoint to trigger workflow service
router.post('/api/internal/trigger-workflow', async (req, res) => {
  try {
    const { permohonan_id } = req.body;

    const permohonan = await Permohonan.findByPk(permohonan_id);
    if (!permohonan) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Call workflow service
    const workflowServiceUrl = process.env.WORKFLOW_SERVICE_URL || 'http://localhost:3020';
    
    try {
      const response = await axios.post(`${workflowServiceUrl}/api/workflow/initiate`, {
        permohonan_id: permohonan.id,
        nomor_registrasi: permohonan.nomor_registrasi,
        user_id: permohonan.user_id,
        data_pemohon: permohonan.data_pemohon
      });

      res.status(200).json({
        message: 'Workflow triggered successfully',
        workflow_data: response.data
      });
    } catch (workflowError) {
      res.status(500).json({
        message: 'Failed to trigger workflow service',
        error: workflowError.message
      });
    }
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to process workflow trigger', 
      error: error.message 
    });
  }
});

module.exports = router;