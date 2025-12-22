param(
    [string]$Target = "all"  # allow filtering later if needed
)

Write-Host "==============================" -ForegroundColor Cyan
Write-Host "Reset & Seed JELITA Microservices" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

$services = @(
    @{ Name = "Auth"; Container = "jelita-auth"; Reset = "scripts/resetDatabase.js"; Seed = "scripts/seedTestData.js" },
    @{ Name = "Pendaftaran"; Container = "jelita-pendaftaran"; Reset = "scripts/resetDatabase.js"; Seed = "scripts/seedTestData.js" },
    @{ Name = "Workflow"; Container = "jelita-workflow"; Reset = "scripts/resetDatabase.js"; Seed = "scripts/seedTestData.js" },
    @{ Name = "Survey"; Container = "jelita-survey"; Reset = "scripts/resetDatabase.js"; Seed = "scripts/seedTestData.js" },
    @{ Name = "Archive"; Container = "jelita-archive"; Reset = "scripts/resetDatabase.js"; Seed = "scripts/seedTestData.js" }
)

foreach ($svc in $services) {
    if ($Target -ne "all" -and $svc.Name.ToLower() -ne $Target.ToLower()) {
        continue
    }

    Write-Host "`n[$($svc.Name)] Resetting database..." -ForegroundColor Yellow
    docker exec $svc.Container sh -c "node $($svc.Reset)"

    Write-Host "[$($svc.Name)] Seeding test data..." -ForegroundColor Yellow
    docker exec $svc.Container sh -c "node $($svc.Seed)"

    Write-Host "[$($svc.Name)] ✅ Done" -ForegroundColor Green
}

Write-Host "`nAll selected services reset & seeded." -ForegroundColor Green
Write-Host "Dataset matches monolith seed: 50 pemohon, 10 admin, 10 OPD, 5 pimpinan; 100 permohonan + docs; workflow/arsip/survey linked to permohonan 1..30." -ForegroundColor Cyan
