# Microservices Interoperability Test Plan

## Overview
Comprehensive test plan untuk membuktikan kemampuan interoperabilitas sistem JELITA (TS3) dengan platform eksternal (OSS-RBA, SPBE) sesuai standar API contracts dan compliance requirements.

**Alignment dengan Literatur:**
- Contract Testing (Pact, OpenAPI validation)
- Integration Testing (end-to-end flows)
- Compliance Verification (SPBE standards)

**Referensi:**
- Peraturan Presiden tentang Sistem Pemerintahan Berbasis Elektronik (SPBE)
- Arsitektur SPBE Nasional - Sistem Penghubung Layanan (SPL)
- Microservices testing best practices (contract, integration, E2E)

---

## 1. Integration Readiness: Interface Adaptation Verification (Contract/Conformance)

### 1.1 Tujuan
Membuktikan TS3 (API Gateway + Adapters) mampu "berbicara" sesuai kontrak API eksternal (OSS-RBA/SPBE), memastikan semantic interoperability, backward compatibility, dan error handling yang konsisten.

### 1.2 Scope

#### External API Contracts

**A. OSS-Adapter Contract**
- **SubmitApplication**: Submit permohonan perizinan ke OSS-RBA
- **UpdateApplicationStatus**: Update status permohonan
- **QueryApplicationStatus**: Query status permohonan berdasarkan reference_id
- **GetApplicationDetails**: Retrieve detail permohonan
- **CancelApplication**: Cancel/batalkan permohonan

**B. SPBE/SPL Contract**
- **RegisterService**: Registrasi layanan ke service directory
- **PublishMetadata**: Publish metadata layanan (OpenAPI, schema)
- **ExchangeAuditLog**: Pertukaran audit log antar sistem
- **HandleCallback**: Terima callback/notification dari platform nasional

#### Adapter Layer Requirements
Implementasi di `layanan-api-gateway` untuk:
1. **Transform Payload**: Mapping field antara internal model ↔ external contract
2. **Authentication**: Token management, signature validation
3. **Retry Logic**: Exponential backoff untuk transient failures
4. **Idempotency**: Prevent duplicate submission dengan idempotency-key
5. **Audit Log**: Capture semua request/response untuk compliance

### 1.3 Test Cases

#### TC1.1: Schema Conformance
**Objektif**: Setiap request TS3 → OSS/SPBE lulus validasi OpenAPI/JSON Schema

**Test Steps:**
1. Load OpenAPI spec dari external platform
2. Kirim request dari TS3 ke adapter
3. Validate request payload terhadap schema (required fields, types, formats)
4. Validate response payload terhadap schema
5. Assert: 0 schema violations

**Expected Result:**
- Request payload valid (all required fields present, correct types)
- Response payload valid (matches declared schema)
- No undeclared fields in strict mode

**Metrics:**
- Schema Conformance Rate = (Valid Payloads / Total Payloads) × 100%
- Target: 100%

---

#### TC1.2: Backward Compatibility
**Objektif**: Versi kontrak v1 tetap lolos walau ada v1.1 (minor changes)

**Test Steps:**
1. Setup adapter dengan contract v1.0
2. Kirim request dengan payload v1.0
3. Upgrade contract ke v1.1 (add optional fields)
4. Kirim request dengan payload v1.0 (tanpa new fields)
5. Assert: request tetap diterima, no breaking changes

**Expected Result:**
- v1.0 client masih bisa communicate dengan v1.1 service
- Optional fields tidak mandatory
- No 400 Bad Request errors

**Metrics:**
- Backward Compatibility Rate = (Successful v1.0 Calls / Total v1.0 Calls) × 100%
- Target: 100%

---

#### TC1.3: Error Contract Compliance
**Objektif**: TS3 menerjemahkan error OSS/SPBE menjadi error model JELITA yang konsisten

**Test Steps:**
1. Trigger various error scenarios di external platform:
   - 400: Invalid payload
   - 401: Authentication failure
   - 403: Authorization denied
   - 404: Resource not found
   - 409: Conflict (duplicate)
   - 422: Validation error
   - 500: Internal server error
   - 503: Service unavailable
2. Capture error response dari adapter
3. Verify error mapping:
   - HTTP status code mapped correctly
   - Error code standardized
   - Error message user-friendly (Bahasa Indonesia)
   - Error details preserved for debugging

**Expected Error Model:**
```json
{
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "message": "Gagal menghubungi layanan OSS-RBA",
    "details": {
      "external_code": "OSS_VALIDATION_ERROR",
      "external_message": "Field 'nib' is required",
      "trace_id": "abc-123-xyz"
    }
  }
}
```

**Metrics:**
- Error Mapping Accuracy = (Correctly Mapped Errors / Total Errors) × 100%
- Target: 100%

---

#### TC1.4: Idempotency Verification
**Objektif**: Submit permohonan dua kali dengan same idempotency-key → hanya satu tercatat

