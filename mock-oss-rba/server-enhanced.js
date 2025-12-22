/**
 * Mock OSS-RBA (One Single Submission - Risk Based Approach) Service
 * Enhanced for Microservices Interoperability Testing
 * 
 * Purpose: Simulates the national SPBE platform for integration testing
 * This mock service implements the core OSS-RBA API endpoints required
 * for JELITA system integration validation with complete contract support.
 * 
 * Features:
 * - Full OpenAPI 3.0 contract compliance
 * - Webhook callbacks for status updates
 * - Idempotency key support
 * - Configurable failure scenarios for resilience testing
 * - Audit logging
 * 
 * Note: This is a MOCK service for testing purposes only.
 * Real OSS-RBA integration would require government API credentials.
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4000;
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:8080/api/webhooks/oss/status-update';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  if (req.headers['x-correlation-id']) {
    console.log(`  Correlation-ID: ${req.headers['x-correlation-id']}`);
  }
  if (req.headers['idempotency-key']) {
    console.log(`  Idempotency-Key: ${req.headers['idempotency-key']}`);
  }
  next();
});

// In-memory storage (simulate database)
const applications = new Map(); // OSS applications
const idempotencyCache = new Map(); // Idempotency key tracking
const auditLogs = []; // Audit trail

// Configuration for testing scenarios
let config = {
  simulateFailure: false,
  failureCount: 0,
  currentFailures: 0,
  callbackDelay: 5, // seconds
  callbackEnabled: true,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateOSSReferenceId() {
  const year = new Date().getFullYear();
  const sequence = Math.floor(Math.random() * 99999) + 1;
  return `OSS-${year}${sequence.toString().padStart(5, '0')}`;
}

function generateApprovalNumber() {
  const year = new Date().getFullYear();
  const sequence = Math.floor(Math.random() * 99999) + 1;
  return `IZIN-OSS-${year}${sequence.toString().padStart(5, '0')}`;
}

function simulateDelay() {
  return new Promise(resolve => {
    const delay = Math.floor(Math.random() * 200) + 100; // 100-300ms
    setTimeout(resolve, delay);
  });
}

function logAudit(operation, data, status) {
  const log = {
    timestamp: new Date().toISOString(),
    operation,
    data,
    status,
  };
  auditLogs.push(log);
  console.log(`[AUDIT] ${operation} - ${status}`);
}

/**
 * Send webhook callback to JELITA API Gateway
 */
async function sendCallback(applicationData, delay = config.callbackDelay) {
  if (!config.callbackEnabled) {
    console.log('📴 Callbacks disabled');
    return;
  }

  setTimeout(async () => {
    try {
      const callbackPayload = {
        reference_id: applicationData.oss_reference_id,
        status: applicationData.status,
        updated_at: new Date().toISOString(),
        approval_number: applicationData.approval_number,
        metadata: {
          callback_from: 'OSS-RBA Mock',
          original_correlation_id: applicationData.correlation_id,
        }
      };

      console.log(`🔔 Sending callback for ${applicationData.oss_reference_id}...`);

      const response = await axios.post(CALLBACK_URL, callbackPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': applicationData.correlation_id,
        },
        timeout: 5000,
      });

      console.log(`✅ Callback successful: ${response.status}`);
      logAudit('CALLBACK_SENT', callbackPayload, 'success');

    } catch (error) {
      console.error(`❌ Callback failed: ${error.message}`);
      logAudit('CALLBACK_FAILED', { reference_id: applicationData.oss_reference_id }, error.message);
    }
  }, delay * 1000);
}

// ============================================================================
// API ENDPOINTS - OSS-RBA Contract
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Mock OSS-RBA',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    stats: {
      applications: applications.size,
      idempotency_cache: idempotencyCache.size,
      audit_logs: auditLogs.length,
    }
  });
});

/**
 * POST /oss/api/v1/applications
 * 
 * Submit new application (OpenAPI contract compliant)
 * 
 * Headers:
 * - Idempotency-Key: optional, for duplicate prevention
 * - X-Correlation-ID: optional, for tracing
 * 
 * Request body:
 * {
 *   "license_type": "UMKU|PBST|PERDAGANGAN|INDUSTRI",
 *   "applicant": {
 *     "name": "string",
 *     "id_number": "string (16 digits)",
 *     "email": "string",
 *     "phone": "string"
 *   },
 *   "business": {
 *     "field": "string",
 *     "scale": "MIKRO|KECIL|MENENGAH|BESAR",
 *     "address": "string"
 *   },
 *   "submitted_at": "ISO 8601 timestamp"
 * }
 * 
 * Response 201:
 * {
 *   "oss_reference_id": "OSS-2025XXXXX",
 *   "status": "PENDING",
 *   "created_at": "ISO timestamp"
 * }
 */
