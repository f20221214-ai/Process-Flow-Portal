# One-time setup before first Azure deployment
# Run in PowerShell (as Administrator for Azure CLI install)

Write-Host "Step 1: Install Azure CLI"
if (Get-Command az -ErrorAction SilentlyContinue) {
    Write-Host "  Azure CLI already installed."
} else {
    Write-Host "  Installing Azure CLI (approve the UAC prompt)..."
    winget install -e --id Microsoft.AzureCLI --accept-package-agreements --accept-source-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

Write-Host ""
Write-Host "Step 2: Log in to Azure (browser will open)"
az login

Write-Host ""
Write-Host "Step 3: Deploy (15-20 minutes)"
Write-Host "  cd to repo root, then run:"
Write-Host "  pnpm deploy:azure"
Write-Host ""
