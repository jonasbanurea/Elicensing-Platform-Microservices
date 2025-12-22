# Scale-Out Test Runner
# Runs stress test on scaled-out microservices and compares with single-instance

$ErrorActionPreference = "Stop"

Write-Host "=== JELITA SCALE-OUT TEST ===" -ForegroundColor Cyan
Write-Host ""

# Check if scaled-out stack is running
Write-Host "[1/5] Verifying scaled-out stack..." -ForegroundColor Yellow
$containers = docker compose -f docker-compose.scaleout.yml ps --format json | ConvertFrom-Json
$runningCount = ($containers | Where-Object { $_.State -eq "running" -or $_.Health -eq "healthy" }).Count

if ($runningCount -lt 11) {
    Write-Host "❌ Not all containers running. Found $runningCount, expected 11+" -ForegroundColor Red
    Write-Host "Starting scaled-out stack..." -ForegroundColor Yellow
    docker compose -f docker-compose.scaleout.yml up -d --wait
}

Write-Host "✅ Scaled-out stack running ($runningCount containers)" -ForegroundColor Green
docker compose -f docker-compose.scaleout.yml ps

# Health check
Write-Host ""
Write-Host "[2/5] Health check..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/health" -TimeoutSec 10
    Write-Host "✅ Gateway: $health" -ForegroundColor Green
} catch {
    Write-Host "❌ Gateway health check failed: $_" -ForegroundColor Red
    exit 1
}

# Test auth
Write-Host ""
Write-Host "[3/5] Testing authentication..." -ForegroundColor Yellow
$body = @{username="pemohon1"; password="password123"} | ConvertTo-Json
try {
    $authRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/signin" -Method POST -Body $body -ContentType "application/json"
    $token = $authRes.data.accessToken
    Write-Host "✅ Auth successful (token: $($token.Substring(0, 20))...)" -ForegroundColor Green
} catch {
    Write-Host "❌ Auth failed: $_" -ForegroundColor Red
    exit 1
}

# Run stress test
Write-Host ""
Write-Host "[4/5] Running STRESS TEST (75 VUs, 8 minutes)..." -ForegroundColor Yellow
Write-Host "This will take approximately 8-9 minutes..." -ForegroundColor Gray

$date = Get-Date -Format "yyyy-MM-dd"
$env:BASE_URL = "http://localhost:8080"
$env:SUT = "microservices-scaled"
$env:TEST_DATE = $date
$env:SCENARIO = "stress"
$env:RESULTS_DIR = "test-results/$date/microservices-scaled/stress"

$startTime = Get-Date
npm run test:stress
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "✅ Test completed in $($duration.TotalMinutes.ToString('0.0')) minutes" -ForegroundColor Green

# Extract metrics
Write-Host ""
Write-Host "[5/5] Comparing results..." -ForegroundColor Yellow

$summaryPath = "test-results/$date/microservices-scaled/stress/summary.txt"
if (!(Test-Path $summaryPath)) {
    Write-Host "❌ Summary file not found: $summaryPath" -ForegroundColor Red
    exit 1
}

$summary = Get-Content $summaryPath -Raw

# Parse metrics
function Extract-Metric {
    param($text, $pattern)
    if ($text -match $pattern) {
        return $Matches[1]
    }
    return "N/A"
}

Write-Host ""
Write-Host "=== SCALE-OUT TEST RESULTS ===" -ForegroundColor Cyan

# Iterations
$iterations = Extract-Metric $summary 'iterations\.*:\s+(\d+)\s+'
$iterRate = Extract-Metric $summary 'iterations\.*:.*?(\d+\.\d+)/s'
Write-Host "Iterations: $iterations (rate: $iterRate/s)" -ForegroundColor White

# HTTP requests
$httpReqs = Extract-Metric $summary 'http_reqs\.*:\s+(\d+)\s+'
$reqRate = Extract-Metric $summary 'http_reqs\.*:.*?(\d+\.\d+)/s'
Write-Host "HTTP Requests: $httpReqs (rate: $reqRate/s)" -ForegroundColor White

# Checks
$checks = Extract-Metric $summary 'checks\.*:\s+([\d.]+%)'
Write-Host "Checks Passed: $checks" -ForegroundColor Green

# Error rate
$errorRate = Extract-Metric $summary 'http_req_failed\.*:\s+([\d.]+%)'
Write-Host "Error Rate: $errorRate" -ForegroundColor $(if ($errorRate -eq "0.00%") { "Green" } else { "Yellow" })

Write-Host ""
Write-Host "=== LATENCY METRICS ===" -ForegroundColor Cyan

# Overall HTTP duration
Write-Host "HTTP Request Duration:" -ForegroundColor White
$httpAvg = Extract-Metric $summary 'http_req_duration\.*:\s+avg=([\d.]+\w+)'
$httpP95 = Extract-Metric $summary 'http_req_duration\.*:.*?p\(95\)=([\d.]+\w+)'
$httpP99 = Extract-Metric $summary 'http_req_duration\.*:.*?p\(99\)=([\d.]+\w+)'
Write-Host "  avg: $httpAvg | p95: $httpP95 | p99: $httpP99"

