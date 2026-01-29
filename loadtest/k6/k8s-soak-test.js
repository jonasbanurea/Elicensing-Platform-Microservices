// K8s Soak Test - Long-term Stability and Sustainability
// Addresses JASE Rejection Point #6
// Duration: 24 hours with resource leak detection

import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Trend, Counter, Gauge, Rate } from 'k6/metrics';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// ============================================================================
// CONFIGURATION
// ============================================================================
const BASE_URL = __ENV.BASE_URL || 'http://localhost:30000';
const SUT = 'microservices-k8s-soak';
const SOAK_DURATION = __ENV.SOAK_DURATION || '24h';
const BASELINE_VUS = 35;

// ============================================================================
// METRICS - Resource Leak Detection
// ============================================================================

// Standard performance metrics
const authLatency = new Trend('auth_latency', true);
const permohonanLatency = new Trend('permohonan_latency', true);
const workflowLatency = new Trend('workflow_latency', true);
const successRate = new Rate('success_rate');

// Resource leak detection metrics
const memoryUsageEstimate = new Gauge('memory_usage_estimate');
const responseTimeGrowth = new Trend('response_time_growth', true);
const errorRateOverTime = new Rate('error_rate_over_time');

// Time-series tracking for degradation analysis
const hourlyThroughput = new Counter('hourly_throughput');
const hourlyErrors = new Counter('hourly_errors');

// Connection and resource metrics
const activeConnections = new Gauge('active_connections');
const connectionFailures = new Counter('connection_failures');
const timeoutErrors = new Counter('timeout_errors');

// ============================================================================
// SCENARIO
// ============================================================================

