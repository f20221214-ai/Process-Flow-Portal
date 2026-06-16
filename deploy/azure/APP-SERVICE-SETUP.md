# Free Azure deployment (single Web App)

## Architecture

```
GitHub Actions  -->  ONE Azure Web App (F1 Free)
                         |
                         +-- Node API (/api/*)
                         +-- React UI (same URL)
                         |
                    Neon PostgreSQL (free, external — NOT on Azure)
```

**Cost: $0** — App Service F1 (free) + Neon free tier Postgres.

---

## Step 1 — Free database (Neon, not Azure)

1. Go to [https://neon.tech](https://neon.tech) and sign up (free).
2. Create a project and database named `arc_portal`.
3. Copy the connection string (must include `?sslmode=require`).
4. Save it — you will use it as `DATABASE_URL`.

---

## Step 2 — ONE Azure Web App (Free F1)

1. [Azure Portal](https://portal.azure.com) → **Create a resource** → **Web App**.
2. Settings:
   - **Name**: e.g. `arcportal-yourname` (must be globally unique)
   - **Publish**: **Code** (NOT Docker — Docker needs paid Basic plan)
   - **Runtime stack**: **Node 22 LTS**
   - **Operating System**: **Linux**
   - **Region**: closest to you
   - **Pricing plan**: **Free F1** (new App Service plan)
3. Click **Review + create** → **Create**.

### Application settings (Web App → Settings → Environment variables)

| Name | Value |
|------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your Neon connection string |
| `LOG_LEVEL` | `info` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` |

### Startup command (Web App → Settings → Configuration → General settings)

```
node dist/index.mjs
```

---

## Step 3 — GitHub secrets (only 2 required)

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | How to get it |
|--------|----------------|
| `AZURE_WEBAPP_NAME` | Your web app name only, e.g. `arcportal-yourname` |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Azure Portal → your Web App → **Download publish profile** → open XML file → copy **entire contents** into the secret |
| `DATABASE_URL` | Neon connection string (recommended) |

Optional variable (not secret): **Settings → Variables** → `SEED_DEMO_DATA` = `true` to load demo data on each deploy.

**You do NOT need** `AZURE_CREDENTIALS`, ACR, or a second Web App.

---

## Step 4 — Deploy

1. Push code to the `main` branch, **or**
2. GitHub → **Actions** → **Deploy to Azure App Service** → **Run workflow**

Your app will be at: `https://YOUR-APP-NAME.azurewebsites.net`

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `client-id and tenant-id are not supplied` | Old workflow used service principal. Use the updated workflow with **Publish Profile** only. |
| App shows default Azure page | Wait 2–3 min after deploy; check **Startup command** is `node dist/index.mjs` |
| API 500 / DB errors | Check `DATABASE_URL` in Azure app settings matches Neon string |
| F1 app sleeps / slow | Free tier limits CPU; first request after idle may take ~30s |

---

## Why not "Web App + Database"?

That Azure template creates **Azure SQL Server**, not PostgreSQL. This app uses PostgreSQL. Neon is free and avoids Azure database cost.