**Test Steps:**
1. Generate idempotency-key: `idem-{uuid}`
2. Submit permohonan pertama dengan key tersebut
3. Capture response (201 Created, permohonan_id)
4. Submit permohonan kedua dengan same key (immediate retry)
5. Assert: 
   - Response 200 OK (bukan 201)
   - Same permohonan_id returned
   - Only one record in database
6. Wait 24 hours (atau TTL idempotency cache)
7. Submit lagi dengan same key
8. Assert: treated as new request (jika TTL expired)

**Expected Result:**
- First submission: 201 Created
- Duplicate submission: 200 OK, same ID
- Database contains only one record
- Idempotency window: 24 hours

**Metrics:**
- Idempotency Compliance = (Prevented Duplicates / Duplicate Attempts) × 100%
- Target: 100%

---

#### TC1.5: Field Mapping Accuracy
**Objektif**: Verify semantic mapping between JELITA internal model ↔ OSS external model

**Test Data:**
| JELITA Field | OSS-RBA Field | Transformation |
|--------------|---------------|----------------|
| `permohonan.jenis_izin` | `license_type` | Lookup table mapping |
| `permohonan.pemohon.nama` | `applicant.name` | Direct copy |
| `permohonan.pemohon.nik` | `applicant.id_number` | Direct copy |
| `permohonan.tanggal_permohonan` | `submitted_at` | ISO 8601 format |
| `permohonan.dokumen` | `attachments` | Array of {name, url, type} |

**Test Steps:**
1. Create permohonan di JELITA dengan test data
2. Trigger submit ke OSS adapter
3. Capture outbound payload
4. Verify each mapping:
   - Field presence
   - Data type correctness
   - Value transformation (e.g., date format)
   - No data loss

**Expected Result:**
- All mappings correct
- No null/undefined in required fields
- Date formats consistent (ISO 8601)

**Metrics:**
- Field Mapping Accuracy = (Correct Mappings / Total Mappings) × 100%
- Target: 100%

---

#### TC1.6: Authentication Flow
**Objektif**: Verify token lifecycle, refresh, and expiry handling

**Test Steps:**
1. Adapter requests access token dari OSS auth endpoint
2. Verify token received (JWT format)
3. Use token untuk API calls
4. Simulate token expiry (wait or manipulate time)
5. Verify adapter auto-refreshes token
6. Verify API call succeeds with new token

**Expected Result:**
- Initial token acquisition successful
- Token refresh before expiry
- No 401 errors after refresh
- Audit log contains token lifecycle events

**Metrics:**
- Auth Success Rate = (Successful Auth / Total Attempts) × 100%
- Target: 99.9%

---

#### TC1.7: Retry Logic & Circuit Breaker
**Objektif**: Verify resilience patterns under transient failures

**Test Steps:**
1. Simulate network timeout (503 Service Unavailable)
2. Verify adapter retries with exponential backoff
3. Assert max retries = 3
4. Verify circuit breaker opens after threshold failures
5. Verify circuit breaker half-opens after cooldown
6. Verify circuit breaker closes after successful calls

**Expected Result:**
- Retry attempts: 1st (immediate), 2nd (2s), 3rd (4s)
- Circuit breaker opens after 5 consecutive failures
- Half-open after 30s cooldown
- Closed after 3 successful calls in half-open state

**Metrics:**
- Retry Success Rate = (Successful After Retry / Total Retries) × 100%
- Circuit Breaker Effectiveness: Latency reduction during failures

---

### 1.4 Expected Output (Paper)

#### Table 1: Contract Conformance Results
| Test Case | Endpoint | Status | Schema Valid | Error Handling | Idempotency | Notes |
|-----------|----------|--------|--------------|----------------|-------------|-------|
| TC1.1 | SubmitApplication | ✅ PASS | ✅ | N/A | N/A | All fields valid |
| TC1.2 | QueryStatus | ✅ PASS | ✅ | N/A | N/A | v1.0 compatible |
| TC1.3 | UpdateStatus | ✅ PASS | ✅ | ✅ | N/A | Error mapped correctly |
| TC1.4 | SubmitApplication | ✅ PASS | N/A | N/A | ✅ | Duplicate prevented |
| TC1.5 | All endpoints | ✅ PASS | ✅ | N/A | N/A | Field mapping accurate |
| TC1.6 | Auth | ✅ PASS | N/A | ✅ | N/A | Token refresh works |
| TC1.7 | All endpoints | ✅ PASS | N/A | ✅ | N/A | Retry + CB effective |

#### Figure 1: OpenAPI Schema Excerpt
```yaml
openapi: 3.0.0
paths:
  /api/v1/applications:
    post:
      summary: Submit Application to OSS-RBA
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApplicationSubmission'
      responses:
        '201':
          description: Application created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApplicationResponse'
components:
  schemas:
    ApplicationSubmission:
      type: object
      required:
        - license_type
        - applicant
        - submitted_at
      properties:
        license_type:
          type: string
          enum: [UMKU, PBST, PERDAGANGAN]
        applicant:
          $ref: '#/components/schemas/Applicant'
```