# Auth latency
Write-Host "Auth Latency:" -ForegroundColor White
$authAvg = Extract-Metric $summary 'auth_latency\.*:\s+avg=([\d.]+\w+)'
$authP95 = Extract-Metric $summary 'auth_latency\.*:.*?p\(95\)=([\d.]+\w+)'
Write-Host "  avg: $authAvg | p95: $authP95"

# Permohonan latency
Write-Host "Permohonan Latency:" -ForegroundColor White
$permAvg = Extract-Metric $summary 'permohonan_latency\.*:\s+avg=([\d.]+\w+)'
$permP95 = Extract-Metric $summary 'permohonan_latency\.*:.*?p\(95\)=([\d.]+\w+)'
Write-Host "  avg: $permAvg | p95: $permP95"

# Workflow latency
Write-Host "Workflow Latency:" -ForegroundColor White
$wfAvg = Extract-Metric $summary 'workflow_latency\.*:\s+avg=([\d.]+\w+)'
$wfP95 = Extract-Metric $summary 'workflow_latency\.*:.*?p\(95\)=([\d.]+\w+)'
Write-Host "  avg: $wfAvg | p95: $wfP95"

# Survey latency
Write-Host "Survey Latency:" -ForegroundColor White
$surveyAvg = Extract-Metric $summary 'survey_latency\.*:\s+avg=([\d.]+\w+)'
$surveyP95 = Extract-Metric $summary 'survey_latency\.*:.*?p\(95\)=([\d.]+\w+)'
Write-Host "  avg: $surveyAvg | p95: $surveyP95"

Write-Host ""
Write-Host "=== COMPARISON WITH SINGLE-INSTANCE ===" -ForegroundColor Cyan

# Load single-instance baseline (avg dari 3 runs)
$singleP95 = 2397  # ms
$singleIter = 3025
$singlePermP95 = 3097
$singleWfP95 = 2597

# Parse scaled-out metrics (remove 'ms' and convert to number)
function Parse-Ms {
    param($value)
    if ($value -match '([\d.]+)') {
        return [double]$Matches[1]
    }
    return 0
}

$scaledP95 = Parse-Ms $httpP95
$scaledIter = [int]$iterations
$scaledPermP95 = Parse-Ms $permP95
$scaledWfP95 = Parse-Ms $wfP95

Write-Host "Overall HTTP p95:" -ForegroundColor White
Write-Host "  Single-instance: 2,397 ms"
Write-Host "  Scaled-out: $httpP95"
if ($scaledP95 -gt 0) {
    $improvement = [math]::Round((($singleP95 - $scaledP95) / $singleP95) * 100, 1)
    $color = if ($improvement -gt 0) { "Green" } else { "Red" }
    Write-Host "  Improvement: $improvement%" -ForegroundColor $color
}

Write-Host ""
Write-Host "Permohonan p95:" -ForegroundColor White
Write-Host "  Single-instance: 3,097 ms"
Write-Host "  Scaled-out: $permP95"
if ($scaledPermP95 -gt 0) {
    $improvement = [math]::Round((($singlePermP95 - $scaledPermP95) / $singlePermP95) * 100, 1)
    $color = if ($improvement -gt 0) { "Green" } else { "Red" }
    Write-Host "  Improvement: $improvement%" -ForegroundColor $color
}

Write-Host ""
Write-Host "Workflow p95:" -ForegroundColor White
Write-Host "  Single-instance: 2,597 ms"
Write-Host "  Scaled-out: $wfP95"
if ($scaledWfP95 -gt 0) {
    $improvement = [math]::Round((($singleWfP95 - $scaledWfP95) / $singleWfP95) * 100, 1)
    $color = if ($improvement -gt 0) { "Green" } else { "Red" }
    Write-Host "  Improvement: $improvement%" -ForegroundColor $color
}

Write-Host ""
Write-Host "Throughput (iterations):" -ForegroundColor White
Write-Host "  Single-instance: 3,025 iterations"
Write-Host "  Scaled-out: $iterations"
if ($scaledIter -gt 0) {
    $improvement = [math]::Round((($scaledIter - $singleIter) / $singleIter) * 100, 1)
    $color = if ($improvement -gt 0) { "Green" } else { "Red" }
    Write-Host "  Improvement: $improvement%" -ForegroundColor $color
}

Write-Host ""
Write-Host "=== SUCCESS CRITERIA ===" -ForegroundColor Cyan
if ($scaledP95 -gt 0) {
    if ($scaledP95 -lt 1500) {
        Write-Host "✅ EXCELLENT: p95 < 1,500ms (better than monolith 1,743ms)" -ForegroundColor Green
    } elseif ($scaledP95 -lt 1800) {
        Write-Host "✅ PASS: p95 < 1,800ms (competitive with monolith)" -ForegroundColor Green
    } elseif ($scaledP95 -lt 2000) {
        Write-Host "⚠️  MARGINAL: p95 < 2,000ms (some improvement)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ FAIL: p95 > 2,000ms (bottleneck persists)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Full results saved to: $summaryPath" -ForegroundColor Gray
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
