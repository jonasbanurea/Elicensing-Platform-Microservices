# Performance Comparison Report: Monolith vs Microservices
**Test Date:** December 20, 2025  
**Test Duration:** 10 minutes per test  
**Architecture Comparison:** Monolith vs Microservices

---

## Executive Summary

Comprehensive performance testing was conducted comparing monolithic and microservices architectures under both baseline and stress conditions. All tests completed successfully with **100% success rate (0% errors)** across all scenarios.

### Key Findings

| Metric | Monolith Baseline | Monolith Stress | Microservices Baseline | Microservices Stress |
|--------|-------------------|-----------------|------------------------|----------------------|
| **Virtual Users** | 35 | 75 | 35 | 75 |
| **Total Requests** | 11,840 | 17,200 | 16,147 | 18,889 |
| **Throughput (req/s)** | 19.54 | 35.56 | 26.65 | 38.94 |
| **Avg Response Time** | 384ms | 632ms | 285ms | 803ms |
| **P95 Response Time** | 1.12s | 1.76s | 666ms | 2.25s |
| **P99 Response Time** | 1.39s | 2.20s | 914ms | 3.34s |
| **Success Rate** | 100% | 100% | 100% | 100% |

---

## Test Configuration

### Test Scenarios
Each test scenario simulates a complete business workflow including:
1. **Authentication Flow** - Login for different user roles
2. **Pemohon Flow** - Application creation and submission
3. **Admin Flow** - Application listing, approval, and disposition
4. **OPD Flow** - Technical assessment (kajian teknis)
5. **Pimpinan Flow** - Draft approval and final decision

### Test Parameters

#### Baseline Test (35 VUs)
- **Virtual Users:** 35 concurrent users
- **Ramp-up Time:** 30 seconds
- **Duration:** 10 minutes
- **Purpose:** Normal load conditions

#### Stress Test (75 VUs)
- **Virtual Users:** 75 concurrent users
- **Ramp-up Time:** 30 seconds
- **Duration:** 10 minutes
- **Purpose:** High load conditions

---

## Detailed Results

### 1. Monolith Architecture - Baseline Test

**Configuration:** 35 Virtual Users

#### Overall Performance
- **Total Requests:** 11,840 requests
- **Throughput:** 19.54 req/s
- **Total Iterations:** 2,678 complete workflows
- **Iteration Rate:** 4.42 iterations/s
- **Checks Passed:** 10,312 / 10,312 (100%)

#### Response Time Metrics
- **Average:** 384.46ms
- **Minimum:** 648µs
- **Median (P50):** 338.14ms
- **P90:** 959.35ms
- **P95:** 1.12s
- **P99:** 1.39s
- **Maximum:** 1.78s

#### Component-Specific Latencies
| Component | Avg | Min | P50 | P90 | P95 | P99 | Max |
|-----------|-----|-----|-----|-----|-----|-----|-----|
| **Auth** | 101.54ms | 58.42ms | 70.64ms | 192.78ms | 204.31ms | 321.29ms | 388.66ms |
| **Permohonan** | 689.71ms | 648µs | 632.67ms | 1.18s | 1.30s | 1.53s | 1.78s |
| **Survey** | 467.93ms | 178.32ms | 457.92ms | 623.18ms | 683.32ms | 829.83ms | 1.05s |
| **Workflow** | 430.47ms | 725.7µs | 452.94ms | 716.86ms | 787.05ms | 980.42ms | 1.25s |

#### Group Duration
- **Average:** 6.05s
- **Median:** 6.48s
- **P95:** 9.31s
- **Maximum:** 10.96s

---

### 2. Monolith Architecture - Stress Test

**Configuration:** 75 Virtual Users

#### Overall Performance
- **Total Requests:** 17,200 requests
- **Throughput:** 35.56 req/s
- **Total Iterations:** 3,855 complete workflows
- **Iteration Rate:** 7.97 iterations/s
- **Checks Passed:** 14,710 / 14,710 (100%)

#### Response Time Metrics
- **Average:** 632.29ms (+64.4% vs baseline)
- **Minimum:** 509.6µs
- **Median (P50):** 538.07ms
- **P90:** 1.50s
- **P95:** 1.76s
- **P99:** 2.20s
- **Maximum:** 3.56s

