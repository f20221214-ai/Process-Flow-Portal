# Creates arc_portal on your installed PostgreSQL (port 5432) and updates .env for pgAdmin.
# Role and Service fields in pgAdmin can stay empty.

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host ""
Write-Host "=== ARC Portal: System PostgreSQL setup for pgAdmin ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This uses YOUR installed PostgreSQL on port 5432 (not the embedded dev DB on 5434)."
Write-Host "Enter the password for the PostgreSQL user postgres."
Write-Host "(Use the password you chose when PostgreSQL was installed. It is usually NOT postgres.)"
Write-Host ""

$securePassword = Read-Host "PostgreSQL password for user postgres" -AsSecureString
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
)

if ([string]::IsNullOrWhiteSpace($plainPassword)) {
  Write-Host "Password cannot be empty." -ForegroundColor Red
  exit 1
}

$env:PG_PASSWORD = $plainPassword
$env:PG_HOST = "127.0.0.1"
$env:PG_PORT = "5432"
$env:PG_USER = "postgres"
$env:PG_DATABASE = "arc_portal"

pnpm --filter @workspace/scripts configure-system-postgres

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Setup failed. Your previous .env was not changed unless a backup was created." -ForegroundColor Yellow
  Write-Host "To restore embedded database settings: pnpm env:restore-embedded" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Done. Open pgAdmin and register a server with the details printed above." -ForegroundColor Green
Write-Host "Then run: pnpm db:migrate-pgadmin  (loads demo data)" -ForegroundColor Green
Write-Host "Or start the app: pnpm dev:api" -ForegroundColor Green
