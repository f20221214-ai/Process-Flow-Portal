# Deploy ARC Portal to Azure Container Apps + PostgreSQL Flexible Server
# Uses `az acr build` — no local Docker required.
#
# Prerequisites:
#   winget install Microsoft.AzureCLI
#   az login
#   az extension add --name containerapp
#
# Usage:
#   .\deploy\azure\deploy-container-apps.ps1

param(
    [string]$ResourceGroup = "rg-arc-portal",
    [string]$Location = "canadacentral",
    [string]$AppName = "arcportalbr",
    [string]$PostgresAdminPassword = ""
)

$ErrorActionPreference = "Stop"

function Require-Command($name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Write-Error "$name not found. Install Azure CLI: winget install Microsoft.AzureCLI"
    }
}

Require-Command "az"

$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Error "Not logged in. Run: az login"
}

Write-Host "Using subscription: $($account.name) ($($account.id))"

if (-not $PostgresAdminPassword) {
    $PostgresAdminPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ })
    Write-Host ""
    Write-Host "Generated Postgres password (SAVE THIS): $PostgresAdminPassword"
    Write-Host ""
}

$suffix = (Get-Random -Maximum 99999).ToString("00000")
$acrName = ($AppName.ToLower() -replace "[^a-z0-9]", "").Substring(0, [Math]::Min(8, ($AppName -replace "[^a-z0-9]", "").Length)) + $suffix + "acr"
$pgServer = ($AppName.ToLower() -replace "[^a-z0-9-]", "").Substring(0, [Math]::Min(30, ($AppName -replace "[^a-z0-9-]", "").Length)) + "-pg-$suffix"
$envName = "$AppName-env"
$apiApp = "$AppName-api"
$portalApp = "$AppName-portal"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")

Write-Host "Ensuring containerapp extension is installed..."
az extension add --name containerapp --upgrade 2>$null | Out-Null

Write-Host "Creating resource group $ResourceGroup in $Location..."
az group create --name $ResourceGroup --location $Location --output none

Write-Host "Creating Azure Container Registry $acrName..."
az acr create --resource-group $ResourceGroup --name $acrName --sku Basic --admin-enabled true --output none
$acrLogin = az acr show --name $acrName --query loginServer -o tsv

Write-Host "Creating PostgreSQL Flexible Server $pgServer (5-10 minutes)..."
az postgres flexible-server create `
    --resource-group $ResourceGroup `
    --name $pgServer `
    --location $Location `
    --admin-user arcadmin `
    --admin-password $PostgresAdminPassword `
    --sku-name Standard_B1ms `
    --tier Burstable `
    --version 16 `
    --storage-size 32 `
    --public-access 0.0.0.0-255.255.255.255 `
    --yes `
    --output none

az postgres flexible-server db create `
    --resource-group $ResourceGroup `
    --server-name $pgServer `
    --database-name arc_portal `
    --output none

$pgHost = "$pgServer.postgres.database.azure.com"
$databaseUrl = "postgresql://arcadmin:$PostgresAdminPassword@$pgHost:5432/arc_portal?sslmode=require"

Write-Host "Building API image in Azure (az acr build)..."
Push-Location $repoRoot
try {
    az acr build `
        --registry $acrName `
        --image arc-api:latest `
        --file deploy/docker/api.Dockerfile `
        . `
        --output none

    Write-Host "Building Portal image in Azure (az acr build)..."
    az acr build `
        --registry $acrName `
        --image arc-portal:latest `
        --file deploy/docker/portal.Dockerfile `
        . `
        --output none
}
finally {
    Pop-Location
}

Write-Host "Creating Container Apps environment..."
az containerapp env create `
    --name $envName `
    --resource-group $ResourceGroup `
    --location $Location `
    --output none

$acrUser = az acr credential show --name $acrName --query username -o tsv
$acrPass = az acr credential show --name $acrName --query "passwords[0].value" -o tsv

Write-Host "Deploying API (internal ingress — not public)..."
az containerapp create `
    --name $apiApp `
    --resource-group $ResourceGroup `
    --environment $envName `
    --image "${acrLogin}/arc-api:latest" `
    --registry-server $acrLogin `
    --registry-username $acrUser `
    --registry-password $acrPass `
    --target-port 8080 `
    --ingress internal `
    --min-replicas 1 `
    --max-replicas 2 `
    --cpu 0.5 `
    --memory 1Gi `
    --env-vars "NODE_ENV=production" "PORT=8080" "DATABASE_URL=secretref:database-url" "LOG_LEVEL=info" `
    --secrets "database-url=$databaseUrl" `
    --output none

$apiInternalUrl = "http://${apiApp}:8080"

Write-Host "Deploying Portal (public ingress)..."
az containerapp create `
    --name $portalApp `
    --resource-group $ResourceGroup `
    --environment $envName `
    --image "${acrLogin}/arc-portal:latest" `
    --registry-server $acrLogin `
    --registry-username $acrUser `
    --registry-password $acrPass `
    --target-port 80 `
    --ingress external `
    --min-replicas 1 `
    --max-replicas 2 `
    --cpu 0.5 `
    --memory 1Gi `
    --env-vars "API_UPSTREAM=$apiInternalUrl" `
    --output none

$portalFqdn = az containerapp show --name $portalApp --resource-group $ResourceGroup --query properties.configuration.ingress.fqdn -o tsv
$portalUrl = "https://$portalFqdn"

Write-Host ""
Write-Host "Applying database schema from this machine..."
$env:DATABASE_URL = $databaseUrl
Push-Location $repoRoot
try {
    pnpm db:schema
    pnpm seed:all
}
catch {
    Write-Warning "Schema/seed failed (check firewall — add your IP to Postgres): $_"
    Write-Host "Run manually after allowing your IP:"
    Write-Host "  `$env:DATABASE_URL='$databaseUrl'"
    Write-Host "  pnpm db:schema"
    Write-Host "  pnpm seed:all"
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "=========================================="
Write-Host " DEPLOYMENT COMPLETE"
Write-Host "=========================================="
Write-Host "Portal URL:  $portalUrl"
Write-Host "API (internal): $apiInternalUrl"
Write-Host "Postgres:    $pgHost / arc_portal"
Write-Host "Admin user:  arcadmin"
Write-Host "Password:    $PostgresAdminPassword"
Write-Host "Resource group: $ResourceGroup"
Write-Host "=========================================="

# Save deployment info locally (gitignored)
$infoPath = Join-Path $repoRoot "config\deployment-info.json"
@{
    portalUrl = $portalUrl
    resourceGroup = $ResourceGroup
    postgresHost = $pgHost
    postgresUser = "arcadmin"
    deployedAt = (Get-Date).ToString("o")
} | ConvertTo-Json | Set-Content $infoPath
Write-Host "Details saved to config/deployment-info.json"