app.post('/oss/api/v1/applications', async (req, res) => {
  // Check for configured failure simulation
  if (config.simulateFailure && config.currentFailures < config.failureCount) {
    config.currentFailures++;
    console.warn(`⚠️  Simulating failure (${config.currentFailures}/${config.failureCount})`);
    return res.status(503).json({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable (simulated)',
      }
    });
  }

  // Reset failure counter if threshold reached
  if (config.currentFailures >= config.failureCount) {
    config.simulateFailure = false;
    config.currentFailures = 0;
  }

  await simulateDelay();

  try {
    const idempotencyKey = req.headers['idempotency-key'];
    const correlationId = req.headers['x-correlation-id'] || generateUUID();

    // Check idempotency
    if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
      const cached = idempotencyCache.get(idempotencyKey);
      console.log(`🔁 Idempotent request detected: ${idempotencyKey}`);
      return res.status(200).json(cached.response);
    }

    const { license_type, applicant, business, submitted_at } = req.body;

    // Validation
    if (!license_type || !applicant || !applicant.name || !applicant.id_number) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: {
            required: ['license_type', 'applicant.name', 'applicant.id_number']
          }
        }
      });
    }

    // Validate NIK format
    if (!/^\d{16}$/.test(applicant.id_number)) {
      return res.status(422).json({
        error: {
          code: 'OSS_VALIDATION_ERROR',
          message: "Field 'id_number' must be 16 digits",
        }
      });
    }

    // Create application
    const oss_reference_id = generateOSSReferenceId();
    const approval_number = generateApprovalNumber();

    // Simulate approval (90% approved, 10% pending review)
    const isApproved = Math.random() > 0.1;

    const application = {
      oss_reference_id,
      license_type,
      applicant,
      business,
      submitted_at: submitted_at || new Date().toISOString(),
      status: isApproved ? 'DISETUJUI' : 'SEDANG_DIPROSES',
      approval_number: isApproved ? approval_number : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      correlation_id: correlationId,
    };

    applications.set(oss_reference_id, application);

    const response = {
      oss_reference_id,
      status: 'PENDING',
      created_at: application.created_at,
    };

    // Cache for idempotency (TTL: 24 hours)
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, {
        response,
        timestamp: Date.now(),
      });

      // Clean up old cache entries (> 24 hours)
      setTimeout(() => {
        idempotencyCache.delete(idempotencyKey);
      }, 24 * 60 * 60 * 1000);
    }

    logAudit('APPLICATION_SUBMITTED', { oss_reference_id, license_type }, 'success');

    console.log(`✅ Application created: ${oss_reference_id} (${license_type})`);

    // Schedule callback
    if (isApproved) {
      sendCallback(application);
    }

    res.status(201).json(response);

  } catch (error) {
    console.error('❌ Error creating application:', error);
    logAudit('APPLICATION_SUBMIT_FAILED', { error: error.message }, 'error');
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      }
    });
  }
});

/**
 * GET /oss/api/v1/applications
 * 
 * List all applications (for testing)
 */
app.get('/oss/api/v1/applications', async (req, res) => {
  await simulateDelay();

  const appList = Array.from(applications.values()).map(app => ({
    oss_reference_id: app.oss_reference_id,
    license_type: app.license_type,
    applicant: app.applicant,
    status: app.status,
    approval_number: app.approval_number,
    submitted_at: app.submitted_at,
    created_at: app.created_at,
  }));

  res.json(appList);
});

/**
 * GET /oss/api/v1/applications/:reference_id
 * 
 * Get application status by reference_id
 */
app.get('/oss/api/v1/applications/:reference_id', async (req, res) => {
  await simulateDelay();

  const { reference_id } = req.params;

  const application = applications.get(reference_id);

  if (!application) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Application with reference_id '${reference_id}' not found`,
      }
    });
  }

  res.json({
    oss_reference_id: application.oss_reference_id,
    license_type: application.license_type,
    status: application.status,
    approval_number: application.approval_number,
    submitted_at: application.submitted_at,
    updated_at: application.updated_at,
  });
});

/**
 * PATCH /oss/api/v1/applications/:reference_id/status
 * 
 * Update application status (admin endpoint for testing)
 */
app.patch('/oss/api/v1/applications/:reference_id/status', async (req, res) => {
  await simulateDelay();

  const { reference_id } = req.params;
  const { status } = req.body;

  const application = applications.get(reference_id);

  if (!application) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Application with reference_id '${reference_id}' not found`,
      }
    });
  }

  application.status = status;
  application.updated_at = new Date().toISOString();

  if (status === 'DISETUJUI' && !application.approval_number) {
    application.approval_number = generateApprovalNumber();
  }

  logAudit('STATUS_UPDATED', { reference_id, status }, 'success');

  // Send callback
  sendCallback(application, 1); // Immediate callback (1 second delay)

  res.json({
    oss_reference_id: application.oss_reference_id,
    status: application.status,
    approval_number: application.approval_number,
    updated_at: application.updated_at,
  });
});

/**
 * DELETE /oss/api/v1/applications/:reference_id
 * 
 * Cancel application
 */
