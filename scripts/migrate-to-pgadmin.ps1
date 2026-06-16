# Switches app to pgAdmin PostgreSQL (5432), creates arc_portal, and loads demo data.
# Restores embedded mode anytime with: pnpm env:restore-embedded

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host ""
Write-Host "=== ARC Portal: migrate to pgAdmin database ===" -ForegroundColor Cyan
Write-Host ""

if ($env:PG_PASSWORD) {
  Write-Host "Using PG_PASSWORD from environment."
  $plainPassword = $env:PG_PASSWORD
} else {
  Write-Host "Enter the password for PostgreSQL user postgres."
  Write-Host "(The password you use to connect in pgAdmin on port 5432.)"
  Write-Host ""
  $securePassword = Read-Host "PostgreSQL password" -AsSecureString
  $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  )
}

if ([string]::IsNullOrWhiteSpace($plainPassword)) {
  Write-Host "Password cannot be empty." -ForegroundColor Red
  exit 1
}

$env:PG_PASSWORD = $plainPassword
$env:PG_HOST = "127.0.0.1"
$env:PG_PORT = "5432"
$env:PG_USER = "postgres"
$env:PG_DATABASE = "arc_portal"

Write-Host ""
Write-Host "Step 1/3: Creating database and tables on port 5432..." -ForegroundColor Cyan
pnpm --filter @workspace/scripts configure-system-postgres
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Step 2/3: Building API server for full demo seed..." -ForegroundColor Cyan
pnpm --filter @workspace/api-server build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Step 3/3: Loading demo data..." -ForegroundColor Cyan
$env:PORT = "8080"
$apiProcess = Start-Process `
  -FilePath "node" `
  -ArgumentList "--enable-source-maps", "artifacts/api-server/dist/index.mjs" `
  -WorkingDirectory $projectRoot `
  -PassThru `
  -WindowStyle Hidden

try {
  $ready = $false
  for ($i = 0; $i -lt 30; $i++) {
    try {
      $health = Invoke-RestMethod -Uri "http://localhost:8080/api/healthz" -TimeoutSec 2
      if ($health.status -eq "ok") {
        $ready = $true
        break
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }

  if (-not $ready) {
    Write-Host "API did not start in time. Running direct seed instead..." -ForegroundColor Yellow
    pnpm seed:all
  } else {
    pnpm seed:all
  }
} finally {
  if ($apiProcess -and -not $apiProcess.HasExited) {
    Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
  }
}

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Done! The app now uses pgAdmin PostgreSQL on port 5432." -ForegroundColor Green
Write-Host "pgAdmin: host 127.0.0.1, port 5432, database arc_portal, user postgres" -ForegroundColor Green
Write-Host "Start the app: pnpm dev:api  and  pnpm dev:portal" -ForegroundColor Green
Write-Host "Restore embedded DB: pnpm env:restore-embedded" -ForegroundColor Yellow
