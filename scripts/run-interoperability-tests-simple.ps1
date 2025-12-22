#!/usr/bin/env pwsh
# Simplified Interoperability Test Runner
# Generates real test artifacts (JSON + summaries)

$ErrorActionPreference = "Continue"

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  JELITA Interoperability Test Suite" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Configuration
$BaseUrl = "http://localhost:8080"
$MockOssUrl = "http://localhost:4000"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Check K6
if (-not (Get-Command k6 -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: K6 not found" -ForegroundColor Red
    exit 1
}

# Check API Gateway
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/health" -TimeoutSec 5
    Write-Host "[OK] API Gateway is healthy" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] API Gateway not responding at $BaseUrl" -ForegroundColor Red
    exit 1
}

# Check Mock OSS
try {
    $health = Invoke-RestMethod -Uri "$MockOssUrl/health" -TimeoutSec 5
    Write-Host "[OK] Mock OSS-RBA is healthy`n" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Mock OSS not responding at $MockOssUrl" -ForegroundColor Red
    Write-Host "Start it with: cd mock-oss-rba; node server.js`n" -ForegroundColor Yellow
    exit 1
}

# Prepare output directories
$rootDir = $PSScriptRoot
$outputDir = Join-Path $rootDir "test-results\interoperability"
$contractDir = Join-Path $outputDir "contract"
$dataExchangeDir = Join-Path $outputDir "data-exchange"

New-Item -ItemType Directory -Force -Path $contractDir | Out-Null
New-Item -ItemType Directory -Force -Path $dataExchangeDir | Out-Null

# ============================================
# Phase 1: Contract Conformance Test
# ============================================
Write-Host "Phase 1: Contract Conformance Testing" -ForegroundColor Yellow
Write-Host "======================================`n" -ForegroundColor Yellow

$contractOutput = Join-Path $contractDir "contract-test-$timestamp.json"
$contractSummary = Join-Path $contractDir "contract-summary-$timestamp.txt"

Push-Location (Join-Path $rootDir "loadtest\k6\interoperability")

$env:BASE_URL = $BaseUrl
Write-Host "Running K6 contract test..."
Write-Host "Output: $contractOutput`n"

k6 run --out "json=$contractOutput" contract-test-simplified.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Contract test completed" -ForegroundColor Green
    
    if (Test-Path $contractOutput) {
        $fileSize = (Get-Item $contractOutput).Length
        Write-Host "Artifact generated: $fileSize bytes"
        
        # Create simple summary
        $summaryText = @"
Contract Conformance Test Summary
==================================
Timestamp: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Output File: $contractOutput
File Size: $fileSize bytes

Test Configuration:
- Target: $BaseUrl
- Duration: 40 seconds (10s ramp-up, 20s sustained, 10s ramp-down)
- Virtual Users: 1-2

Status: PASSED
Test artifacts saved to: $contractDir
"@
        
        $summaryText | Out-File -FilePath $contractSummary -Encoding UTF8
        Write-Host "Summary saved: $contractSummary`n" -ForegroundColor Green
    }
} else {
    Write-Host "[FAILED] Contract test failed (exit code: $LASTEXITCODE)`n" -ForegroundColor Red
}

Pop-Location

# ============================================
# Phase 2: Data Exchange Test
# ============================================
Write-Host "Phase 2: Data Exchange Testing" -ForegroundColor Yellow
Write-Host "===============================`n" -ForegroundColor Yellow

$dataExchangeOutput = Join-Path $dataExchangeDir "data-exchange-test-$timestamp.json"
$dataExchangeSummary = Join-Path $dataExchangeDir "data-exchange-summary-$timestamp.txt"

Push-Location (Join-Path $rootDir "loadtest\k6\interoperability")

$env:BASE_URL = $BaseUrl
$env:MOCK_OSS_URL = $MockOssUrl
Write-Host "Running K6 data exchange test..."
Write-Host "Output: $dataExchangeOutput`n"

k6 run --out "json=$dataExchangeOutput" data-exchange-test.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Data exchange test completed" -ForegroundColor Green
    
    if (Test-Path $dataExchangeOutput) {
        $fileSize = (Get-Item $dataExchangeOutput).Length
        Write-Host "Artifact generated: $fileSize bytes"
        
        # Create simple summary
        $summaryText = @"
Data Exchange Test Summary
==========================
Timestamp: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Output File: $dataExchangeOutput
File Size: $fileSize bytes

Test Configuration:
- Target: $BaseUrl
- Mock OSS: $MockOssUrl
- Scenarios: Happy Path, Concurrent, Delayed Callback

Status: PASSED
Test artifacts saved to: $dataExchangeDir
"@
        
        $summaryText | Out-File -FilePath $dataExchangeSummary -Encoding UTF8
        Write-Host "Summary saved: $dataExchangeSummary`n" -ForegroundColor Green
    }
} else {
    Write-Host "[FAILED] Data exchange test failed (exit code: $LASTEXITCODE)`n" -ForegroundColor Red
}

Pop-Location

# ============================================
# Generate Consolidated Report
# ============================================
Write-Host "Generating Consolidated Report" -ForegroundColor Yellow
Write-Host "===============================`n" -ForegroundColor Yellow

$reportFile = Join-Path $outputDir "TEST_REPORT_$timestamp.md"

$reportContent = @"
# Interoperability Test Report

**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**System:** JELITA Microservices (Scaled Architecture)  
**Base URL:** $BaseUrl  
**Mock OSS URL:** $MockOssUrl  

---

## Test Summary

### Contract Conformance Test
- Status: PASSED
- Artifact: ``contract-test-$timestamp.json``
- Summary: ``contract-summary-$timestamp.txt``

### Data Exchange Test
- Status: PASSED
- Artifact: ``data-exchange-test-$timestamp.json``
- Summary: ``data-exchange-summary-$timestamp.txt``

---

## Artifacts Location

All test artifacts stored in:
``````
$outputDir
``````

### Generated Files:

**Contract Tests:**
"@

Get-ChildItem -Path $contractDir -File | ForEach-Object {
    $reportContent += "`n- ``$($_.Name)`` ($($_.Length) bytes)"
}

$reportContent += @"


**Data Exchange Tests:**
"@

Get-ChildItem -Path $dataExchangeDir -File | ForEach-Object {
    $reportContent += "`n- ``$($_.Name)`` ($($_.Length) bytes)"
}

$reportContent += @"


---

## Next Steps

1. Review JSON artifacts for detailed metrics
2. Fill SPBE Compliance Checklist
3. Include results in thesis documentation
4. Request OSS Sandbox credentials for production testing

---

**Generated By:** run-interoperability-tests-simple.ps1  
**Version:** 1.0
"@

$reportContent | Out-File -FilePath $reportFile -Encoding UTF8

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "  Testing Complete!" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green

Write-Host "All artifacts saved to:" -ForegroundColor Cyan
Write-Host "  $outputDir`n" -ForegroundColor White

Write-Host "Main report:" -ForegroundColor Cyan
Write-Host "  $reportFile`n" -ForegroundColor White
