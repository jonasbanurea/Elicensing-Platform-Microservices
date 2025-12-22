# Script PowerShell untuk setup database di dalam container
# Jalankan setelah docker-compose up untuk membuat tabel dan seed data

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Setup Database untuk Jelita Microservices" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Array services dengan reset + seed
$services = @(
    @{Name="Auth"; Container="jelita-auth"; Scripts=@("scripts/resetDatabase.js", "scripts/seedTestData.js")},
    @{Name="Pendaftaran"; Container="jelita-pendaftaran"; Scripts=@("scripts/resetDatabase.js", "scripts/seedTestData.js")},
    @{Name="Workflow"; Container="jelita-workflow"; Scripts=@("scripts/resetDatabase.js", "scripts/seedTestData.js")},
    @{Name="Survey"; Container="jelita-survey"; Scripts=@("scripts/resetDatabase.js", "scripts/seedTestData.js")},
    @{Name="Archive"; Container="jelita-archive"; Scripts=@("scripts/resetDatabase.js", "scripts/seedTestData.js")}
)

# Loop untuk setiap service
foreach ($service in $services) {
    Write-Host ""
    Write-Host "[$($service.Name) Service] Reset & Seed..." -ForegroundColor Yellow
    
    foreach ($script in $service.Scripts) {
        docker exec $service.Container sh -c "if [ -f $script ]; then node $script; else echo 'Missing script: ' $script; fi"
    }
    
    Write-Host "[$($service.Name) Service] Database ready" -ForegroundColor Green
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "All microservice databases reset & seeded!" -ForegroundColor Green
Write-Host "Dataset: 50 pemohon, 10 admin, 10 OPD, 5 pimpinan; 100 permohonan; workflow/arsip/survey linked." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
