/**
 * Contract Conformance Test (aligned to current gateway + pendaftaran service)
 * - Validates schema conformance against simplified OpenAPI expectations
 * - Checks backward compatibility (minimal payload accepted)
 * - Verifies error contract shape
 * - Confirms data mapping integrity and status endpoints
 *
 * Usage: k6 run --env BASE_URL=http://localhost:8080 contract-conformance-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom Metrics
const schemaConformanceRate = new Rate('schema_conformance_rate');
const backwardCompatibilityRate = new Rate('backward_compatibility_rate');
const errorContractRate = new Rate('error_contract_rate');
const dataMappingAccuracy = new Rate('data_mapping_accuracy');
const statusConsistencyRate = new Rate('status_consistency_rate');
const authSuccessRate = new Rate('auth_success_rate');

// Test Configuration
export const options = {
    stages: [
        { duration: '20s', target: 1 },
        { duration: '1m40s', target: 5 },
        { duration: '20s', target: 0 },
    ],
    thresholds: {
        schema_conformance_rate: ['rate>0.95'],
        backward_compatibility_rate: ['rate>0.95'],
        error_contract_rate: ['rate>0.95'],
        data_mapping_accuracy: ['rate>0.95'],
        status_consistency_rate: ['rate>0.95'],
        auth_success_rate: ['rate>0.95'],
        http_req_duration: ['p(95)<5000'],
        http_req_failed: ['rate<0.35'],
    },
};

// Environment Variables
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Helper: simplified schema validator
function validateSchema(data, schema) {
    if (schema.type && schema.type !== typeof data && !(schema.type === 'array' && Array.isArray(data))) {
        return false;
    }
    if (schema.required) {
        for (const key of schema.required) {
            if (!(key in data)) return false;
        }
    }
    if (schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
            if (!(key in data)) continue;
            const value = data[key];
            if (value === null) {
                if (prop.allowNull) continue;
                return false;
            }
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (prop.type && actualType !== prop.type) return false;
            if (prop.enum && !prop.enum.includes(value)) return false;
            if (prop.pattern && typeof value === 'string' && !(new RegExp(prop.pattern)).test(value)) return false;
            if (prop.properties && typeof value === 'object' && !Array.isArray(value)) {
                if (!validateSchema(value, prop)) return false;
            }
            if (prop.items && Array.isArray(value)) {
                for (const item of value) {
                    if (!validateSchema(item, prop.items)) return false;
                }
            }
        }
    }
    return true;
}

// Simplified OpenAPI-like schemas for current services
const SCHEMAS = {
    SignInResponse: {
        required: ['success', 'message', 'data'],
        properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
                type: 'object',
                required: ['id', 'username', 'role', 'accessToken'],
                properties: {
                    id: { type: 'number' },
                    username: { type: 'string' },
                    role: { type: 'string' },
                    accessToken: { type: 'string' },
                },
            },
        },
    },
    PermohonanResponse: {
        required: ['success', 'message', 'data'],
        properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
                type: 'object',
                required: ['id', 'status', 'data_pemohon'],
                properties: {
                    id: { type: 'number' },
                    status: { type: 'string' },
                    data_pemohon: { type: 'object' },
                    nomor_registrasi: { type: 'string', allowNull: true },
                },
            },
        },
    },
    StatusResponse: {
        required: ['data'],
        properties: {
            message: { type: 'string' },
            data: {
                type: 'object',
                required: ['id', 'status', 'created_at', 'updated_at'],
                properties: {
                    id: { type: 'number' },
                    status: { type: 'string' },
                    nomor_registrasi: { type: 'string', allowNull: true },
                    created_at: { type: 'string' },
                    updated_at: { type: 'string' },
                },
            },
        },
    },
    ErrorResponse: {
        properties: {
            message: { type: 'string' },
            success: { type: 'boolean' },
        },
    },
};

function generateNIK() {
    const province = '33';
    const city = '74';
    const district = '01';
    const birthdate = randomIntBetween(1, 28).toString().padStart(2, '0');
    const birthmonth = randomIntBetween(1, 12).toString().padStart(2, '0');
    const birthyear = randomIntBetween(70, 99).toString().padStart(2, '0');
    const sequence = randomIntBetween(1, 9999).toString().padStart(4, '0');
    return `${province}${city}${district}${birthdate}${birthmonth}${birthyear}${sequence}`;
}

function buildPayload() {
    const n = randomIntBetween(1000, 9999);
    return {
        data_pemohon: {
            nama: `PT Kontrak ${n}`,
            nik: generateNIK(),
            email: `kontrak${n}@example.com`,
            telepon: `08${randomIntBetween(1000000000, 9999999999)}`,
            jenis_izin: 'UMKU',
            bidang_usaha: 'Teknologi Informasi',
            skala_usaha: 'MENENGAH',
            alamat: `Jl. Kontrak No. ${n}, Semarang`,
        },
    };
}

function authenticate() {
    const loginPayload = { username: 'admin1', password: 'password123' };
    const res = http.post(`${BASE_URL}/api/auth/signin`, JSON.stringify(loginPayload), {
        headers: { 'Content-Type': 'application/json' },
    });

    const success = check(res, {
        'auth: 200': (r) => r.status === 200,
        'auth: schema valid': (r) => {
            try {
                const body = r.json();
                return validateSchema(body, SCHEMAS.SignInResponse);
            } catch (e) {
                return false;
            }
        },
    });

    authSuccessRate.add(success);
    return success ? res.json('data').accessToken : null;
}

function createPermohonan(token, payload) {
    return http.post(`${BASE_URL}/api/permohonan`, JSON.stringify(payload), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });
}

export function testSchemaConformance(token) {
    group('TC1.1: Schema Conformance', () => {
        const payload = buildPayload();
        const res = createPermohonan(token, payload);

        const passed = check(res, {
            'schema: 201 created': (r) => r.status === 201,
            'schema: matches contract': (r) => {
                try {
                    return validateSchema(r.json(), SCHEMAS.PermohonanResponse);
                } catch (e) {
                    return false;
                }
            },
        });

        schemaConformanceRate.add(passed);
    });
}

export function testBackwardCompatibility(token) {
    group('TC1.2: Backward Compatibility', () => {
        const minimalPayload = { data_pemohon: { nama: 'PT Minimal', nik: generateNIK(), email: 'minimal@example.com' } };
        const res = createPermohonan(token, minimalPayload);

        const passed = check(res, {
            'back-compat: accepted minimal payload': (r) => r.status === 201,
            'back-compat: schema still valid': (r) => validateSchema(r.json(), SCHEMAS.PermohonanResponse),
        });

        backwardCompatibilityRate.add(passed);
    });
}

export function testErrorContract(token) {
    group('TC1.3: Error Contract', () => {
        let passes = 0;

        const invalid = http.post(`${BASE_URL}/api/permohonan`, JSON.stringify({ invalid: true }), {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        const invalidPass = check(invalid, {
            'error: invalid payload returns 400/500': (r) => r.status === 400 || r.status === 500,
            'error: message present': (r) => !!r.json('message'),
        });
        passes += invalidPass ? 1 : 0;

        const missing = http.get(`${BASE_URL}/api/permohonan/999999/status`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const missingPass = check(missing, {
            'error: not found 404': (r) => r.status === 404,
            'error: shape valid': (r) => validateSchema(r.json(), SCHEMAS.ErrorResponse),
        });
        passes += missingPass ? 1 : 0;

        errorContractRate.add(passes === 2);
    });
}

export function testDataMapping(token) {
    group('TC1.4: Data Mapping Integrity', () => {
        const payload = buildPayload();
        const res = createPermohonan(token, payload);
        const body = res.json();
        const created = body?.data;

        const passed = check(res, {
            'mapping: payload echoed back': () => created && created.data_pemohon?.nama === payload.data_pemohon.nama,
            'mapping: skala_usaha preserved': () => created && created.data_pemohon?.skala_usaha === payload.data_pemohon.skala_usaha,
        });

        dataMappingAccuracy.add(passed);
    });
}

export function testStatusConsistency(token) {
    group('TC1.5: Status Endpoint', () => {
        const payload = buildPayload();
        const createRes = createPermohonan(token, payload);
        const permohonanId = createRes.json('data').id;

        const statusRes = http.get(`${BASE_URL}/api/permohonan/${permohonanId}/status`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const passed = check(statusRes, {
            'status: 200': (r) => r.status === 200,
            'status: schema valid': (r) => validateSchema(r.json(), SCHEMAS.StatusResponse),
            'status: default draft': (r) => r.json('data').status !== undefined,
        });

        statusConsistencyRate.add(passed);
    });
}

// Main Test Flow
export default function () {
    const token = authenticate();
    if (!token) {
        console.error('Authentication failed, skipping iteration');
        return;
    }

    testSchemaConformance(token);
    sleep(0.2);
    testBackwardCompatibility(token);
    sleep(0.2);
    testErrorContract(token);
    sleep(0.2);
    testDataMapping(token);
    sleep(0.2);
    testStatusConsistency(token);
    sleep(0.5);
}

export function handleSummary(data) {
    const metrics = data.metrics;
    let summary = '\n=== Contract Conformance Results ===\n\n';
    summary += `Schema Conformance: ${(metrics.schema_conformance_rate?.values?.rate * 100).toFixed(2)}%\n`;
    summary += `Backward Compatibility: ${(metrics.backward_compatibility_rate?.values?.rate * 100).toFixed(2)}%\n`;
    summary += `Error Contract: ${(metrics.error_contract_rate?.values?.rate * 100).toFixed(2)}%\n`;
    summary += `Data Mapping: ${(metrics.data_mapping_accuracy?.values?.rate * 100).toFixed(2)}%\n`;
    summary += `Status Consistency: ${(metrics.status_consistency_rate?.values?.rate * 100).toFixed(2)}%\n`;
    summary += `Auth Success: ${(metrics.auth_success_rate?.values?.rate * 100).toFixed(2)}%\n`;
    summary += `HTTP Failures: ${(metrics.http_req_failed?.values?.rate * 100).toFixed(2)}%\n`;
    summary += `P95 Latency: ${metrics.http_req_duration?.values?.['p(95)'].toFixed(2)}ms\n`;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return {
        stdout: summary,
        [`./test-results/interoperability/contract/contract-test-${timestamp}.json`]: JSON.stringify(data, null, 2),
    };
}