---

## 2. Data Exchange Tests (Mock-to-Sandbox-to-Real)

### 2.1 Tujuan
Menguji end-to-end flow dengan tingkat realisme bertingkat: Mock → Sandbox → Production, untuk membuktikan data exchange yang akurat, traceable, dan reliable.

### 2.2 Level 1: Mocked National Platforms (Wajib)

#### 2.2.1 Business Scenario: Complete Application Lifecycle

**Flow Diagram:**
```
[Pelaku Usaha/OPD] → [JELITA UI] → [API Gateway/TS3] → [Registration Service]
                                         ↓
                                    [Workflow Service]
                                         ↓
                                    [OSS Adapter] → [OSS-RBA Mock]
                                         ↑
                           [Webhook Callback] ← [OSS-RBA Mock]
                                         ↓
                                    [Workflow Service] → [Archive Service]
                                         ↓
                                    [Notification]
```

**Detailed Steps:**

**Step 1: Permohonan Creation**
- Actor: Pelaku usaha/OPD
- Action: POST `/api/v1/permohonan`
- Payload:
  ```json
  {
    "jenis_izin": "UMKU",
    "pemohon": {
      "nama": "PT Contoh Teknologi",
      "nik": "3374012345670001",
      "email": "admin@contohtech.id"
    },
    "data_perizinan": {
      "bidang_usaha": "Teknologi Informasi",
      "skala_usaha": "MENENGAH"
    },
    "dokumen": [
      {"nama": "KTP", "url": "/uploads/ktp.pdf"},
      {"nama": "NPWP", "url": "/uploads/npwp.pdf"}
    ]
  }
  ```
- Expected: 201 Created, `permohonan_id` generated

**Step 2: Internal Validation**
- Service: Workflow Service
- Action: Validate kelengkapan dokumen, data pemohon
- Expected: Status = "MENUNGGU_VERIFIKASI"

**Step 3: Submit to OSS-RBA**
- Service: OSS Adapter
- Action: POST to OSS Mock `/oss/api/v1/applications`
- Mapped Payload:
  ```json
  {
    "license_type": "UMKU",
    "applicant": {
      "name": "PT Contoh Teknologi",
      "id_number": "3374012345670001"
    },
    "submitted_at": "2025-12-21T10:00:00Z",
    "idempotency_key": "idem-{uuid}"
  }
  ```
- Expected: 201 Created, `oss_reference_id` received

**Step 4: Mapping Storage**
- Service: Registration Service
- Action: Store mapping in database
  ```sql
  INSERT INTO external_references (permohonan_id, platform, reference_id, created_at)
  VALUES ('PRM-2025-001', 'OSS-RBA', 'OSS-20250001', NOW());
  ```
- Expected: Mapping persisted

**Step 5: OSS Callback (Status Update)**
- Source: OSS Mock (simulated after 5 seconds)
- Action: POST to TS3 `/api/webhooks/oss/status-update`
- Payload:
  ```json
  {
    "reference_id": "OSS-20250001",
    "status": "DISETUJUI",
    "updated_at": "2025-12-21T10:05:00Z",
    "approval_number": "IZIN-OSS-20250001",
    "signature": "sha256_signature"
  }
  ```
- Expected: Webhook verified, status updated

**Step 6: Internal Status Update**
- Service: Workflow Service
- Action: Update permohonan status → "DISETUJUI"
- Trigger: Archive Service untuk store dokumen izin

**Step 7: Artifact Issuance**
- Service: Archive Service
- Action: Generate dokumen izin (PDF)
- Store in archive dengan metadata:
  ```json
  {
    "permohonan_id": "PRM-2025-001",
    "jenis_dokumen": "IZIN_UMKU",
    "nomor_izin": "IZIN-OSS-20250001",
    "tanggal_terbit": "2025-12-21",
    "url": "/archives/izin-20250001.pdf"
  }
  ```

**Step 8: Notification**
- Service: Notification Service (via Workflow)
- Action: Email/SMS to pemohon
- Content: "Izin UMKU Anda telah disetujui dengan nomor IZIN-OSS-20250001"

---

#### 2.2.2 Data Integrity Checks

**DI-1: Identifier Mapping Consistency**
| Test | Verification | Expected |
|------|-------------|----------|
| Internal ID generated | `permohonan_id` = PRM-{year}-{seq} | ✅ Format valid |
| External ID stored | `oss_reference_id` exists in mapping table | ✅ Mapping exists |
| Bidirectional lookup | Query by internal → get external, vice versa | ✅ Both directions work |
| ID uniqueness | No duplicate `permohonan_id` or `oss_reference_id` | ✅ All unique |

