# Analyze stress test results from 30 JSON files
$results = @()
$testFiles = Get-ChildItem -Path "test-results\*.json" | Sort-Object Name

Write-Host "Analyzing $($testFiles.Count) stress test runs..." -ForegroundColor Cyan

foreach ($file in $testFiles) {
    try {
        $json = Get-Content $file.FullName -Raw | ConvertFrom-Json
        
        # Extract key metrics
        $totalRequests = $json.metrics.http_reqs.values.count
        $failures = $json.metrics.endpoint_failures.values.count
        $successRate = $json.metrics.success_rate.values.rate * 100
        $errorRate = 100 - $successRate
        $avgResponseTime = $json.metrics.http_req_duration.values.avg
        $p95ResponseTime = $json.metrics.http_req_duration.values.p95
        $maxVUs = $json.metrics.vus_max.values.max
        
        $results += [PSCustomObject]@{
            File = $file.Name
            Timestamp = $json.metadata.timestamp
            TotalRequests = $totalRequests
            Failures = $failures
            SuccessRate = [math]::Round($successRate, 2)
            ErrorRate = [math]::Round($errorRate, 2)
            AvgResponseTime = [math]::Round($avgResponseTime, 2)
            P95ResponseTime = [math]::Round($p95ResponseTime, 2)
            MaxVUs = $maxVUs
        }
    } catch {
        Write-Warning "Failed to parse $($file.Name): $_"
    }
}

# Calculate statistics
$totalReqs = ($results | Measure-Object -Property TotalRequests -Sum).Sum
$totalFails = ($results | Measure-Object -Property Failures -Sum).Sum
$overallSuccess = (($totalReqs - $totalFails) / $totalReqs) * 100
$avgSuccess = ($results | Measure-Object -Property SuccessRate -Average).Average
$minSuccess = ($results | Measure-Object -Property SuccessRate -Minimum).Minimum
$maxSuccess = ($results | Measure-Object -Property SuccessRate -Maximum).Maximum
$avgRT = ($results | Measure-Object -Property AvgResponseTime -Average).Average
$avgP95 = ($results | Measure-Object -Property P95ResponseTime -Average).Average
$stdDevSuccess = [math]::Sqrt(($results | ForEach-Object { [math]::Pow($_.SuccessRate - $avgSuccess, 2) } | Measure-Object -Sum).Sum / $results.Count)

Write-Host "`n=== AGGREGATED STATISTICS ===" -ForegroundColor Green
Write-Host "Total Runs: $($results.Count)"
Write-Host "Total Requests: $totalReqs"
Write-Host "Total Failures: $totalFails"
Write-Host "Overall Success Rate: $([math]::Round($overallSuccess, 2))%"
Write-Host "Mean Success Rate (30 runs): $([math]::Round($avgSuccess, 2))%"
Write-Host "StdDev Success Rate: $([math]::Round($stdDevSuccess, 2))%"
Write-Host "Min Success Rate: $([math]::Round($minSuccess, 2))%"
Write-Host "Max Success Rate: $([math]::Round($maxSuccess, 2))%"
Write-Host "Mean Avg Response Time: $([math]::Round($avgRT, 2))ms"
Write-Host "Mean P95 Response Time: $([math]::Round($avgP95, 2))ms"
Write-Host "VUs (Stress Load): $($results[0].MaxVUs)"

# Create analysis directory
New-Item -ItemType Directory -Force -Path "test-results\analysis" | Out-Null

# Export to CSV
$results | Export-Csv -Path "test-results\analysis\stress-results-summary.csv" -NoTypeInformation

# Export detailed statistics
$stats = @{
    TotalRuns = $results.Count
    TotalRequests = $totalReqs
    TotalFailures = $totalFails
    OverallSuccessRate = [math]::Round($overallSuccess, 2)
    OverallErrorRate = [math]::Round(100 - $overallSuccess, 2)
    MeanSuccessRate = [math]::Round($avgSuccess, 2)
    StdDevSuccessRate = [math]::Round($stdDevSuccess, 2)
    MinSuccessRate = [math]::Round($minSuccess, 2)
    MaxSuccessRate = [math]::Round($maxSuccess, 2)
    MeanAvgResponseTime = [math]::Round($avgRT, 2)
    MeanP95ResponseTime = [math]::Round($avgP95, 2)
    MaxVUs = $results[0].MaxVUs
    TestDate = "2026-01-20/21"
    TestDuration = "12 minutes per run"
    TotalTestingDuration = "$([math]::Round($results.Count * 13 / 60, 1)) hours"
}

$stats | ConvertTo-Json | Out-File "test-results\analysis\stress-statistics.json"

Write-Host "`nResults exported:" -ForegroundColor Yellow
Write-Host "  - test-results\analysis\stress-results-summary.csv"
Write-Host "  - test-results\analysis\stress-statistics.json"

Write-Host "`nFirst 5 runs:" -ForegroundColor Cyan
$results | Select-Object -First 5 | Format-Table Timestamp, TotalRequests, Failures, SuccessRate, AvgResponseTime, P95ResponseTime -AutoSize
