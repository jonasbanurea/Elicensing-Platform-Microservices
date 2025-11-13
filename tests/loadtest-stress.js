// Load Test Stress - Jelita Microservices
// Tujuan: Mengukur performa di bawah tekanan tinggi (200+ VUs)
// Kriteria: p95 < 2000ms, error rate < 5%

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const archiveDuration = new Trend('archive_duration');
const totalRequests = new Counter('total_requests');

// Stress test configuration
export let options = {
  stages: [
    { duration: '1m', target: 50 },    // Ramp to 50 VUs
    { duration: '2m', target: 100 },   // Ramp to 100 VUs
    { duration: '2m', target: 200 },   // Stress: 200 VUs
    { duration: '1m', target: 300 },   // Peak stress: 300 VUs
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95) < 2000'],       // 95% < 2s (relaxed for stress)
    'http_req_failed': ['rate < 0.05'],          // Error < 5%
    'errors': ['rate < 0.05'],
    'login_duration': ['p(95) < 1000'],          // Login < 1s
    'archive_duration': ['p(95) < 1500'],        // Archive ops < 1.5s
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

// Test data pool
const users = [
  { username: 'demo', password: 'demo123' },
  { username: 'opd_demo', password: 'demo123' },
  { username: 'pimpinan_demo', password: 'demo123' },
];

export default function() {
  totalRequests.add(1);
  
  // Select random user for distribution
  const user = users[Math.floor(Math.random() * users.length)];
  
  // 1. Login (timed)
  const loginStart = Date.now();
  let loginRes = http.post(
    `${BASE_URL.auth}/api/auth/signin`,
    JSON.stringify({ username: user.username, password: user.password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  loginDuration.add(Date.now() - loginStart);
  
  const loginSuccess = check(loginRes, {
    'login success': (r) => r.status === 200,
    'has token': (r) => r.json('accessToken') !== undefined,
  });
  
  if (!loginSuccess) {
    errorRate.add(1);
    sleep(0.5);
    return;
  }
  
  const token = loginRes.json('accessToken');
  const authHeader = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  // 2. Archive operations (timed)
  const archiveStart = Date.now();
  
  // Trigger archive creation (internal)
  const triggerPayload = {
    permohonan_id: Math.floor(Math.random() * 10000) + 1,
    nomor_registrasi: `STRESS-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    user_id: 4,
    triggered_from: 'stress-test'
  };
  
  let triggerRes = http.post(
    `${BASE_URL.archive}/api/internal/arsipkan-dokumen`,
    JSON.stringify(triggerPayload),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(triggerRes, {
    'trigger ok': (r) => r.status === 200 || r.status === 201,
  });
  
  const arsipId = triggerRes.json('arsip.id') || 1;
  
  // Get archive by ID
  let getRes = http.get(`${BASE_URL.archive}/api/arsip/${arsipId}`, authHeader);
  check(getRes, {
    'get archive ok': (r) => r.status === 200 || r.status === 404,
  });
  
  archiveDuration.add(Date.now() - archiveStart);
  
  // 3. Batch health checks (every 10% of iterations)
  if (Math.random() < 0.1) {
    http.batch([
      ['GET', `${BASE_URL.auth}/health`],
      ['GET', `${BASE_URL.archive}/health`],
    ]);
  }
  
  // Variable think time (realistic user behavior)
  sleep(Math.random() * 2 + 0.5);  // 0.5-2.5s
}

// Summary with detailed metrics
export function handleSummary(data) {
  const summary = {
    duration: data.state.testRunDurationMs / 1000,
    total_requests: data.metrics.http_reqs.values.count,
    request_rate: data.metrics.http_reqs.values.rate,
    avg_duration: data.metrics.http_req_duration.values.avg,
    p95_duration: data.metrics.http_req_duration.values['p(95)'],
    p99_duration: data.metrics.http_req_duration.values['p(99)'],
    error_rate: data.metrics.http_req_failed.values.rate * 100,
    login_p95: data.metrics.login_duration.values['p(95)'],
    archive_p95: data.metrics.archive_duration.values['p(95)'],
  };
  
  console.log('\n' + '='.repeat(70));
  console.log('STRESS TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`Test Duration:        ${summary.duration.toFixed(0)}s`);
  console.log(`Total Requests:       ${summary.total_requests}`);
  console.log(`Request Rate:         ${summary.request_rate.toFixed(2)} req/s`);
  console.log(`Avg Response Time:    ${summary.avg_duration.toFixed(2)}ms`);
  console.log(`P95 Response Time:    ${summary.p95_duration.toFixed(2)}ms`);
  console.log(`P99 Response Time:    ${summary.p99_duration.toFixed(2)}ms`);
  console.log(`Error Rate:           ${summary.error_rate.toFixed(2)}%`);
  console.log(`Login P95:            ${summary.login_p95.toFixed(2)}ms`);
  console.log(`Archive P95:          ${summary.archive_p95.toFixed(2)}ms`);
  console.log('='.repeat(70) + '\n');
  
  return {
    'stdout': '',
    'reports/stress-summary.json': JSON.stringify(summary, null, 2),
    'reports/stress-full.json': JSON.stringify(data),
  };
}
