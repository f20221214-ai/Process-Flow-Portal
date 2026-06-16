# Build static frontend and serve with nginx (proxies /api to API service)
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/arc-portal/package.json artifacts/arc-portal/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY lib/api-zod/package.json lib/api-zod/
RUN pnpm install --frozen-lockfile --filter @workspace/arc-portal...

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/artifacts/arc-portal/node_modules ./artifacts/arc-portal/node_modules
COPY --from=deps /app/lib ./lib
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/arc-portal ./artifacts/arc-portal
COPY lib/api-client-react ./lib/api-client-react
COPY lib/api-zod ./lib/api-zod
ENV NODE_ENV=production
ENV PORT=80
ENV BASE_PATH=/
RUN pnpm --filter @workspace/arc-portal build

FROM nginx:1.27-alpine AS runner
RUN apk add --no-cache gettext
COPY deploy/docker/nginx.conf.template /etc/nginx/templates/default.conf.template
ENV API_UPSTREAM=http://api:8080
COPY deploy/docker/portal-entrypoint.sh /docker-entrypoint.d/40-set-api-upstream.sh
RUN chmod +x /docker-entrypoint.d/40-set-api-upstream.sh
COPY --from=build /app/artifacts/arc-portal/dist/public /usr/share/nginx/html
EXPOSE 80