#### Component-Specific Latencies
| Component | Avg | Min | P50 | P90 | P95 | P99 | Max |
|-----------|-----|-----|-----|-----|-----|-----|-----|
| **Auth** | 250.80ms | 60.17ms | 204.79ms | 508.82ms | 588.70ms | 786.27ms | 928.93ms |
| **Permohonan** | 1.08s | 509.6µs | 970.43ms | 1.85s | 2.05s | 2.41s | 3.56s |
| **Survey** | 661.42ms | 214.32ms | 643.54ms | 896.92ms | 982.38ms | 1.17s | 1.56s |
| **Workflow** | 670.34ms | 632.19µs | 703.92ms | 1.14s | 1.28s | 1.65s | 2.03s |

#### Group Duration
- **Average:** 7.12s (+17.7% vs baseline)
- **Median:** 7.69s
- **P95:** 10.76s
- **Maximum:** 12.93s

---

### 3. Microservices Architecture - Baseline Test

**Configuration:** 35 Virtual Users

#### Overall Performance
- **Total Requests:** 16,147 requests
- **Throughput:** 26.65 req/s (+36.4% vs monolith)
- **Total Iterations:** 2,648 complete workflows
- **Iteration Rate:** 4.37 iterations/s
- **Checks Passed:** 10,483 / 10,483 (100%)

#### Response Time Metrics
- **Average:** 284.84ms (-25.9% vs monolith)
- **Minimum:** 2.05ms
- **Median (P50):** 299.06ms
- **P90:** 577.13ms
- **P95:** 665.56ms
- **P99:** 914.41ms
- **Maximum:** 1.46s

#### Component-Specific Latencies
| Component | Avg | Min | P50 | P90 | P95 | P99 | Max |
|-----------|-----|-----|-----|-----|-----|-----|-----|
| **Auth** | 118.63ms | 63.14ms | 77.57ms | 203.80ms | 263.20ms | 334.16ms | 400.34ms |
| **Permohonan** | 438.07ms | 7.17ms | 427.98ms | 663.23ms | 760.83ms | 993.43ms | 1.33s |
| **Survey** | 463.89ms | 169.10ms | 448.12ms | 635.66ms | 720.23ms | 898.39ms | 1.46s |
| **Workflow** | 379.52ms | 3.94ms | 390.78ms | 581.69ms | 654.65ms | 863.97ms | 1.20s |

#### Group Duration
- **Average:** 6.12s
- **Median:** 6.48s
- **P95:** 9.33s
- **Maximum:** 11.35s

---

### 4. Microservices Architecture - Stress Test

**Configuration:** 75 Virtual Users

#### Overall Performance
- **Total Requests:** 18,889 requests
- **Throughput:** 38.94 req/s (+9.5% vs monolith)
- **Total Iterations:** 3,090 complete workflows
- **Iteration Rate:** 6.37 iterations/s
- **Checks Passed:** 12,219 / 12,219 (100%)

#### Response Time Metrics
- **Average:** 803.18ms (+27.0% vs baseline, +27.0% vs monolith stress)
- **Minimum:** 1.70ms
- **Median (P50):** 591.69ms
- **P90:** 1.78s
- **P95:** 2.25s
- **P99:** 3.34s
- **Maximum:** 6.05s

#### Component-Specific Latencies
| Component | Avg | Min | P50 | P90 | P95 | P99 | Max |
|-----------|-----|-----|-----|-----|-----|-----|-----|
| **Auth** | 158.32ms | 64.20ms | 135.31ms | 276.83ms | 331.07ms | 411.91ms | 571.27ms |
| **Permohonan** | 1.46s | 10.53ms | 1.30s | 2.60s | 3.04s | 4.65s | 6.05s |
| **Survey** | 837.96ms | 155.28ms | 756.97ms | 1.46s | 1.69s | 2.13s | 2.58s |
| **Workflow** | 706.67ms | 2.80ms | 421.57ms | 1.96s | 2.53s | 3.96s | 5.86s |

#### Group Duration
- **Average:** 9.22s (+50.7% vs baseline)
- **Median:** 9.96s
- **P95:** 14.68s
- **Maximum:** 23.01s

