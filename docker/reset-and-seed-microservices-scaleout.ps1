param(
    [string]$Target = "all"  # allow filtering later if needed
)

Write-Host "==============================" -ForegroundColor Cyan
Write-Host "Reset & Seed JELITA Microservices (SCALEOUT)" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# For scaleout, we only need to run reset/seed on ONE replica per service
# since all replicas share the same database
$services = @(
    @{ Name = "Auth"; Container = "jelita-auth-scaled"; Reset = "scripts/resetDatabase.js"; Seed = "scripts/seedTestData.js" },
    @{ Name = "Pendaftaran"; Container = "jelita-pendaftaran-1"; Reset = "scripts/resetDatabase.js"; Seed = "scripts/seedTestData.js" },
    @{ Name = "Workflow"; Container = "jelita-workflow-1"; Reset = "scripts/resetDatabase.js"; Seed = "scripts/seedTestData.js" },
    @{ Name = "Survey"; Container = "jelita-survey-1"; Reset = "scripts/resetDatabase.js"; Seed = "scripts/seedTestData.js" },
    @{ Name = "Archive"; Container = "jelita-archive-scaled"; Reset = "scripts/resetDatabase.js"; Seed = "scripts/seedTestData.js" }
)

Write-Host "`nNote: Using first replica of scaled services (all replicas share same database)" -ForegroundColor Yellow
Write-Host ""

foreach ($svc in $services) {
    if ($Target -ne "all" -and $svc.Name.ToLower() -ne $Target.ToLower()) {
        continue
    }

    Write-Host "`n[$($svc.Name)] Resetting database..." -ForegroundColor Yellow
    $resetResult = docker exec $svc.Container sh -c "node $($svc.Reset)" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[$($svc.Name)] ⚠️  Reset failed or container not ready" -ForegroundColor Red
        Write-Host "Error: $resetResult" -ForegroundColor Red
        continue
    }

    Write-Host "[$($svc.Name)] Seeding test data..." -ForegroundColor Yellow
    $seedResult = docker exec $svc.Container sh -c "node $($svc.Seed)" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[$($svc.Name)] ⚠️  Seed failed" -ForegroundColor Red
        Write-Host "Error: $seedResult" -ForegroundColor Red
        continue
    }

    Write-Host "[$($svc.Name)] ✅ Done" -ForegroundColor Green
}

Write-Host "`nAll selected services reset & seeded." -ForegroundColor Green
Write-Host "Dataset matches monolith seed: 50 pemohon, 10 admin, 10 OPD, 5 pimpinan; 100 permohonan + docs; workflow/arsip/survey linked to permohonan 1..30." -ForegroundColor Cyan
Write-Host "`nNote: All service replicas now share the same database state." -ForegroundColor Cyan
