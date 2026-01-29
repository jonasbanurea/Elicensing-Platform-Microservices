// Simple API Health Check Scenario for Audit Log Testing
// Only hits valid endpoints that should return 200 OK
// This ensures accurate audit log coverage measurement

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    scenarios: {
        health_check: {
            executor: 'ramping-vus',
            startVUs: 5,
            stages: [
                { duration: '1m', target: 10 },   // Ramp up to 10 VUs
                { duration: '3m', target: 20 },   // Stay at 20 VUs
                { duration: '1m', target: 5 },    // Ramp down
            ],
            gracefulRampDown: '30s',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:30000';

// Valid endpoints that should return 200 OK
const healthEndpoints = [
    '/health',
    '/api/users/health',
    '/api/permohonan/health',
    '/api/workflow/health',
    '/api/survey/health',
    '/api/archive/health',
];

export default function () {
    // Randomly pick a health endpoint
    const endpoint = healthEndpoints[Math.floor(Math.random() * healthEndpoints.length)];

    const res = http.get(`${BASE_URL}${endpoint}`);

    check(res, {
        'status is 200': (r) => r.status === 200,
    });

    // Small sleep between requests
    sleep(0.5);
}