---

## Comparative Analysis

### Performance Comparison: Baseline (35 VUs)

| Metric | Monolith | Microservices | Difference |
|--------|----------|---------------|------------|
| Throughput | 19.54 req/s | 26.65 req/s | **+36.4%** ✓ |
| Avg Response Time | 384ms | 285ms | **-25.9%** ✓ |
| P95 Response Time | 1.12s | 666ms | **-40.5%** ✓ |
| P99 Response Time | 1.39s | 914ms | **-34.2%** ✓ |
| Total Requests | 11,840 | 16,147 | **+36.4%** ✓ |

**Winner: Microservices** - Superior performance across all metrics

### Performance Comparison: Stress (75 VUs)

| Metric | Monolith | Microservices | Difference |
|--------|----------|---------------|------------|
| Throughput | 35.56 req/s | 38.94 req/s | **+9.5%** ✓ |
| Avg Response Time | 632ms | 803ms | **+27.0%** ✗ |
| P95 Response Time | 1.76s | 2.25s | **+27.8%** ✗ |
| P99 Response Time | 2.20s | 3.34s | **+51.8%** ✗ |
| Total Requests | 17,200 | 18,889 | **+9.8%** ✓ |

**Winner: Monolith** - Better response times under high load

### Component-Level Comparison (Baseline)

| Component | Monolith Avg | Microservices Avg | Improvement |
|-----------|--------------|-------------------|-------------|
| Auth | 101.54ms | 118.63ms | -16.8% |
| Permohonan | 689.71ms | 438.07ms | **+36.5%** ✓ |
| Survey | 467.93ms | 463.89ms | **+0.9%** ✓ |
| Workflow | 430.47ms | 379.52ms | **+11.8%** ✓ |

### Component-Level Comparison (Stress)

| Component | Monolith Avg | Microservices Avg | Difference |
|-----------|--------------|-------------------|------------|
| Auth | 250.80ms | 158.32ms | **+36.9%** ✓ |
| Permohonan | 1.08s | 1.46s | -35.2% |
| Survey | 661.42ms | 837.96ms | -26.7% |
| Workflow | 670.34ms | 706.67ms | -5.4% |

### Scalability Analysis

#### Monolith: 35 VUs → 75 VUs
- Throughput: +82.0% (19.54 → 35.56 req/s)
- Avg Response Time: +64.4% (384ms → 632ms)
- P95 Response Time: +57.1% (1.12s → 1.76s)

#### Microservices: 35 VUs → 75 VUs
- Throughput: +46.1% (26.65 → 38.94 req/s)
- Avg Response Time: +181.9% (285ms → 803ms)
- P95 Response Time: +237.8% (666ms → 2.25s)

**Observation:** Monolith shows better scalability characteristics under increasing load, with more consistent response time degradation.

---

## Network and Data Transfer

### Monolith Architecture

#### Baseline (35 VUs)
- **Data Received:** 7.4 MB (12 kB/s)
- **Data Sent:** 4.2 MB (6.9 kB/s)
- **Total Transfer:** 11.6 MB

#### Stress (75 VUs)
- **Data Received:** 11 MB (22 kB/s)
- **Data Sent:** 6.1 MB (13 kB/s)
- **Total Transfer:** 17.1 MB

### Microservices Architecture

#### Baseline (35 VUs)
- **Data Received:** 9.9 MB (16 kB/s)
- **Data Sent:** 5.3 MB (8.8 kB/s)
- **Total Transfer:** 15.2 MB (+31.0% vs monolith)

#### Stress (75 VUs)
- **Data Received:** 12 MB (24 kB/s)
- **Data Sent:** 6.2 MB (13 kB/s)
- **Total Transfer:** 18.2 MB (+6.4% vs monolith)

**Note:** Microservices architecture requires more data transfer due to inter-service communication and API Gateway overhead.

---

## Reliability and Stability

### Success Rates
All architectures demonstrated **100% reliability**:
- ✅ Monolith Baseline: 0 failures (11,840 requests)
- ✅ Monolith Stress: 0 failures (17,200 requests)
- ✅ Microservices Baseline: 0 failures (16,147 requests)
- ✅ Microservices Stress: 0 failures (18,889 requests)