**DI-2: Semantic Data Preservation**
| Field Category | JELITA Internal | OSS External | Verification |
|----------------|-----------------|--------------|--------------|
| Identitas Pemohon | nama, nik | name, id_number | ✅ No data loss |
| Jenis Izin | jenis_izin (enum) | license_type (enum) | ✅ Mapping correct |
| Waktu | tanggal_permohonan | submitted_at (ISO 8601) | ✅ Format converted |
| Dokumen | Array of {nama, url} | Array of {name, url, type} | ✅ Structure preserved |
| Status | status (internal enum) | status (external enum) | ✅ Semantic equivalent |

**DI-3: Traceability (Correlation ID)**
- Setiap request memiliki `correlation_id` = `corr-{uuid}`
- Propagate ke semua services:
  - JELITA → Registration: `X-Correlation-ID: corr-abc123`
  - Registration → Workflow: `X-Correlation-ID: corr-abc123`
  - Workflow → OSS Adapter: `X-Correlation-ID: corr-abc123`
  - OSS Callback → TS3: `X-Correlation-ID: corr-abc123` (returned)
- Audit log query: `SELECT * FROM audit_logs WHERE correlation_id = 'corr-abc123'`
- Expected: Complete trace from start to finish

**Example Audit Log:**
```
[2025-12-21T10:00:00Z] corr-abc123 | API_GATEWAY | POST /api/v1/permohonan | 201 | user=USR-001
[2025-12-21T10:00:01Z] corr-abc123 | REGISTRATION | createPermohonan | success | permohonan_id=PRM-2025-001
[2025-12-21T10:00:02Z] corr-abc123 | WORKFLOW | validatePermohonan | success | status=VALID
[2025-12-21T10:00:03Z] corr-abc123 | OSS_ADAPTER | submitToOSS | 201 | oss_ref=OSS-20250001
[2025-12-21T10:05:00Z] corr-abc123 | WEBHOOK | ossStatusUpdate | received | status=DISETUJUI
[2025-12-21T10:05:01Z] corr-abc123 | WORKFLOW | updateStatus | success | status=DISETUJUI
[2025-12-21T10:05:02Z] corr-abc123 | ARCHIVE | storeDocument | success | doc_id=DOC-001
[2025-12-21T10:05:03Z] corr-abc123 | NOTIFICATION | sendEmail | sent | recipient=admin@contohtech.id
```

---

#### 2.2.3 Test Scenarios (K6)

**Scenario A: Happy Path (Single User)**
- Duration: 1 iteration
- VUs: 1
- Steps: All 8 steps above
- Expected: 100% success, all data consistent

**Scenario B: Concurrent Submissions**
- Duration: 30s
- VUs: 10
- Rate: 2 req/s per VU (20 req/s total)
- Expected: No race conditions, all IDs unique, mappings correct

**Scenario C: Callback Delayed**
- Simulate OSS callback delay (30s - 5 minutes)
- Verify: Permohonan status remains "MENUNGGU_APPROVAL" until callback
- After callback: Status updated correctly

**Scenario D: Callback Failure & Retry**
- OSS callback fails (500 Internal Error)
- OSS retries after 60s
- Verify: Duplicate prevention (idempotency), status updated on retry

**Scenario E: Out-of-Order Callbacks**
- Callback 1: Status = "SEDANG_DIPROSES" (timestamp T1)
- Callback 2: Status = "DISETUJUI" (timestamp T2)
- Callback arrives: T2 before T1 (out of order)
- Verify: Final state = "DISETUJUI" (highest timestamp wins)

---

### 2.3 Level 2: Sandbox National Platforms (Opsional)

**Prerequisites:**
- Akses ke OSS Sandbox environment
- Credentials: API key, client_id, client_secret

**Differences from Mock:**
- Real authentication flow
- Real data validation by OSS
- Real response times
- Potential rate limiting

**Additional Test Cases:**
- **Rate Limiting**: Verify adapter respects OSS rate limits (e.g., 100 req/min)
- **Data Validation**: OSS may reject invalid NIK format → verify error handling
- **Timeout Handling**: OSS sandbox may be slower → verify timeout settings

---

### 2.4 Level 3: Production (Phased)

**Prerequisites:**
- Signed MoU with BKPM (OSS-RBA)
- Production credentials
- Data privacy compliance

**Pilot Approach:**
- Start dengan 1 OPD
- Submit real applications (pre-coordinated)
- Monitor closely for 1 week
- Gradual rollout to more OPDs

---

### 2.5 Expected Output (Paper)

#### Table 2: Data Exchange Test Results
| Scenario | Mock Pass | Sandbox Pass | Production Pass | Notes |
|----------|-----------|--------------|-----------------|-------|
| Happy Path | ✅ 100% | ✅ 98% | ⏳ Pending | Sandbox: 2% timeout |
| Concurrent | ✅ 100% | ✅ 95% | ⏳ Pending | Sandbox: rate limit hit |
| Delayed Callback | ✅ 100% | ✅ 100% | ⏳ Pending | Handled correctly |
| Callback Retry | ✅ 100% | N/A | N/A | Mock only |
| Out-of-Order | ✅ 100% | N/A | N/A | Mock only |

