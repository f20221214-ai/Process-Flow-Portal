# Restores the working embedded PostgreSQL configuration (port 5434).

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $projectRoot "config\env.embedded"
$target = Join-Path $projectRoot ".env"
$backupsDir = Join-Path $projectRoot "config\backups"

if (-not (Test-Path $source)) {
  Write-Host "Missing config/env.embedded" -ForegroundColor Red
  exit 1
}

if (Test-Path $target) {
  New-Item -ItemType Directory -Force -Path $backupsDir | Out-Null
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  Copy-Item $target (Join-Path $backupsDir ".env.backup-$stamp")
}

Copy-Item $source $target -Force

Write-Host "Restored embedded database config to .env" -ForegroundColor Green
Write-Host ""
Write-Host "Start the embedded database: pnpm dev:db" -ForegroundColor Cyan
Write-Host "pgAdmin connection for embedded mode:" -ForegroundColor Cyan
Write-Host "  Host: 127.0.0.1  Port: 5434  Database: arc_portal" -ForegroundColor Cyan
Write-Host "  Username: postgres  Password: postgres" -ForegroundColor Cyan
