# Extract statistics for Microservices Scale-Out testing
# 10 runs baseline (35 VUs) + 10 runs stress (75 VUs)

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "MICROSERVICES SCALE-OUT STATISTICS EXTRACTION" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# ============ BASELINE (35 VUs) ============
Write-Host "`n[1/2] Extracting BASELINE data..." -ForegroundColor Yellow
$baselineResults = @()

for ($i = 1; $i -le 10; $i++) {
    $r = "r{0:D2}" -f $i
    $path = "test-results\2025-12-31-$r\microservices-scaled\baseline\summary-export.json"
    
    if (Test-Path $path) {
        $json = Get-Content $path -Raw | ConvertFrom-Json
        $throughput = [math]::Round($json.metrics.http_reqs.rate, 2)
        $p95 = [math]::Round($json.metrics.http_req_duration.'p(95)', 2)
        $p99 = [math]::Round($json.metrics.http_req_duration.'p(99)', 2)
        
        $baselineResults += [PSCustomObject]@{
            Run = $r
            Throughput = $throughput
            P95 = $p95
            P99 = $p99
        }
    }
}

Write-Host "`nBaseline Raw Data:" -ForegroundColor Green
$baselineResults | Format-Table -AutoSize

# Calculate statistics
$meanThroughput = ($baselineResults.Throughput | Measure-Object -Average).Average
$sdThroughput = [math]::Sqrt((($baselineResults.Throughput | ForEach-Object { [math]::Pow($_ - $meanThroughput, 2) }) | Measure-Object -Sum).Sum / ($baselineResults.Count - 1))
$cvThroughput = ($sdThroughput / $meanThroughput) * 100
$minThroughput = ($baselineResults.Throughput | Measure-Object -Minimum).Minimum
$maxThroughput = ($baselineResults.Throughput | Measure-Object -Maximum).Maximum
$ciThroughput = 2.262 * $sdThroughput / [math]::Sqrt($baselineResults.Count)

$meanP95 = ($baselineResults.P95 | Measure-Object -Average).Average
$sdP95 = [math]::Sqrt((($baselineResults.P95 | ForEach-Object { [math]::Pow($_ - $meanP95, 2) }) | Measure-Object -Sum).Sum / ($baselineResults.Count - 1))
$cvP95 = ($sdP95 / $meanP95) * 100
$minP95 = ($baselineResults.P95 | Measure-Object -Minimum).Minimum
$maxP95 = ($baselineResults.P95 | Measure-Object -Maximum).Maximum
$ciP95 = 2.262 * $sdP95 / [math]::Sqrt($baselineResults.Count)

$meanP99 = ($baselineResults.P99 | Measure-Object -Average).Average
$sdP99 = [math]::Sqrt((($baselineResults.P99 | ForEach-Object { [math]::Pow($_ - $meanP99, 2) }) | Measure-Object -Sum).Sum / ($baselineResults.Count - 1))
$cvP99 = ($sdP99 / $meanP99) * 100
$minP99 = ($baselineResults.P99 | Measure-Object -Minimum).Minimum
$maxP99 = ($baselineResults.P99 | Measure-Object -Maximum).Maximum
$ciP99 = 2.262 * $sdP99 / [math]::Sqrt($baselineResults.Count)

Write-Host "`n=== BASELINE STATISTICS ===" -ForegroundColor Cyan
Write-Host "Throughput:"
Write-Host "  Mean ± SD: $([math]::Round($meanThroughput, 2)) ± $([math]::Round($sdThroughput, 2)) req/s"
Write-Host "  95% CI: [$([math]::Round($meanThroughput - $ciThroughput, 2)), $([math]::Round($meanThroughput + $ciThroughput, 2))]"
Write-Host "  CV: $([math]::Round($cvThroughput, 1))%"
Write-Host "  Min: $([math]::Round($minThroughput, 2)), Max: $([math]::Round($maxThroughput, 2))"

Write-Host "`nP95 Latency:"
Write-Host "  Mean ± SD: $([math]::Round($meanP95, 2)) ± $([math]::Round($sdP95, 2)) ms"
Write-Host "  95% CI: [$([math]::Round($meanP95 - $ciP95, 2)), $([math]::Round($meanP95 + $ciP95, 2))]"
Write-Host "  CV: $([math]::Round($cvP95, 1))%"
Write-Host "  Min: $([math]::Round($minP95, 2)), Max: $([math]::Round($maxP95, 2))"

Write-Host "`nP99 Latency:"
Write-Host "  Mean ± SD: $([math]::Round($meanP99, 2)) ± $([math]::Round($sdP99, 2)) ms"
Write-Host "  95% CI: [$([math]::Round($meanP99 - $ciP99, 2)), $([math]::Round($meanP99 + $ciP99, 2))]"
Write-Host "  CV: $([math]::Round($cvP99, 1))%"
Write-Host "  Min: $([math]::Round($minP99, 2)), Max: $([math]::Round($maxP99, 2))"

# ============ STRESS (75 VUs) ============
Write-Host "`n[2/2] Extracting STRESS data..." -ForegroundColor Yellow
$stressResults = @()

for ($i = 1; $i -le 10; $i++) {
    $r = "r{0:D2}" -f $i
    $path = "test-results\2025-12-31-$r\microservices-scaled\stress\summary-export.json"
    
    if (Test-Path $path) {
        $json = Get-Content $path -Raw | ConvertFrom-Json
        $throughput = [math]::Round($json.metrics.http_reqs.rate, 2)
        $p95 = [math]::Round($json.metrics.http_req_duration.'p(95)', 2)
        $p99 = [math]::Round($json.metrics.http_req_duration.'p(99)', 2)
        
        $stressResults += [PSCustomObject]@{
            Run = $r
            Throughput = $throughput
            P95 = $p95
            P99 = $p99
        }
    }
}