app.delete('/oss/api/v1/applications/:reference_id', async (req, res) => {
  await simulateDelay();

  const { reference_id } = req.params;

  const application = applications.get(reference_id);

  if (!application) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Application with reference_id '${reference_id}' not found`,
      }
    });
  }

  applications.delete(reference_id);

  logAudit('APPLICATION_CANCELLED', { reference_id }, 'success');

  res.status(204).send();
});

// ============================================================================
// ADMIN/TESTING ENDPOINTS
// ============================================================================

/**
 * POST /admin/simulate-failure
 * 
 * Configure failure simulation for resilience testing
 * 
 * Body:
 * {
 *   "failureCount": 2,
 *   "recoveryAfter": 3
 * }
 */
app.post('/admin/simulate-failure', (req, res) => {
  const { failureCount, recoveryAfter } = req.body;

  config.simulateFailure = true;
  config.failureCount = failureCount || 3;
  config.currentFailures = 0;

  console.log(`⚠️  Failure simulation enabled: ${config.failureCount} failures`);

  res.json({
    status: 'success',
    message: 'Failure simulation configured',
    config: {
      failureCount: config.failureCount,
      enabled: config.simulateFailure,
    }
  });
});

/**
 * POST /admin/configure-callback-delay
 * 
 * Configure callback delay
 * 
 * Body:
 * {
 *   "delaySeconds": 30
 * }
 */
app.post('/admin/configure-callback-delay', (req, res) => {
  const { delaySeconds } = req.body;

  config.callbackDelay = delaySeconds || 5;

  console.log(`⏱️  Callback delay set to: ${config.callbackDelay}s`);

  res.json({
    status: 'success',
    message: 'Callback delay configured',
    delaySeconds: config.callbackDelay,
  });
});

/**
 * POST /admin/toggle-callbacks
 * 
 * Enable/disable callbacks
 */
app.post('/admin/toggle-callbacks', (req, res) => {
  config.callbackEnabled = !config.callbackEnabled;

  console.log(`🔔 Callbacks ${config.callbackEnabled ? 'enabled' : 'disabled'}`);

  res.json({
    status: 'success',
    callbackEnabled: config.callbackEnabled,
  });
});

/**
 * GET /admin/audit-logs
 * 
 * Get audit logs
 */
app.get('/admin/audit-logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const logs = auditLogs.slice(-limit);

  res.json({
    total: auditLogs.length,
    limit,
    logs,
  });
});

/**
 * DELETE /admin/reset
 * 
 * Reset all data (for testing)
 */
app.delete('/admin/reset', (req, res) => {
  applications.clear();
  idempotencyCache.clear();
  auditLogs.length = 0;
  config.simulateFailure = false;
  config.currentFailures = 0;

  console.log('🗑️  All data cleared');

  res.json({
    status: 'success',
    message: 'All data cleared',
  });
});

/**
 * POST /admin/trigger-callback/:reference_id
 * 
 * Manually trigger callback for testing
 */
app.post('/admin/trigger-callback/:reference_id', async (req, res) => {
  const { reference_id } = req.params;

  const application = applications.get(reference_id);

  if (!application) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Application with reference_id '${reference_id}' not found`,
      }
    });
  }

  // Send callback immediately
  await sendCallback(application, 0);

  res.json({
    status: 'success',
    message: 'Callback triggered',
    reference_id,
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      path: req.path,
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    }
  });
});

// ============================================================================
// SERVER START
// ============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('🚀 Mock OSS-RBA Service Started');
  console.log('========================================');
  console.log(`📍 Base URL: http://localhost:${PORT}`);
  console.log(`🔔 Callback URL: ${CALLBACK_URL}`);
  console.log('');
  console.log('📚 API Endpoints:');
  console.log('  POST   /oss/api/v1/applications');
  console.log('  GET    /oss/api/v1/applications');
  console.log('  GET    /oss/api/v1/applications/:id');
  console.log('  PATCH  /oss/api/v1/applications/:id/status');
  console.log('  DELETE /oss/api/v1/applications/:id');
  console.log('');
  console.log('🔧 Admin Endpoints:');
  console.log('  POST   /admin/simulate-failure');
  console.log('  POST   /admin/configure-callback-delay');
  console.log('  POST   /admin/toggle-callbacks');
  console.log('  POST   /admin/trigger-callback/:id');
  console.log('  GET    /admin/audit-logs');
  console.log('  DELETE /admin/reset');
  console.log('');
  console.log('🏥 Health Check:');
  console.log('  GET    /health');
  console.log('========================================');
  console.log('');
});

// Cleanup old idempotency cache periodically (every hour)
setInterval(() => {
  const now = Date.now();
  const TTL = 24 * 60 * 60 * 1000; // 24 hours

  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > TTL) {
      idempotencyCache.delete(key);
    }
  }

  console.log(`🧹 Idempotency cache cleaned. Size: ${idempotencyCache.size}`);
}, 60 * 60 * 1000);

module.exports = app;
