# Script PowerShell untuk setup database di dalam container
# Jalankan setelah docker-compose up untuk membuat tabel dan seed data

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Setup Database untuk Jelita Microservices" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Array services
$services = @(
    @{Name="Auth"; Container="jelita-auth"; Script="scripts/setupDatabase.js"},
    @{Name="Pendaftaran"; Container="jelita-pendaftaran"; Script="scripts/setupDatabase.js"},
    @{Name="Workflow"; Container="jelita-workflow"; Script="scripts/setupDatabase.js"},
    @{Name="Survey"; Container="jelita-survey"; Script="scripts/setupDatabase.js"},
    @{Name="Archive"; Container="jelita-archive"; Script="scripts/setupDatabase.js"}
)

# Loop untuk setiap service
foreach ($service in $services) {
    Write-Host ""
    Write-Host "[$($service.Name) Service] Setting up database..." -ForegroundColor Yellow
    
    # Jalankan setupDatabase.js jika ada
    docker exec $service.Container sh -c "if [ -f $($service.Script) ]; then node $($service.Script); else echo 'No setupDatabase.js found'; fi"
    
    Write-Host "[$($service.Name) Service] Database setup completed" -ForegroundColor Green
}

# Setup user Pemohon khusus untuk Auth service
Write-Host ""
Write-Host "[Auth Service] Creating Pemohon user..." -ForegroundColor Yellow
docker exec jelita-auth sh -c "if [ -f scripts/createPemohonUser.js ]; then node scripts/createPemohonUser.js; else echo 'No createPemohonUser.js found'; fi"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "All databases setup completed!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