#### Figure 2: Correlation ID Trace
```
corr-abc123 traversal:
JELITA UI → API Gateway → Registration → Workflow → OSS Adapter → OSS Mock
            (10ms)        (15ms)         (20ms)       (50ms)        (100ms)
                                                                        ↓
                                                                    Callback
                                                                        ↓
            ← API Gateway ← Workflow ← Webhook Handler ← OSS Mock
              (5ms)         (10ms)      (8ms)
```

#### Table 3: Data Integrity Verification
| Check | Method | Result | Sample |
|-------|--------|--------|--------|
| ID Mapping | Database query | ✅ 100% consistent | PRM-2025-001 ↔ OSS-20250001 |
| Semantic Data | Field-by-field comparison | ✅ No data loss | nama = name, nik = id_number |
| Traceability | Audit log query | ✅ Complete trace | 8 log entries for 1 transaction |

---

## 3. SPBE Compliance Verification untuk API Gateway sebagai Integration Hub

### 3.1 Tujuan
Membuktikan kepatuhan sistem terhadap Arsitektur SPBE Nasional, khususnya peran API Gateway sebagai Integration Hub yang mengimplementasikan prinsip-prinsip Sistem Penghubung Layanan (SPL).

### 3.2 Alignment dengan Arsitektur SPBE

#### 3.2.1 Lapisan Integrasi (Integration Layer)
**Referensi:** Peraturan Presiden No. 95 Tahun 2018 tentang SPBE

TS3 (API Gateway) berada pada **Lapisan Integrasi**, berfungsi sebagai:
- **Service Gateway**: Single entry point untuk semua external services
- **Protocol Translator**: Transform berbagai protocol (REST, SOAP, messaging)
- **Security Enforcer**: Authentication, authorization, encryption
- **Audit Logger**: Capture semua transaksi untuk compliance

**Bukti Implementasi:**
- Arsitektur: API Gateway terpisah dari business logic services
- Konfigurasi: Nginx/Kong/Custom gateway dengan routing rules
- Code: Adapter pattern untuk setiap external platform (OSS, SPBE, SIMBG)

---

#### 3.2.2 SPL Characteristics

**A. Message Bus (vs Point-to-Point)**

**Current State:**
- ❌ Point-to-point: API Gateway → OSS Adapter (direct call)

**SPBE Requirement:**
- ✅ Message Bus: API Gateway → Message Broker → OSS Adapter

**Implementation:**
```
API Gateway publishes event: "application.submitted"
    ↓
Message Broker (RabbitMQ/Kafka)
    ↓
Subscribers:
  - OSS Adapter (process submission to OSS)
  - SPBE Audit Service (log to national audit)
  - Analytics Service (collect metrics)
```

**Bukti:**
- Deploy RabbitMQ/Kafka sebagai message broker
- API Gateway menggunakan event-driven architecture
- Loosely coupled: services tidak perlu tahu endpoint lain

**Test Case:**
- Publish event "application.submitted"
- Verify 3 subscribers receive event
- Verify order independence (async processing)

---

**B. Service Directory (Catalog)**

**Objektif:** Daftar semua services yang tersedia, versioning, owner, SLA

**Implementation:**
- Service Catalog Database (PostgreSQL)
- API: GET `/api/v1/service-directory`
- Response:
  ```json
  {
    "services": [
      {
        "name": "oss-adapter",
        "version": "1.0.0",
        "owner": "BKPM",
        "base_url": "https://api.oss.go.id",
        "endpoints": [
          {
            "path": "/api/v1/applications",
            "method": "POST",
            "description": "Submit application",
            "sla": {
              "max_response_time_ms": 5000,
              "availability_percent": 99.5
            }
          }
        ],
        "openapi_spec": "https://api.oss.go.id/openapi.json"
      },
      {
        "name": "spbe-audit-service",
        "version": "2.1.0",
        "owner": "Kominfo",
        "base_url": "https://audit.spbe.go.id",
        "endpoints": [...]
      }
    ]
  }
  ```

**Bukti:**
- Service catalog endpoint accessible
- Metadata complete (name, version, owner, SLA)
- Auto-discovery: services register themselves on startup

---

**C. Metadata Repository**

**Objektif:** Central repository untuk OpenAPI specs, JSON schemas, data dictionaries

**Implementation:**
- Storage: Git repository atau dedicated metadata DB
- Structure:
  ```
  metadata-repository/
    openapi/
      oss-adapter-v1.0.0.yaml
      spbe-audit-v2.1.0.yaml
    schemas/
      permohonan.schema.json
      disposisi.schema.json
    data-dictionaries/
      jenis-izin.csv
      status-permohonan.csv
  ```

