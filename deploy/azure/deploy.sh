#!/usr/bin/env bash
# Deploy ARC Portal to Azure Container Apps (CI or Linux/macOS)
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-rg-arc-portal}"
LOCATION="${LOCATION:-canadacentral}"
APP_NAME="${APP_NAME:-arcportal-br}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI required. Install: https://learn.microsoft.com/cli/azure/install-azure-cli"
  exit 1
fi

if ! az account show >/dev/null 2>&1; then
  echo "Run: az login"
  exit 1
fi

if [[ -z "$POSTGRES_PASSWORD" ]]; then
  POSTGRES_PASSWORD="$(openssl rand -base64 18 | tr -dc 'a-zA-Z0-9' | head -c 24)"
  echo "Generated Postgres password (save this): $POSTGRES_PASSWORD"
fi

SUFFIX="$(printf '%05d' $((RANDOM % 100000)))"
ACR_NAME="$(echo "$APP_NAME" | tr -cd 'a-z0-9' | cut -c1-8)${SUFFIX}acr"
PG_SERVER="$(echo "$APP_NAME" | tr -cd 'a-z0-9-' | cut -c1-30)-pg-${SUFFIX}"
ENV_NAME="${APP_NAME}-env"
API_APP="${APP_NAME}-api"
PORTAL_APP="${APP_NAME}-portal"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "Subscription: $(az account show --query name -o tsv)"
az extension add --name containerapp --upgrade 2>/dev/null || true

echo "Creating resource group..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none

echo "Creating ACR $ACR_NAME..."
az acr create --resource-group "$RESOURCE_GROUP" --name "$ACR_NAME" --sku Basic --admin-enabled true --output none
ACR_LOGIN="$(az acr show --name "$ACR_NAME" --query loginServer -o tsv)"

echo "Creating PostgreSQL (5-10 min)..."
az postgres flexible-server create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$PG_SERVER" \
  --location "$LOCATION" \
  --admin-user arcadmin \
  --admin-password "$POSTGRES_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --storage-size 32 \
  --public-access 0.0.0.0-255.255.255.255 \
  --yes \
  --output none

az postgres flexible-server db create \
  --resource-group "$RESOURCE_GROUP" \
  --server-name "$PG_SERVER" \
  --database-name arc_portal \
  --output none

PG_HOST="${PG_SERVER}.postgres.database.azure.com"
DATABASE_URL="postgresql://arcadmin:${POSTGRES_PASSWORD}@${PG_HOST}:5432/arc_portal?sslmode=require"

echo "Building images in ACR..."
cd "$REPO_ROOT"
az acr build --registry "$ACR_NAME" --image arc-api:latest --file deploy/docker/api.Dockerfile . --output none
az acr build --registry "$ACR_NAME" --image arc-portal:latest --file deploy/docker/portal.Dockerfile . --output none

echo "Creating Container Apps environment..."
az containerapp env create --name "$ENV_NAME" --resource-group "$RESOURCE_GROUP" --location "$LOCATION" --output none

ACR_USER="$(az acr credential show --name "$ACR_NAME" --query username -o tsv)"
ACR_PASS="$(az acr credential show --name "$ACR_NAME" --query 'passwords[0].value' -o tsv)"

echo "Deploying API..."
az containerapp create \
  --name "$API_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$ENV_NAME" \
  --image "${ACR_LOGIN}/arc-api:latest" \
  --registry-server "$ACR_LOGIN" \
  --registry-username "$ACR_USER" \
  --registry-password "$ACR_PASS" \
  --target-port 8080 \
  --ingress internal \
  --min-replicas 1 \
  --max-replicas 2 \
  --cpu 0.5 \
  --memory 1Gi \
  --env-vars "NODE_ENV=production" "PORT=8080" "DATABASE_URL=secretref:database-url" "LOG_LEVEL=info" \
  --secrets "database-url=$DATABASE_URL" \
  --output none

API_INTERNAL="http://${API_APP}:8080"

echo "Deploying Portal..."
az containerapp create \
  --name "$PORTAL_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$ENV_NAME" \
  --image "${ACR_LOGIN}/arc-portal:latest" \
  --registry-server "$ACR_LOGIN" \
  --registry-username "$ACR_USER" \
  --registry-password "$ACR_PASS" \
  --target-port 80 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 2 \
  --cpu 0.5 \
  --memory 1Gi \
  --env-vars "API_UPSTREAM=$API_INTERNAL" \
  --output none

PORTAL_FQDN="$(az containerapp show --name "$PORTAL_APP" --resource-group "$RESOURCE_GROUP" --query properties.configuration.ingress.fqdn -o tsv)"
PORTAL_URL="https://${PORTAL_FQDN}"

echo "Applying schema and seed data..."
export DATABASE_URL="$DATABASE_URL"
cd "$REPO_ROOT"
pnpm db:schema || echo "WARN: schema failed — add GitHub runner IP to Postgres firewall"
pnpm seed:all || echo "WARN: seed failed"

echo ""
echo "=========================================="
echo " DEPLOYMENT COMPLETE"
echo "=========================================="
echo "Portal URL:     $PORTAL_URL"
echo "Postgres host:  $PG_HOST"
echo "Postgres user:  arcadmin"
echo "Password:       $POSTGRES_PASSWORD"
echo "Resource group: $RESOURCE_GROUP"
echo "=========================================="
