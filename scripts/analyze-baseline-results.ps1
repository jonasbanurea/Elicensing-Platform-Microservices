# Script to analyze actual baseline test results from JSON files
# Extracts REAL data - no fabrication

$baselineFolder = "test-results_baseline"
$jsonFiles = Get-ChildItem "$baselineFolder\*.json" | Sort-Object CreationTime

Write-Host "=== ACTUAL BASELINE TEST RESULTS ANALYSIS ===" -ForegroundColor Green
Write-Host "Total JSON files found: $($jsonFiles.Count)" -ForegroundColor Yellow
Write-Host ""

$results = @()
$runNumber = 1

foreach ($file in $jsonFiles) {
    try {
        $json = Get-Content $file.FullName -Raw | ConvertFrom-Json
        
        # Extract metrics from K6 JSON structure
        $metrics = $json.metrics
        
        # Get total requests
        $httpReqs = $metrics.http_reqs.values.count
        
        # Get failed requests (http_req_failed)
        $httpReqFailed = $metrics.http_req_failed
        if ($httpReqFailed) {
            $failedCount = [math]::Round($httpReqFailed.values.passes)
            $totalChecks = $httpReqFailed.values.passes + $httpReqFailed.values.fails
        } else {
            $failedCount = 0
            $totalChecks = $httpReqs
        }
        
        # Calculate error rate
        $errorRate = if ($totalChecks -gt 0) { ($failedCount / $totalChecks) * 100 } else { 0 }
        $successRate = 100 - $errorRate
        
        # Get duration
        $duration = $json.state.testRunDurationMs / 1000
        
        # Get response times
        $httpReqDuration = $metrics.http_req_duration
        $avgResponseTime = if ($httpReqDuration) { $httpReqDuration.values.avg } else { 0 }
        $p95ResponseTime = if ($httpReqDuration) { $httpReqDuration.values.'p(95)' } else { 0 }
        
        $result = [PSCustomObject]@{
            RunNumber = $runNumber
            FileName = $file.Name
            Timestamp = $file.CreationTime
            TotalRequests = $httpReqs
            FailedRequests = $failedCount
            ErrorRate = [math]::Round($errorRate, 2)
            SuccessRate = [math]::Round($successRate, 2)
            AvgResponseTime = [math]::Round($avgResponseTime, 2)
            P95ResponseTime = [math]::Round($p95ResponseTime, 2)
            DurationSec = [math]::Round($duration, 2)
        }
        
        $results += $result
        
        Write-Host "Run $runNumber : Success Rate = $($result.SuccessRate)% | Errors = $failedCount | Avg RT = $($result.AvgResponseTime)ms" -ForegroundColor Cyan
        
        $runNumber++
        
    } catch {
        Write-Host "Error reading $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== STATISTICAL SUMMARY ===" -ForegroundColor Green

# Calculate statistics
$meanSuccessRate = ($results | Measure-Object -Property SuccessRate -Average).Average
$minSuccessRate = ($results | Measure-Object -Property SuccessRate -Minimum).Minimum
$maxSuccessRate = ($results | Measure-Object -Property SuccessRate -Maximum).Maximum
$stdDevSuccessRate = [math]::Round([math]::Sqrt((($results | ForEach-Object { [math]::Pow($_.SuccessRate - $meanSuccessRate, 2) }) | Measure-Object -Average).Average), 4)

$meanErrorRate = ($results | Measure-Object -Property ErrorRate -Average).Average
$totalErrors = ($results | Measure-Object -Property FailedRequests -Sum).Sum
$totalRequests = ($results | Measure-Object -Property TotalRequests -Sum).Sum

$meanResponseTime = ($results | Measure-Object -Property AvgResponseTime -Average).Average

Write-Host "Total Runs: $($results.Count)" -ForegroundColor White
Write-Host "Total Requests: $totalRequests" -ForegroundColor White
Write-Host "Total Errors: $totalErrors" -ForegroundColor White
Write-Host ""
Write-Host "Mean Success Rate: $([math]::Round($meanSuccessRate, 2))%" -ForegroundColor Yellow
Write-Host "Min Success Rate: $([math]::Round($minSuccessRate, 2))%" -ForegroundColor Yellow
Write-Host "Max Success Rate: $([math]::Round($maxSuccessRate, 2))%" -ForegroundColor Yellow
Write-Host "Std Dev: $stdDevSuccessRate%" -ForegroundColor Yellow
Write-Host ""
Write-Host "Mean Error Rate: $([math]::Round($meanErrorRate, 2))%" -ForegroundColor Yellow
Write-Host "Mean Response Time: $([math]::Round($meanResponseTime, 2))ms" -ForegroundColor Yellow

# Export to CSV for further analysis
$results | Export-Csv "$baselineFolder\analysis\baseline-results-summary.csv" -NoTypeInformation
Write-Host ""
Write-Host "Results exported to: $baselineFolder\analysis\baseline-results-summary.csv" -ForegroundColor Green

# Show top 5 best and worst runs
Write-Host ""
Write-Host "=== TOP 5 BEST RUNS ===" -ForegroundColor Green
$results | Sort-Object SuccessRate -Descending | Select-Object -First 5 | Format-Table RunNumber, SuccessRate, ErrorRate, FailedRequests

Write-Host "=== TOP 5 WORST RUNS ===" -ForegroundColor Red
$results | Sort-Object SuccessRate | Select-Object -First 5 | Format-Table RunNumber, SuccessRate, ErrorRate, FailedRequests