**Bukti:**
- All schemas versioned
- API: GET `/api/v1/metadata/schemas/{service}/{version}`
- Consumers can download schema untuk local validation

---

### 3.3 Auditability

**Requirement:** Semua transaksi ke OSS/SPBE dicatat dengan detail lengkap

**Audit Log Schema:**
```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  correlation_id VARCHAR(64) NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  operation VARCHAR(100) NOT NULL,
  actor_id VARCHAR(64),
  actor_type VARCHAR(50), -- 'USER', 'SERVICE', 'SYSTEM'
  request_id VARCHAR(64),
  method VARCHAR(10),
  endpoint VARCHAR(500),
  request_payload JSONB,
  response_code INT,
  response_payload JSONB,
  duration_ms INT,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  INDEX idx_correlation_id (correlation_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_service_name (service_name),
  INDEX idx_actor_id (actor_id)
);
```

**Test Cases:**
- **TC3.1**: Submit permohonan → verify audit log created
- **TC3.2**: Query audit logs by correlation_id → verify complete trace
- **TC3.3**: Query audit logs by actor_id → verify all actions by user
- **TC3.4**: Verify PII redaction (password, token tidak tersimpan plain text)

**Retention Policy:**
- Audit logs retained for 5 years (compliance requirement)
- Archive to cold storage after 1 year

---

### 3.4 Security Controls

**SC-1: Token Lifecycle Management**

**Flow:**
1. API Gateway requests access token dari OSS auth server
2. Token stored in secure cache (Redis with encryption)
3. Token attached to every request (`Authorization: Bearer {token}`)
4. Token refreshed 5 minutes before expiry
5. Token revoked on logout atau security incident

**Test Cases:**
- Verify token acquisition
- Verify token refresh
- Verify token revocation
- Verify expired token rejected

**SC-2: Secret Rotation**

**Implementation:**
- Client secrets stored in HashiCorp Vault / AWS Secrets Manager
- Rotation schedule: every 90 days
- Zero-downtime rotation (both old and new secret valid during grace period)

**Test Case:**
- Rotate secret
- Verify old secret still works for 24 hours
- Verify new secret works immediately
- After 24 hours, old secret rejected

**SC-3: TLS/mTLS**

**Requirement:**
- All external communication over TLS 1.2+
- Mutual TLS (mTLS) untuk sensitive platforms

**Implementation:**
- API Gateway → OSS: TLS 1.3
- API Gateway → SPBE Audit: mTLS (both sides verify certificates)

**Test Cases:**
- Verify TLS version
- Verify certificate validity
- Verify mTLS handshake
- Reject self-signed certificates in production

---

### 3.5 Governance: API Versioning & Deprecation

**Versioning Strategy:**
- Semantic Versioning: v{major}.{minor}.{patch}
- Breaking changes → major version bump
- Backward-compatible additions → minor version bump
- Bug fixes → patch version bump

**Deprecation Policy:**
1. Announce deprecation 6 months in advance
2. Mark endpoint as deprecated in OpenAPI (`deprecated: true`)
3. Add deprecation header: `Deprecation: version=v1.0.0, sunset=2026-06-21`
4. Provide migration guide
5. After 6 months, return 410 Gone

**Example:**
```
GET /api/v1/permohonan (deprecated)
Response Headers:
  Deprecation: true
  Sunset: Sat, 21 Jun 2026 00:00:00 GMT
  Link: <https://docs.jelita.go.id/migration/v2>; rel="sunset"
```

**Test Cases:**
- Call deprecated endpoint → verify deprecation header
- After sunset date → verify 410 Gone

---

### 3.6 Expected Output (Paper)

#### Table 4: SPBE Interoperability Compliance Checklist

| Item | SPBE Requirement | Implementation | Evidence | Status |
|------|------------------|----------------|----------|--------|
| **Arsitektur** |
| Lapisan Integrasi | API Gateway sebagai integration hub | TS3 (API Gateway) dengan routing | Architecture diagram | ✅ |
| Message Bus | Event-driven, bukan point-to-point | RabbitMQ/Kafka message broker | Config file, test logs | ✅ |
| Loosely Coupled | Services independen | Services communicate via events | Service dependencies graph | ✅ |
| **Service Directory** |
| Service Catalog | Daftar semua services + metadata | `/api/v1/service-directory` endpoint | API response screenshot | ✅ |
| Auto-discovery | Services register otomatis | Service registration on startup | Registration logs | ✅ |
| SLA Declaration | Each service declares SLA | SLA in service metadata | Service catalog entry | ✅ |
| **Metadata Repository** |
| OpenAPI Specs | All APIs documented | OpenAPI YAML files in Git | File listing | ✅ |
| Versioning | Metadata versioned with API | Semantic versioning applied | Version tags | ✅ |
| Accessibility | Metadata downloadable | Metadata API endpoint | API response | ✅ |
| **Auditability** |
| Transaction Logs | All transactions logged | audit_logs table | Database schema | ✅ |
| Correlation ID | End-to-end traceability | X-Correlation-ID header propagated | Audit log trace | ✅ |
| Retention | 5 years retention | Configured in archive policy | Policy document | ✅ |
| PII Protection | Sensitive data redacted | Password/token not logged | Sample log entry | ✅ |
| **Security** |
| TLS | All external calls encrypted | TLS 1.3 configured | SSL cert verification | ✅ |
| mTLS | Mutual auth for sensitive platforms | mTLS to SPBE Audit | Certificate exchange | ✅ |
| Token Lifecycle | Secure token management | Token in encrypted cache | Cache config | ✅ |
| Secret Rotation | 90-day rotation | Vault integration | Rotation schedule | ✅ |
| **Governance** |
| Versioning | Semantic versioning | v{major}.{minor}.{patch} | API versions | ✅ |
| Deprecation Policy | 6-month notice | Deprecation header sent | API response header | ✅ |
| Migration Guide | Docs for deprecated APIs | Published at docs.jelita.go.id | Documentation link | ✅ |

