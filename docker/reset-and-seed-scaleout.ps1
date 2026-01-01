#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Reset and seed databases for JELITA Microservices (Scaleout Configuration)
    
.DESCRIPTION
    This script resets and seeds all microservices databases when running
    docker-compose.scaleout.yml configuration. It targets the first replica
    of each scaled service since all replicas share the same database.
    
.PARAMETER Target
    Specific service to reset (all, auth, pendaftaran, workflow, survey, archive)
    Default: "all"
    
.PARAMETER SkipHealthCheck
    Skip container health check before reset/seed
    
.EXAMPLE
    .\reset-and-seed-microservices-scaleout.ps1
    Reset and seed all services
    
.EXAMPLE
    .\reset-and-seed-microservices-scaleout.ps1 -Target pendaftaran
    Reset and seed only pendaftaran service
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "auth", "pendaftaran", "workflow", "survey", "archive")]
    [string]$Target = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipHealthCheck
)

$ErrorActionPreference = "Continue"

# Color functions
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Write-Header {
    param([string]$Message)
    Write-Host "`n==============================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
}

function Test-ContainerRunning {
    param([string]$ContainerName)
    
    $status = docker inspect -f '{{.State.Running}}' $ContainerName 2>$null
    return $status -eq "true"
}

function Test-ContainerHealthy {
    param([string]$ContainerName)
    
    $health = docker inspect -f '{{.State.Health.Status}}' $ContainerName 2>$null
    if ($health -eq "healthy" -or $health -eq "") {
        return $true
    }
    return $false
}

# Main execution
Write-Header "Reset & Seed JELITA Microservices (SCALEOUT)"
Write-ColorOutput "`nConfiguration: docker-compose.scaleout.yml" "Yellow"
Write-ColorOutput "Target: $Target" "Yellow"
Write-Host ""

# Service definitions - use first replica of scaled services
$services = @(
    @{ 
        Name = "Auth"
        Container = "jelita-auth-scaled"
        Reset = "scripts/resetDatabase.js"
        Seed = "scripts/seedTestData.js"
        Database = "jelita_users"
    },
    @{ 
        Name = "Pendaftaran"
        Container = "jelita-pendaftaran-1"
        Reset = "scripts/resetDatabase.js"
        Seed = "scripts/seedTestData.js"
        Database = "jelita_pendaftaran"
        Replicas = 3
    },
    @{ 
        Name = "Workflow"
        Container = "jelita-workflow-1"
        Reset = "scripts/resetDatabase.js"
        Seed = "scripts/seedTestData.js"
        Database = "jelita_workflow"
        Replicas = 3
    },
    @{ 
        Name = "Survey"
        Container = "jelita-survey-1"
        Reset = "scripts/resetDatabase.js"
        Seed = "scripts/seedTestData.js"
        Database = "jelita_survei"
        Replicas = 2
    },
    @{ 
        Name = "Archive"
        Container = "jelita-archive-scaled"
        Reset = "scripts/resetDatabase.js"
        Seed = "scripts/seedTestData.js"
        Database = "jelita_arsip"
    }
)

Write-ColorOutput "Note: Using first replica of scaled services (all replicas share same database)" "Cyan"
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($svc in $services) {
    # Filter by target
    if ($Target -ne "all" -and $svc.Name.ToLower() -ne $Target.ToLower()) {
        continue
    }

    $serviceName = $svc.Name
    $replicaInfo = if ($svc.Replicas) { " (1 of $($svc.Replicas) replicas)" } else { "" }
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-ColorOutput "Processing: $serviceName$replicaInfo" "White"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    # Check if container is running
    if (-not (Test-ContainerRunning $svc.Container)) {
        Write-ColorOutput "[$serviceName] Container '$($svc.Container)' is not running" "Red"
        Write-ColorOutput "[$serviceName] Run: docker compose -f docker-compose.scaleout.yml up -d" "Yellow"
        $failCount++
        continue
    }
    
    # Check container health (unless skipped)
    if (-not $SkipHealthCheck) {
        if (-not (Test-ContainerHealthy $svc.Container)) {
            Write-ColorOutput "[$serviceName] Container is running but not healthy, proceeding anyway..." "Yellow"
        } else {
            Write-ColorOutput "[$serviceName] Container healthy" "Green"
        }
    }
    
    # Reset database
    Write-ColorOutput "[$serviceName] Resetting database ($($svc.Database))..." "Yellow"
    $resetOutput = docker exec $svc.Container sh -c "node $($svc.Reset)" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "[$serviceName] Reset failed" "Red"
        Write-ColorOutput "Error output:" "Red"
        Write-Host $resetOutput
        $failCount++
        continue
    }
    
    Write-ColorOutput "[$serviceName] Database reset complete" "Green"
    
    # Seed test data
    Write-ColorOutput "[$serviceName] Seeding test data..." "Yellow"
    $seedOutput = docker exec $svc.Container sh -c "node $($svc.Seed)" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "[$serviceName] Seed failed" "Red"
        Write-ColorOutput "Error output:" "Red"
        Write-Host $seedOutput
        $failCount++
        continue
    }
    
    Write-ColorOutput "[$serviceName] Test data seeded successfully" "Green"
    Write-ColorOutput "[$serviceName] Complete" "Green"
    $successCount++
}

# Summary
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Header "Summary"

if ($successCount -gt 0) {
    Write-ColorOutput "Successfully processed: $successCount service(s)" "Green"
}
if ($failCount -gt 0) {
    Write-ColorOutput "Failed: $failCount service(s)" "Red"
}

Write-Host ""
Write-ColorOutput "Dataset seeded:" "Cyan"
Write-ColorOutput "  - 50 pemohon users" "White"
Write-ColorOutput "  - 10 admin users" "White"
Write-ColorOutput "  - 10 OPD users" "White"
Write-ColorOutput "  - 5 pimpinan users" "White"
Write-ColorOutput "  - 100 permohonan with documents" "White"
Write-ColorOutput "  - Workflow/Archive/Survey data linked to permohonan 1-30" "White"

Write-Host ""
Write-ColorOutput "All service replicas now share the same seeded database state." "Cyan"

if ($failCount -gt 0) {
    exit 1
}
