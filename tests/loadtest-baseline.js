// Load Test Baseline - Jelita Microservices
// Tujuan: Mengukur performa baseline dengan load ringan (10 VUs)
// Kriteria: p95 < 500ms, error rate < 1%

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export let options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 VUs
    { duration: '1m', target: 10 },    // Stay at 10 VUs
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95) < 500'],       // 95% requests < 500ms
    'http_req_failed': ['rate < 0.01'],          // Error rate < 1%
    'errors': ['rate < 0.01'],                   // Custom error rate < 1%
  }
};

// Base URLs
const BASE_URL = {
  auth: 'http://localhost:3001',
  pendaftaran: 'http://localhost:3010',
  workflow: 'http://localhost:3020',
  survey: 'http://localhost:3030',
  archive: 'http://localhost:3040'
};

// Test users
const users = [
  { username: 'demo', password: 'demo123', role: 'Admin' },
  { username: 'opd_demo', password: 'demo123', role: 'OPD' },
];

export default function() {
  // Select random user
  const user = users[Math.floor(Math.random() * users.length)];
  
  // 1. Health checks (warmup)
  let healthChecks = http.batch([
    ['GET', `${BASE_URL.auth}/health`],
    ['GET', `${BASE_URL.pendaftaran}/health`],
    ['GET', `${BASE_URL.workflow}/health`],
    ['GET', `${BASE_URL.survey}/health`],
    ['GET', `${BASE_URL.archive}/health`],
  ]);
  
  healthChecks.forEach(res => {
    check(res, { 'health check ok': (r) => r.status === 200 });
  });
  
  // 2. Login
  let loginRes = http.post(
    `${BASE_URL.auth}/api/auth/signin`,
    JSON.stringify({ username: user.username, password: user.password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const loginSuccess = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'has token': (r) => r.json('accessToken') !== undefined,
  });
  
  if (!loginSuccess) {
    errorRate.add(1);
    sleep(1);
    return;
  }
  
  const token = loginRes.json('accessToken');
  const authHeader = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  // 3. Test Archive Service endpoints
  // Get archive by ID (simulate read operation)
  let archiveRes = http.get(`${BASE_URL.archive}/api/arsip/1`, authHeader);
  check(archiveRes, {
    'archive get ok': (r) => r.status === 200 || r.status === 404, // 404 acceptable if no data
  });
  
  // 4. Simulate workflow trigger (internal endpoint, no auth)
  const triggerPayload = {
    permohonan_id: Math.floor(Math.random() * 1000) + 1,
    nomor_registrasi: `REG-LOAD-${Date.now()}`,
    user_id: 4,
    triggered_from: 'loadtest'
  };
  
  let triggerRes = http.post(
    `${BASE_URL.archive}/api/internal/arsipkan-dokumen`,
    JSON.stringify(triggerPayload),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(triggerRes, {
    'trigger archive ok': (r) => r.status === 200 || r.status === 201,
  });
  
  // Think time (simulate user delay)
  sleep(1);
}

// Summary handler
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'reports/baseline-summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n';
  summary += indent + '='.repeat(60) + '\n';
  summary += indent + 'BASELINE LOAD TEST SUMMARY\n';
  summary += indent + '='.repeat(60) + '\n';
  summary += indent + `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += indent + `Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s\n`;
  summary += indent + `Request Duration (avg): ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += indent + `Request Duration (p95): ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += indent + `Request Duration (p99): ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += indent + `Failed Requests: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  summary += indent + '='.repeat(60) + '\n';
  
  return summary;
}