### HTTP Request Metrics

#### Connection Overhead
- **Blocked Time:** < 6µs (negligible)
- **Connecting Time:** < 2µs (negligible)
- **TLS Handshaking:** 0s (no SSL in test environment)

#### Request Phases
All architectures show similar patterns:
- **Sending:** ~15-20µs average
- **Waiting:** Matches overall response time
- **Receiving:** ~60-85µs average

---

## Conclusions

### Key Insights

1. **Baseline Performance (35 VUs)**
   - ✓ Microservices outperforms monolith by **26-40%** in response time
   - ✓ Microservices handles **36% more throughput**
   - ✓ Microservices shows better component-level performance

2. **Stress Performance (75 VUs)**
   - ✗ Monolith maintains better response times under high load
   - ✓ Microservices still achieves **10% higher throughput**
   - ✗ Microservices response time degrades more significantly

3. **Scalability**
   - Monolith: More predictable scaling (64% RT increase for 114% load increase)
   - Microservices: Higher throughput but steeper degradation (182% RT increase)

4. **Reliability**
   - Both architectures: **100% success rate**
   - No errors or failures in any test scenario

### Recommendations

#### Use Monolith When:
- ✓ Expecting high load with many concurrent users (>50 VUs)
- ✓ Predictable scaling is critical
- ✓ Lower operational complexity is desired
- ✓ Response time consistency under load is priority

#### Use Microservices When:
- ✓ Normal to moderate load conditions (<50 VUs)
- ✓ Maximum throughput is priority
- ✓ Best response times under normal load needed
- ✓ Independent service scaling is beneficial
- ✓ Different teams managing different services

### Performance Optimization Opportunities

#### Microservices Architecture
1. **Connection Pooling:** Implement HTTP connection pooling between services
2. **Caching:** Add Redis/Memcached for frequently accessed data
3. **Load Balancing:** Optimize API Gateway and service load balancing
4. **Database Connection Pooling:** Tune connection pool sizes per service
5. **Async Processing:** Use message queues for non-critical operations

#### Monolith Architecture
1. **Database Query Optimization:** Review and optimize slow queries
2. **Code Profiling:** Identify and optimize bottlenecks
3. **Caching Strategy:** Implement application-level caching
4. **Connection Pool Tuning:** Adjust database connection pool settings

---

## Test Environment

### Infrastructure
- **Test Tool:** k6 (v0.49.0 or later)
- **Database:** PostgreSQL (separate instances per architecture)
- **Container Platform:** Docker / Docker Compose
- **Load Generator:** Local machine

### System Resources
- Test duration: 10 minutes per test
- Ramp-up period: 30 seconds
- VU distribution: Even across all user roles

### Test Data
- Pre-seeded test users for each role:
  - Pemohon (Applicant)
  - Admin (Administrator)
  - OPD (Technical Department)
  - Pimpinan (Leadership)
- Sample application data
- Clean database state before each test

---

## Appendix

### Test File Locations
```
test-results/2025-12-20/
├── monolith/
│   ├── baseline/
│   │   ├── summary.txt
│   │   ├── summary.json
│   │   ├── metrics.csv
│   │   └── failures.txt (empty - no failures)
│   └── stress/
│       ├── summary.txt
│       ├── summary.json
│       ├── metrics.csv
│       └── failures.txt (empty - no failures)
└── microservices/
    ├── baseline/
    │   ├── summary.txt
    │   ├── summary.json
    │   ├── metrics.csv
    │   └── failures.txt (empty - no failures)
    └── stress/
        ├── summary.txt
        ├── summary.json
        ├── metrics.csv
        └── failures.txt (empty - no failures)
```

### Terminology
- **VU (Virtual User):** Simulated concurrent user
- **P50 (Median):** 50% of requests complete within this time
- **P90:** 90% of requests complete within this time
- **P95:** 95% of requests complete within this time
- **P99:** 99% of requests complete within this time
- **Throughput:** Requests processed per second
- **Iteration:** One complete workflow execution

---

**Report Generated:** December 20, 2025  
**Test Engineer:** Performance Testing Team  
**Status:** ✅ All Tests Completed Successfully