---

#### Figure 3: Service Catalog Entry (Example)

```json
{
  "name": "oss-adapter",
  "version": "1.0.0",
  "owner": "BKPM",
  "description": "Adapter untuk integrasi dengan OSS-RBA Nasional",
  "base_url": "https://api.oss.go.id",
  "authentication": {
    "type": "OAuth2",
    "token_endpoint": "https://auth.oss.go.id/token"
  },
  "endpoints": [
    {
      "name": "SubmitApplication",
      "path": "/api/v1/applications",
      "method": "POST",
      "description": "Submit permohonan perizinan ke OSS-RBA",
      "sla": {
        "max_response_time_ms": 5000,
        "availability_percent": 99.5,
        "rate_limit": "100 req/min"
      },
      "request_schema": "$ref: /metadata/schemas/oss-adapter/submit-application-request.json",
      "response_schema": "$ref: /metadata/schemas/oss-adapter/submit-application-response.json"
    }
  ],
  "dependencies": [
    "message-broker",
    "audit-service"
  ],
  "status": "active",
  "last_updated": "2025-12-21T00:00:00Z"
}
```

---

#### Figure 4: Correlation ID Trace (Audit Log)

```
Query: SELECT * FROM audit_logs WHERE correlation_id = 'corr-abc123' ORDER BY timestamp;

+-----+-------------------------+-------------+------------------+-------------------------+
| id  | timestamp               | service     | operation        | request_id              |
+-----+-------------------------+-------------+------------------+-------------------------+
| 101 | 2025-12-21 10:00:00.000 | api-gateway | POST /permohonan | req-xyz789              |
| 102 | 2025-12-21 10:00:00.015 | registration| createPermohonan | req-xyz789              |
| 103 | 2025-12-21 10:00:00.035 | workflow    | validateData     | req-xyz789              |
| 104 | 2025-12-21 10:00:00.050 | oss-adapter | submitToOSS      | req-xyz789              |
| 105 | 2025-12-21 10:05:00.000 | api-gateway | POST /webhooks   | req-def456 (callback)   |
| 106 | 2025-12-21 10:05:00.008 | workflow    | updateStatus     | req-def456              |
| 107 | 2025-12-21 10:05:00.020 | archive     | storeDocument    | req-def456              |
| 108 | 2025-12-21 10:05:00.030 | notification| sendEmail        | req-def456              |
+-----+-------------------------+-------------+------------------+-------------------------+

Complete trace: 8 entries, 2 request chains (main flow + callback)
Total duration: 5 minutes 30 milliseconds
```

---

## 4. Test Execution Plan

### 4.1 Prerequisites

**Infrastructure:**
- Docker Compose dengan services: API Gateway, Registration, Workflow, Archive, OSS Mock, RabbitMQ, PostgreSQL
- K6 installed untuk load testing
- Postman/Newman untuk API testing (optional)

**Data:**
- Test users: 10 users dengan role berbeda (pelaku usaha, admin OPD, verifikator)
- Test permohonan: 100 sample permohonan dengan berbagai jenis izin
- OpenAPI specs: OSS-RBA, SPBE

### 4.2 Execution Sequence

**Phase 1: Contract/Conformance Testing (Day 1-2)**
1. Run TC1.1 - TC1.7 (schema, compatibility, error, idempotency, mapping, auth, retry)
2. Collect results, generate conformance report
3. Fix issues if any

**Phase 2: Data Exchange Testing - Mock (Day 3-5)**
1. Setup OSS Mock service with full contract implementation
2. Run Scenario A-E (happy path, concurrent, delayed callback, retry, out-of-order)
3. Verify data integrity (mapping, semantic, traceability)
4. Collect audit logs, generate trace reports

