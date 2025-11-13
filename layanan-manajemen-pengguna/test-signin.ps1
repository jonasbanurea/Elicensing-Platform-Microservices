# Test signin endpoint
$body = @{
    username = "demo"
    password = "demo123"
} | ConvertTo-Json

Write-Host "Testing signin endpoint..." -ForegroundColor Cyan
Write-Host "URL: http://localhost:3009/api/auth/signin" -ForegroundColor Yellow
Write-Host "Body: $body" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Method Post -Uri "http://localhost:3009/api/auth/signin" -Body $body -ContentType "application/json"
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 5
    
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}
