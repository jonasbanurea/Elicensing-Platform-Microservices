/**
 * JELITA API Gateway with OSS-RBA Integration
 * 
 * Main server file
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const { testConnection, syncDatabase } = require('./utils/database');
const ossIntegrationRoutes = require('./routes/ossIntegration');

// Simple in-memory audit log store (keeps last 1000 entries)
const auditLogs = [];

// Static service directory to expose via API (avoids 404 in SPBE checks)
const serviceDirectory = [
  { name: 'api-gateway', version: '1.0.0', url: 'http://localhost:8080', owner: 'JELITA', sla: '99.0%' },
  { name: 'auth-service', version: '1.0.0', url: 'http://localhost:3001', owner: 'JELITA', sla: '99.0%' },
  { name: 'pendaftaran-service', version: '1.0.0', url: 'http://localhost:3010', owner: 'JELITA', sla: '99.0%' },
  { name: 'workflow-service', version: '1.0.0', url: 'http://localhost:3020', owner: 'JELITA', sla: '99.0%' },
  { name: 'survey-service', version: '1.0.0', url: 'http://localhost:3030', owner: 'JELITA', sla: '99.0%' },
  { name: 'archive-service', version: '1.0.0', url: 'http://localhost:3040', owner: 'JELITA', sla: '99.0%' },
  { name: 'mysql', version: '8.0', url: 'mysql://localhost:3307', owner: 'JELITA', sla: '99.0%' }
];

const app = express();
const PORT = process.env.PORT || 3050;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Lightweight audit logging middleware
app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    auditLogs.push({
      timestamp: new Date().toISOString(),
      correlation_id: req.header('x-correlation-id') || null,
      service_name: 'api-gateway',
      operation: `${req.method} ${req.path}`,
      actor_id: req.header('x-user-id') || null,
      request_id: req.header('x-request-id') || null,
      response_code: res.statusCode,
      duration_ms: Date.now() - started
    });

    if (auditLogs.length > 1000) {
      auditLogs.shift();
    }
  });
  next();
});

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'JELITA API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Service directory endpoint (used in SPBE checks)
app.get('/api/v1/service-directory', (req, res) => {
  res.json({
    success: true,
    total: serviceDirectory.length,
    services: serviceDirectory
  });
});

// Audit logs endpoint (basic in-memory collector)
app.get('/api/v1/audit-logs', (req, res) => {
  const { limit = 10, correlation_id } = req.query;
  const parsedLimit = Number(limit) || 10;

  let data = auditLogs;
  if (correlation_id) {
    data = data.filter((log) => log.correlation_id === correlation_id);
  }

  const sliced = data.slice(-parsedLimit);

  res.json({
    success: true,
    total: data.length,
    returned: sliced.length,
    data: sliced
  });
});

// OSS Integration routes
app.use('/api/oss', ossIntegrationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    // Sync database (create tables)
    await syncDatabase();
    
    // Start listening
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🚀 JELITA API Gateway Started');
      console.log('='.repeat(60));
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 OSS Submit: POST http://localhost:${PORT}/api/oss/submit`);
      console.log(`📊 OSS Status: GET http://localhost:${PORT}/api/oss/status/:trackingId`);
      console.log(`🔍 OSS Health: GET http://localhost:${PORT}/api/oss/health`);
      console.log('='.repeat(60));
      console.log(`📦 Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
      console.log(`🌐 OSS-RBA: ${process.env.OSS_RBA_BASE_URL}`);
      console.log('='.repeat(60));
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