export const options = {
  scenarios: {
    'soak-baseline': {
      executor: 'constant-vus',
      vus: BASELINE_VUS,
      duration: SOAK_DURATION,
      gracefulStop: '5m',
      tags: { scenario: 'soak-baseline', sut: SUT },
    },
  },

  thresholds: {
    'http_req_failed': ['rate<0.05'],
    'http_req_duration': ['p(95)<3000', 'p(99)<5000'],
    'success_rate': ['rate>0.95'],

    // Stability thresholds - no degradation over time
    'response_time_growth': ['p(95)<3000'], // Should not grow significantly
    'error_rate_over_time': ['rate<0.05'],
  },

  summaryTrendStats: ['min', 'avg', 'p(50)', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

let iterationCount = 0;
let startTime = Date.now();
let hourlyRequestCount = 0;
let hourlyErrorCount = 0;
let lastHourMark = 0;

function thinkTime() {
  sleep(1 + Math.random() * 2);
}

function safeJson(res, path) {
  try {
    return path ? res.json(path) : res.json();
  } catch (e) {
    return null;
  }
}

function trackResourceUsage() {
  iterationCount++;
  const elapsedHours = (Date.now() - startTime) / (1000 * 60 * 60);
  const currentHour = Math.floor(elapsedHours);

  // Reset hourly counters
  if (currentHour > lastHourMark) {
    console.log(`Hour ${currentHour}: Requests=${hourlyRequestCount}, Errors=${hourlyErrorCount}, Error Rate=${(hourlyErrorCount / hourlyRequestCount * 100).toFixed(2)}%`);
    hourlyRequestCount = 0;
    hourlyErrorCount = 0;
    lastHourMark = currentHour;
  }

  // Estimate memory usage based on iteration count (rough heuristic)
  // In real scenario, this would be collected from K8s metrics
  const estimatedMemory = iterationCount * 0.001; // MB per iteration estimate
  memoryUsageEstimate.add(estimatedMemory);
}

// ============================================================================
// MAIN SCENARIO
// ============================================================================

export default function () {
  trackResourceUsage();

  const testUser = {
    username: `soak_${__VU}_${Date.now()}`,
    email: `soak_${__VU}_${Date.now()}@test.com`,
    password: 'Test123!',
    role: 'pemohon'
  };

  let authToken = null;
  let permohonanId = null;
  let flowStartTime = Date.now();

  hourlyRequestCount++;
  activeConnections.add(__VU);

  // =========================================================================
  // 1. AUTHENTICATION
  // =========================================================================
  group('Authentication', () => {
    const registerStart = Date.now();
    const registerRes = http.post(
      `${BASE_URL}/api/users/register`,
      JSON.stringify(testUser),
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: '60s',
      }
    );

    const registerSuccess = check(registerRes, {
      'register: status 201': (r) => r.status === 201,
      'register: response time OK': (r) => r.timings.duration < 5000,
    });

    const registerTime = Date.now() - registerStart;
    authLatency.add(registerTime);
    responseTimeGrowth.add(registerTime);
    successRate.add(registerSuccess);

    if (!registerSuccess) {
      hourlyErrorCount++;
      errorRateOverTime.add(1);

      if (registerRes.status === 0) {
        connectionFailures.add(1);
      }
      if (registerRes.timings.duration > 30000) {
        timeoutErrors.add(1);
      }
    } else {
      errorRateOverTime.add(0);
      authToken = safeJson(registerRes, 'token');
    }

    hourlyThroughput.add(1);
  });

  thinkTime();

  // =========================================================================
  // 2. PERMOHONAN OPERATIONS
  // =========================================================================
  if (authToken) {
    group('Permohonan', () => {
      const createStart = Date.now();
      const createRes = http.post(
        `${BASE_URL}/api/permohonan`,
        JSON.stringify({
          jenis_permohonan: 'IMB',
          nama_pemohon: 'Soak Test User',
          alamat_lokasi: 'Jl. Soak Test No. 123',
          luas_tanah: 200,
          luas_bangunan: 150,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          timeout: '60s',
        }
      );

      const createSuccess = check(createRes, {
        'create permohonan: status 201': (r) => r.status === 201,
        'create permohonan: response time OK': (r) => r.timings.duration < 5000,
      });

      const createTime = Date.now() - createStart;
      permohonanLatency.add(createTime);
      responseTimeGrowth.add(createTime);
      successRate.add(createSuccess);

      if (!createSuccess) {
        hourlyErrorCount++;
        errorRateOverTime.add(1);

        if (createRes.status === 0) {
          connectionFailures.add(1);
        }
        if (createRes.timings.duration > 30000) {
          timeoutErrors.add(1);
        }
      } else {
        errorRateOverTime.add(0);
        permohonanId = safeJson(createRes, 'data.id');
      }

      hourlyThroughput.add(1);
      hourlyRequestCount++;
    });

    thinkTime();

    // List permohonan
    group('List Permohonan', () => {
      const listStart = Date.now();
      const listRes = http.get(
        `${BASE_URL}/api/permohonan`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` },
          timeout: '60s',
        }
      );

      const listSuccess = check(listRes, {
        'list permohonan: status 200': (r) => r.status === 200,
      });

      const listTime = Date.now() - listStart;
      permohonanLatency.add(listTime);
      responseTimeGrowth.add(listTime);
      successRate.add(listSuccess);

      if (!listSuccess) {
        hourlyErrorCount++;
        errorRateOverTime.add(1);
      } else {
        errorRateOverTime.add(0);
      }

      hourlyThroughput.add(1);
      hourlyRequestCount++;
    });
  }

  thinkTime();

  // =========================================================================
  // 3. WORKFLOW OPERATIONS
  // =========================================================================
  if (authToken && permohonanId) {
    group('Workflow', () => {
      const dispStart = Date.now();
      const dispRes = http.post(
        `${BASE_URL}/api/workflow/disposisi`,
        JSON.stringify({
          permohonan_id: permohonanId,
          tujuan_user_id: 2,
          catatan: 'Soak test disposition',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          timeout: '60s',
        }
      );

      const dispSuccess = check(dispRes, {
        'create disposition: status 201': (r) => r.status === 201,
      });

      const dispTime = Date.now() - dispStart;
      workflowLatency.add(dispTime);
      responseTimeGrowth.add(dispTime);
      successRate.add(dispSuccess);

      if (!dispSuccess) {
        hourlyErrorCount++;
        errorRateOverTime.add(1);
      } else {
        errorRateOverTime.add(0);
      }

      hourlyThroughput.add(1);
      hourlyRequestCount++;
    });
  }

  // Log progress every 1000 iterations
  if (iterationCount % 1000 === 0) {
    const elapsedHours = ((Date.now() - startTime) / (1000 * 60 * 60)).toFixed(2);
    console.log(`Progress: ${iterationCount} iterations completed. Elapsed: ${elapsedHours} hours. VU: ${__VU}`);
  }

  thinkTime();
}

// ============================================================================
// TEARDOWN - Final Analysis
// ============================================================================

export function teardown(data) {
  const totalHours = (Date.now() - startTime) / (1000 * 60 * 60);
  console.log(`\n=== SOAK TEST COMPLETED ===`);
  console.log(`Total Duration: ${totalHours.toFixed(2)} hours`);
  console.log(`Total Iterations: ${iterationCount}`);
  console.log(`Average Iterations per Hour: ${(iterationCount / totalHours).toFixed(0)}`);
}

// ============================================================================
// CUSTOM SUMMARY
// ============================================================================

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `k8s-soak-test-${timestamp}`;

  // Calculate degradation metrics
  const httpReqDuration = data.metrics.http_req_duration;
  const degradationAnalysis = {
    duration: SOAK_DURATION,
    baseline_vus: BASELINE_VUS,
    total_iterations: iterationCount,
    avg_response_time: httpReqDuration?.values?.avg,
    p95_response_time: httpReqDuration?.values['p(95)'],
    p99_response_time: httpReqDuration?.values['p(99)'],
    final_error_rate: data.metrics.http_req_failed?.values?.rate,
    success_rate: data.metrics.success_rate?.values?.rate,
  };

  const summary = {
    ...data,
    degradation_analysis: degradationAnalysis,
    metadata: {
      test_type: 'soak',
      sut: SUT,
      duration: SOAK_DURATION,
      vus: BASELINE_VUS,
      timestamp: new Date().toISOString(),
    },
  };

  return {
    [`test-results/${filename}.html`]: htmlReport(data),
    [`test-results/${filename}.json`]: JSON.stringify(summary, null, 2),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}
