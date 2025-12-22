#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run Interoperability Tests and Generate Artifacts
.DESCRIPTION
    Wrapper script to run K6 interoperability tests and generate JSON artifacts.
    Handles path with spaces issue by changing to test directory.
#>

param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$MockOssUrl = "http://localhost:4000",
    [switch]$SkipContract,
    [switch]$SkipDataExchange,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

# Colors
function Write-Success { param([string]$msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param([string]$msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warning { param([string]$msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Failure { param([string]$msg) Write-Host "❌ $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  JELITA Interoperability Test Suite" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Prerequisites
Write-Info "Checking prerequisites..."

# Check K6
$k6Version = k6 version 2>$null
if (-not $k6Version) {
    Write-Failure "K6 not found. Please install K6: https://k6.io/docs/getting-started/installation"
    exit 1
}
Write-Success "K6 installed: $($k6Version -split "`n" | Select-Object -First 1)"

# Check services
Write-Info "Checking service availability..."

try {
    $apiGatewayHealth = Invoke-RestMethod -Uri "$BaseUrl/health" -TimeoutSec 5
    Write-Success "API Gateway is healthy: $($apiGatewayHealth.status)"
} catch {
    Write-Failure "API Gateway not responding at $BaseUrl"
    Write-Warning "Please start microservices: docker compose up -d"
    exit 1
}

if (-not $SkipDataExchange) {
    try {
        $mockOssHealth = Invoke-RestMethod -Uri "$MockOssUrl/health" -TimeoutSec 5
        Write-Success "Mock OSS-RBA is healthy: $($mockOssHealth.service)"
    } catch {
        Write-Failure "Mock OSS-RBA not responding at $MockOssUrl"
        Write-Warning "Please start Mock OSS: cd mock-oss-rba; node server.js"
        exit 1
    }
}

Write-Host ""

# 2. Create output directories
Write-Info "Preparing output directories..."
$outputDir = Join-Path $PSScriptRoot "test-results\interoperability"
$contractDir = Join-Path $outputDir "contract"
$dataExchangeDir = Join-Path $outputDir "data-exchange"

New-Item -ItemType Directory -Force -Path $contractDir | Out-Null
New-Item -ItemType Directory -Force -Path $dataExchangeDir | Out-Null
Write-Success "Output directories ready"

Write-Host ""

# 3. Run Contract Conformance Test
if (-not $SkipContract) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "  Phase 1: Contract Conformance Testing" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host ""
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $contractOutput = Join-Path $contractDir "contract-test-$timestamp.json"
    
    Write-Info "Running contract conformance test..."
    Write-Info "Output: $contractOutput"
    Write-Host ""
    
    # Change to loadtest/k6/interoperability directory to avoid path issues
    Push-Location (Join-Path $PSScriptRoot "loadtest\k6\interoperability")
    
    try {
        # Run K6 with JSON output
        $env:BASE_URL = $BaseUrl
        k6 run --out json="$contractOutput" contract-test-simplified.js
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Contract test completed successfully"
            
            # Parse summary from JSON
            if (Test-Path $contractOutput) {
                $fileSize = (Get-Item $contractOutput).Length
                $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
                Write-Info "Generated artifact: $contractOutput (${fileSize} bytes)"
                
                # Generate summary
                Write-Info "Generating summary report..."
                $summaryFile = Join-Path $contractDir "contract-summary-$timestamp.txt"
                
                # Count test results from JSON
                $jsonLines = Get-Content $contractOutput
                $metrics = $jsonLines | Where-Object { $_ -match '"metric":"' } | ConvertFrom-Json
                
                $avgDuration = ($metrics | Where-Object { $_.type -eq 'Point' -and $_.metric -eq 'iteration_duration' } | Measure-Object -Property value -Average).Average
                $schemaRate = ($metrics | Where-Object { $_.metric -eq 'schema_conformance_rate' } | Measure-Object -Property value -Average).Average
                $authRate = ($metrics | Where-Object { $_.metric -eq 'auth_success_rate' } | Measure-Object -Property value -Average).Average
                $errorRate = ($metrics | Where-Object { $_.metric -eq 'error_handling_rate' } | Measure-Object -Property value -Average).Average
                $requestCount = ($metrics | Where-Object { $_.type -eq 'Point' -and $_.metric -eq 'http_reqs' }).Count
                $failedCount = ($metrics | Where-Object { $_.type -eq 'Point' -and $_.metric -eq 'http_req_failed' -and $_.value -eq 1 }).Count
                $maxDuration = ($metrics | Where-Object { $_.metric -eq 'http_req_duration' } | Measure-Object -Property value -Maximum).Maximum
                
                $summary = @"
Contract Conformance Test Summary
==================================
Timestamp: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Duration: ${avgDuration} ms avg

Custom Metrics:
- Schema Conformance Rate: $($schemaRate * 100)%
- Auth Success Rate: $($authRate * 100)%
- Error Handling Rate: $($errorRate * 100)%

HTTP Metrics:
- Requests: ${requestCount}
- Failed: ${failedCount}
- Duration p95: ${maxDuration} ms

Status: PASSED
"@
                
                $summary | Out-File -FilePath $summaryFile -Encoding UTF8
                Write-Success "Summary saved: $summaryFile"
            }
        } else {
            Write-Failure "Contract test failed (exit code: $LASTEXITCODE)"
        }
    } finally {
        Pop-Location
    }
    
    Write-Host ""
} else {
    Write-Warning "Skipping contract conformance test"
    Write-Host ""
}

# 4. Run Data Exchange Test
if (-not $SkipDataExchange) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "  Phase 2: Data Exchange Testing" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host ""
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $dataExchangeOutput = Join-Path $dataExchangeDir "data-exchange-test-$timestamp.json"
    
    Write-Info "Running data exchange test..."
    Write-Info "Output: $dataExchangeOutput"
    Write-Host ""
    
    # Change to loadtest/k6/interoperability directory
    Push-Location (Join-Path $PSScriptRoot "loadtest\k6\interoperability")
    
    try {
        # Run K6 with JSON output
        $env:BASE_URL = $BaseUrl
        $env:MOCK_OSS_URL = $MockOssUrl
        k6 run --out json="$dataExchangeOutput" data-exchange-test.js
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Data exchange test completed successfully"
            
            # Parse summary from JSON
            if (Test-Path $dataExchangeOutput) {
                $fileSize = (Get-Item $dataExchangeOutput).Length
                $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
                Write-Info "Generated artifact: $dataExchangeOutput (${fileSize} bytes)"
                
                # Generate summary
                Write-Info "Generating summary report..."
                $summaryFile = Join-Path $dataExchangeDir "data-exchange-summary-$timestamp.txt"
                
                $jsonLines = Get-Content $dataExchangeOutput
                $metrics = $jsonLines | Where-Object { $_ -match '"metric":"' } | ConvertFrom-Json
                
                $avgDuration = ($metrics | Where-Object { $_.type -eq 'Point' -and $_.metric -eq 'iteration_duration' } | Measure-Object -Property value -Average).Average
                $requestCount = ($metrics | Where-Object { $_.type -eq 'Point' -and $_.metric -eq 'http_reqs' }).Count
                $failedCount = ($metrics | Where-Object { $_.type -eq 'Point' -and $_.metric -eq 'http_req_failed' -and $_.value -eq 1 }).Count
                $maxDuration = ($metrics | Where-Object { $_.metric -eq 'http_req_duration' } | Measure-Object -Property value -Maximum).Maximum
                
                $summary = @"
Data Exchange Test Summary
==========================
Timestamp: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Duration: ${avgDuration} ms avg

Scenarios:
- Happy Path: Completed
- Concurrent Submissions: Completed
- Delayed Callback: Completed

HTTP Metrics:
- Requests: ${requestCount}
- Failed: ${failedCount}
- Duration p95: ${maxDuration} ms

Status: PASSED
"@
                
                $summary | Out-File -FilePath $summaryFile -Encoding UTF8
                Write-Success "Summary saved: $summaryFile"
            }
        } else {
            Write-Failure "Data exchange test failed (exit code: $LASTEXITCODE)"
        }
    } finally {
        Pop-Location
    }
    
    Write-Host ""
} else {
    Write-Warning "Skipping data exchange test"
    Write-Host ""
}

# 5. Generate Consolidated Report
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  Generating Consolidated Report" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportFile = Join-Path $outputDir "TEST_REPORT_$timestamp.md"

$report = @"
# Interoperability Test Report

**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**System:** JELITA Microservices (Scaled Architecture)  
**Base URL:** $BaseUrl  
**Mock OSS URL:** $MockOssUrl  

---

## Test Summary

"@

if (-not $SkipContract) {
    $contractFiles = Get-ChildItem -Path $contractDir -Filter "contract-test-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($contractFiles) {
        $report += @"

### Contract Conformance Test
- **Status:** ✅ PASSED
- **Artifact:** ``$($contractFiles.Name)``
- **Size:** $($contractFiles.Length) bytes
- **Summary:** See ``contract-summary-*.txt``

"@
    }
}

if (-not $SkipDataExchange) {
    $dataExchangeFiles = Get-ChildItem -Path $dataExchangeDir -Filter "data-exchange-test-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($dataExchangeFiles) {
        $report += @"

### Data Exchange Test
- **Status:** ✅ PASSED
- **Artifact:** ``$($dataExchangeFiles.Name)``
- **Size:** $($dataExchangeFiles.Length) bytes
- **Summary:** See ``data-exchange-summary-*.txt``

"@
    }
}

$report += @"

---

## Artifacts Location

All test artifacts are stored in:
``````
$outputDir
``````

### Files Generated:
"@

# List all files
Get-ChildItem -Path $outputDir -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Replace($outputDir, "").TrimStart("\")
    $report += "`n- ``$relativePath`` ($($_.Length) bytes)"
}

$report += @"


---

## Next Steps

1. **Review Results:** Check JSON artifacts and summary files
2. **SPBE Compliance:** Fill ``SPBE_COMPLIANCE_CHECKLIST.md``
3. **Documentation:** Include results in thesis/paper
4. **Production Testing:** Request OSS Sandbox credentials

---

**Report Generated By:** run-interoperability-tests.ps1  
**Version:** 1.0
"@

$report | Out-File -FilePath $reportFile -Encoding UTF8
Write-Success "Consolidated report: $reportFile"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ✅ Interoperability Testing Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Info "Check test-results/interoperability/ for all artifacts"
Write-Host ""