**Phase 3: SPBE Compliance Verification (Day 6-7)**
1. Setup message broker (RabbitMQ/Kafka)
2. Implement service directory + metadata repository
3. Verify auditability (audit logs complete)
4. Verify security controls (TLS, token lifecycle, secret rotation)
5. Document governance policies (versioning, deprecation)
6. Fill compliance checklist

**Phase 4: Sandbox Testing (Day 8-10, optional)**
1. Obtain sandbox credentials
2. Run subset of tests on sandbox
3. Compare results with mock
4. Document differences

**Phase 5: Reporting (Day 11-12)**
1. Compile all test results
2. Generate tables, figures untuk paper
3. Write test report (TESTING_RESULTS_INTEROPERABILITY.md)
4. Prepare presentation materials

### 4.3 Success Criteria

**Must-Have:**
- ✅ All contract conformance tests pass (100%)
- ✅ Data integrity verified (no data loss, mapping accurate)
- ✅ Complete audit trail (correlation ID traceable end-to-end)
- ✅ SPBE compliance checklist 100% filled with evidence

**Nice-to-Have:**
- ✅ Sandbox testing completed
- ✅ Performance benchmarks (response time, throughput)
- ✅ Automated CI/CD integration untuk regression testing

---

## 5. Tools & Technologies

| Category | Tool | Purpose |
|----------|------|---------|
| Load Testing | K6 | Contract testing, data exchange testing |
| API Testing | Postman/Newman | Manual testing, collection runner |
| Mock Server | Custom Node.js | OSS-RBA mock dengan callback simulation |
| Schema Validation | Ajv, OpenAPI Validator | JSON Schema validation |
| Message Broker | RabbitMQ atau Kafka | Event-driven architecture untuk SPL |
| Service Registry | Custom API atau Consul | Service directory implementation |
| Audit Logging | PostgreSQL + pgAudit | Centralized audit logs |
| Secret Management | HashiCorp Vault (dev mode) | Secret rotation simulation |
| Monitoring | Prometheus + Grafana | Metrics collection (optional) |

---

## 6. Deliverables untuk Paper/Tesis

1. **Bab Methodology**
   - Subsection: Interoperability Testing Strategy
   - Penjelasan 3 tingkat testing (Contract, Data Exchange, Compliance)

2. **Bab Results**
   - **Table 1**: Contract Conformance Results (7 test cases)
   - **Table 2**: Data Exchange Test Results (5 scenarios × 3 levels)
   - **Table 3**: Data Integrity Verification
   - **Table 4**: SPBE Compliance Checklist
   - **Figure 1**: OpenAPI Schema Excerpt
   - **Figure 2**: Correlation ID Trace Diagram
   - **Figure 3**: Service Catalog Entry
   - **Figure 4**: Audit Log Sample

3. **Lampiran**
   - Full OpenAPI specification untuk OSS-Adapter
   - Sample request/response payload
   - Complete audit log untuk 1 transaction
   - K6 test scripts (excerpt)
   - Service catalog JSON (full)

4. **Discussion Points**
   - Pentingnya contract testing untuk prevent integration failures
   - Traceability sebagai enabler compliance & debugging
   - SPBE compliance bukan hanya technical, tapi juga governance
   - Limitations: mock vs real (perbedaan timing, validation rules)

---

## 7. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OSS sandbox unavailable | Cannot do L2 testing | Medium | L1 mock sudah sufficient untuk proof-of-concept |
| Contract spec outdated | Validation fails | Medium | Periodic sync dengan BKPM untuk latest spec |
| Callback tidak diterima | Status stuck | Low | Implement polling fallback |
| Data privacy concern | Cannot use real data | High | Use synthetic data, anonymize PII |
| Time constraint | Cannot complete all tests | Medium | Prioritize L1 mock + compliance checklist |

---

## 8. Timeline (2 Minggu)

```
Week 1:
  Day 1-2: Contract Testing (TC1.1 - TC1.7)
  Day 3-5: Data Exchange Mock Testing (Scenario A-E)
  Day 6-7: SPBE Compliance Verification

Week 2:
  Day 8-10: Sandbox Testing (optional)
  Day 11-12: Reporting & Documentation
  Day 13-14: Review & Revision
```

---

## 9. References

1. Peraturan Presiden No. 95 Tahun 2018 tentang Sistem Pemerintahan Berbasis Elektronik (SPBE)
2. Arsitektur SPBE Nasional - Sistem Penghubung Layanan (SPL), Kementerian Kominfo
3. "Testing Microservices: Contract Testing, Integration Testing, and End-to-End Testing", Fowler, M. (2014)
4. "Building Microservices: Designing Fine-Grained Systems", Newman, S. (2021), O'Reilly
5. OpenAPI Specification 3.0, https://swagger.io/specification/
6. PACT Contract Testing, https://pact.io/
7. OSS-RBA API Documentation (jika available dari BKPM)

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-21  
**Author:** Interoperability Testing Team  
**Status:** Draft for Review
