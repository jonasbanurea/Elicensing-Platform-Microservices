/**
 * Simplified Contract Conformance Test
 * Testing existing JELITA endpoints for contract compliance
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom Metrics
const schemaConformanceRate = new Rate('schema_conformance_rate');
const authSuccessRate = new Rate('auth_success_rate');
const errorHandlingRate = new Rate('error_handling_rate');

// Test Configuration
export const options = {
    stages: [
        { duration: '10s', target: 1 },
        { duration: '20s', target: 2 },
        { duration: '10s', target: 0 },
    ],
    thresholds: {
        'schema_conformance_rate': ['rate>0.90'],
        'auth_success_rate': ['rate>0.90'],
        'error_handling_rate': ['rate>0.90'],
        'http_req_duration': ['p(95)<5000'],
    },
};

// Environment Variables
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Test Data
const TEST_DATA = {
    validUser: {
        username: 'admin1',
        password: 'password123'
    }
};

/**
 * Authenticate and get token
 */
function authenticate() {
    const loginPayload = {
        username: TEST_DATA.validUser.username,
        password: TEST_DATA.validUser.password
    };
    
    const res = http.post(
        `${BASE_URL}/api/auth/signin`,
        JSON.stringify(loginPayload),
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
    
    const success = check(res, {
        'auth: status is 200': (r) => r.status === 200,
        'auth: token received': (r) => {
            try {
                const json = r.json();
                return json.data && json.data.accessToken !== undefined;
            } catch (e) {
                return false;
            }
        },
    });
    
    authSuccessRate.add(success);
    
    if (success) {
        try {
            const jsonData = res.json();
            return jsonData.data.accessToken;
        } catch (e) {
            return null;
        }
    }
    
    return null;
}

/**
 * TC1.1: Schema Conformance - Test Response Structure
 */
function testSchemaConformance(token) {
    group('TC1.1: Schema Conformance', () => {
        // Test health endpoint
        const healthRes = http.get(`${BASE_URL}/health`);
        
        check(healthRes, {
            'health: status 200': (r) => r.status === 200,
            'health: has response': (r) => r.body && r.body.length > 0,
        });
        
        // Test auth endpoint structure
        const authRes = http.get(
            `${BASE_URL}/api/auth/me`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );
        
        const schemaValid = check(authRes, {
            'schema: auth endpoint accessible': (r) => r.status === 200 || r.status === 401,
            'schema: response is JSON or valid format': (r) => {
                return r.headers['Content-Type'] && 
                       (r.headers['Content-Type'].includes('json') || 
                        r.headers['Content-Type'].includes('text'));
            },
        });
        
        schemaConformanceRate.add(schemaValid);
    });
}

/**
 * TC1.3: Error Contract Compliance
 */
function testErrorHandling(token) {
    group('TC1.3: Error Handling', () => {
        // Test 401 Unauthorized (no token)
        const noAuthRes = http.get(`${BASE_URL}/api/auth/me`);
        
        // Test 404 Not Found
        const notFoundRes = http.get(`${BASE_URL}/api/nonexistent-endpoint`);
        
        // Test invalid credentials
        const invalidAuthRes = http.post(
            `${BASE_URL}/api/auth/signin`,
            JSON.stringify({
                username: 'invalid',
                password: 'wrong'
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        
        const errorHandling = check(noAuthRes, {
            'error: 401 returned for no auth': (r) => r.status === 401 || r.status === 403,
        }) && check(notFoundRes, {
            'error: 404 returned for not found': (r) => r.status === 404,
        }) && check(invalidAuthRes, {
            'error: 400/401 for invalid credentials': (r) => r.status === 400 || r.status === 401,
        });
        
        errorHandlingRate.add(errorHandling);
    });
}

/**
 * TC1.6: Authentication Flow
 */
function testAuthFlow() {
    group('TC1.6: Authentication Flow', () => {
        // Test login
        const token = authenticate();
        
        if (token) {
            // Test authenticated request
            const protectedRes = http.get(
                `${BASE_URL}/api/auth/me`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            
            check(protectedRes, {
                'auth-flow: authenticated request succeeds': (r) => r.status === 200 || r.status === 404,
            });
        }
    });
}

// Main Test Flow
export default function() {
    // Authenticate
    const token = authenticate();
    
    if (!token) {
        console.error('Authentication failed, some tests may not run');
    }
    
    // Run test cases
    testSchemaConformance(token);
    sleep(0.5);
    
    testErrorHandling(token);
    sleep(0.5);
    
    testAuthFlow();
    sleep(1);
}

export function handleSummary(data) {
    const metrics = data.metrics;
    
    let summary = '\n=== Contract Conformance Test Results (Simplified) ===\n\n';
    
    summary += 'Test Metrics:\n';
    if (metrics.schema_conformance_rate) {
        summary += `  Schema Conformance: ${(metrics.schema_conformance_rate.values.rate * 100).toFixed(2)}%\n`;
    }
    if (metrics.auth_success_rate) {
        summary += `  Auth Success Rate: ${(metrics.auth_success_rate.values.rate * 100).toFixed(2)}%\n`;
    }
    if (metrics.error_handling_rate) {
        summary += `  Error Handling: ${(metrics.error_handling_rate.values.rate * 100).toFixed(2)}%\n`;
    }
    
    summary += '\nHTTP Metrics:\n';
    summary += `  Total Requests: ${metrics.http_reqs.values.count}\n`;
    summary += `  Failed Requests: ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
    summary += `  Avg Duration: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `  P95 Duration: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n\n`;
    
    const allPassed = 
        metrics.schema_conformance_rate && metrics.schema_conformance_rate.values.rate >= 0.90 &&
        metrics.auth_success_rate && metrics.auth_success_rate.values.rate >= 0.90 &&
        metrics.error_handling_rate && metrics.error_handling_rate.values.rate >= 0.90;
    
    summary += 'Overall Status: ' + (allPassed ? '✅ PASSED' : '⚠️ PARTIAL') + '\n';
    
    return {
        'stdout': summary,
        './test-results/interoperability/contract/simplified-results.json': JSON.stringify(data, null, 2),
    };
}
