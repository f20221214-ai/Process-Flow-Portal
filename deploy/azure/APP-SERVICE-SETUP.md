# Azure App Service setup (ARC Portal)

## What to create in Azure Portal

**Do NOT use "Web App + Database"** — that template creates **Azure SQL**, but this app needs **PostgreSQL**.

Create these resources manually (same resource group):

| # | Resource | Settings |
|---|----------|----------|
| 1 | **Azure Database for PostgreSQL Flexible Server** | Version 16, Burstable B1ms, database name `arc_portal`, allow Azure services |
| 2 | **Container Registry** | Basic SKU, admin user enabled |
| 3 | **App Service plan** | Linux, B1 or S1 |
| 4 | **Web App (API)** | Linux, **Docker Container**, name e.g. `arcportal-api` |
| 5 | **Web App (Portal)** | Linux, **Docker Container**, name e.g. `arcportal-portal` |

### API Web App settings (Configuration → Application settings)

| Name | Value |
|------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `WEBSITES_PORT` | `8080` |
| `DATABASE_URL` | `postgresql://USER:PASS@HOST:5432/arc_portal?sslmode=require` |
| `LOG_LEVEL` | `info` |

### Portal Web App settings

| Name | Value |
|------|-------|
| `API_UPSTREAM` | `https://arcportal-api.azurewebsites.net` (your API app URL) |
| `WEBSITES_PORT` | `80` |

### Connect ACR to both Web Apps

Each Web App → **Deployment Center** → Container Registry → select your ACR.

Grant ACR pull access: Web App → **Identity** → System assigned **On**, then ACR → **Access control** → AcrPull role for the web app identity.

---

## GitHub secrets (Settings → Secrets → Actions)

| Secret | Example |
|--------|---------|
| `AZURE_CREDENTIALS` | JSON from `az ad sp create-for-rbac` |
| `AZURE_RESOURCE_GROUP` | `rg-arc-portal` |
| `AZURE_ACR_NAME` | `arcportalacr` |
| `AZURE_WEBAPP_NAME_API` | `arcportal-api` |
| `AZURE_WEBAPP_NAME_PORTAL` | `arcportal-portal` |
| `DATABASE_URL` | Full Postgres connection string |

---

## Deploy from GitHub

1. Push code to `main` branch
2. Go to **Actions** → **Deploy to Azure App Service** → **Run workflow**
3. Open `https://arcportal-portal.azurewebsites.net`

### First-time database setup (run once from your PC)

```powershell
$env:DATABASE_URL = "postgresql://arcadmin:PASSWORD@your-server.postgres.database.azure.com:5432/arc_portal?sslmode=require"
pnpm db:schema
pnpm seed:all
```

Add your IP to Postgres firewall: Server → Networking → Add current client IP.

---

## Create Azure service principal (for AZURE_CREDENTIALS)

```powershell
az login
az ad sp create-for-rbac --name "arc-portal-github" --role contributor --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/rg-arc-portal --sdk-auth
```

Copy the entire JSON output into GitHub secret `AZURE_CREDENTIALS`.