Write-Host "`nStress Raw Data:" -ForegroundColor Green
$stressResults | Format-Table -AutoSize

# Calculate statistics
$meanThroughputS = ($stressResults.Throughput | Measure-Object -Average).Average
$sdThroughputS = [math]::Sqrt((($stressResults.Throughput | ForEach-Object { [math]::Pow($_ - $meanThroughputS, 2) }) | Measure-Object -Sum).Sum / ($stressResults.Count - 1))
$cvThroughputS = ($sdThroughputS / $meanThroughputS) * 100
$minThroughputS = ($stressResults.Throughput | Measure-Object -Minimum).Minimum
$maxThroughputS = ($stressResults.Throughput | Measure-Object -Maximum).Maximum
$ciThroughputS = 2.262 * $sdThroughputS / [math]::Sqrt($stressResults.Count)

$meanP95S = ($stressResults.P95 | Measure-Object -Average).Average
$sdP95S = [math]::Sqrt((($stressResults.P95 | ForEach-Object { [math]::Pow($_ - $meanP95S, 2) }) | Measure-Object -Sum).Sum / ($stressResults.Count - 1))
$cvP95S = ($sdP95S / $meanP95S) * 100
$minP95S = ($stressResults.P95 | Measure-Object -Minimum).Minimum
$maxP95S = ($stressResults.P95 | Measure-Object -Maximum).Maximum
$ciP95S = 2.262 * $sdP95S / [math]::Sqrt($stressResults.Count)

$meanP99S = ($stressResults.P99 | Measure-Object -Average).Average
$sdP99S = [math]::Sqrt((($stressResults.P99 | ForEach-Object { [math]::Pow($_ - $meanP99S, 2) }) | Measure-Object -Sum).Sum / ($stressResults.Count - 1))
$cvP99S = ($sdP99S / $meanP99S) * 100
$minP99S = ($stressResults.P99 | Measure-Object -Minimum).Minimum
$maxP99S = ($stressResults.P99 | Measure-Object -Maximum).Maximum
$ciP99S = 2.262 * $sdP99S / [math]::Sqrt($stressResults.Count)

Write-Host "`n=== STRESS STATISTICS ===" -ForegroundColor Cyan
Write-Host "Throughput:"
Write-Host "  Mean ± SD: $([math]::Round($meanThroughputS, 2)) ± $([math]::Round($sdThroughputS, 2)) req/s"
Write-Host "  95% CI: [$([math]::Round($meanThroughputS - $ciThroughputS, 2)), $([math]::Round($meanThroughputS + $ciThroughputS, 2))]"
Write-Host "  CV: $([math]::Round($cvThroughputS, 1))%"
Write-Host "  Min: $([math]::Round($minThroughputS, 2)), Max: $([math]::Round($maxThroughputS, 2))"

Write-Host "`nP95 Latency:"
Write-Host "  Mean ± SD: $([math]::Round($meanP95S, 2)) ± $([math]::Round($sdP95S, 2)) ms"
Write-Host "  95% CI: [$([math]::Round($meanP95S - $ciP95S, 2)), $([math]::Round($meanP95S + $ciP95S, 2))]"
Write-Host "  CV: $([math]::Round($cvP95S, 1))%"
Write-Host "  Min: $([math]::Round($minP95S, 2)), Max: $([math]::Round($maxP95S, 2))"

Write-Host "`nP99 Latency:"
Write-Host "  Mean ± SD: $([math]::Round($meanP99S, 2)) ± $([math]::Round($sdP99S, 2)) ms"
Write-Host "  95% CI: [$([math]::Round($meanP99S - $ciP99S, 2)), $([math]::Round($meanP99S + $ciP99S, 2))]"
Write-Host "  CV: $([math]::Round($cvP99S, 1))%"
Write-Host "  Min: $([math]::Round($minP99S, 2)), Max: $([math]::Round($maxP99S, 2))"

# ============ COMPARISON ============
Write-Host "`n=== BASELINE vs STRESS COMPARISON ===" -ForegroundColor Cyan
$vusRatio = 75.0 / 35.0
$p95Degradation = $meanP95S / $meanP95
$p99Degradation = $meanP99S / $meanP99
$throughputScaling = $meanThroughputS / $meanThroughput
$scalingEfficiency = ($throughputScaling / $vusRatio) * 100

Write-Host "VUs: 35 → 75 ($(([math]::Round($vusRatio, 2)))×)"
Write-Host "Throughput: $([math]::Round($meanThroughput, 2)) → $([math]::Round($meanThroughputS, 2)) req/s ($(([math]::Round($throughputScaling, 2)))× scaling)"
Write-Host "Scaling Efficiency: $([math]::Round($scalingEfficiency, 1))%"
Write-Host "P95: $([math]::Round($meanP95, 2)) → $([math]::Round($meanP95S, 2)) ms ($(([math]::Round($p95Degradation, 2)))× degradation)"
Write-Host "P99: $([math]::Round($meanP99, 2)) → $([math]::Round($meanP99S, 2)) ms ($(([math]::Round($p99Degradation, 2)))× degradation)"

Write-Host "`n===========================================" -ForegroundColor Green
Write-Host "EXTRACTION COMPLETE" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
