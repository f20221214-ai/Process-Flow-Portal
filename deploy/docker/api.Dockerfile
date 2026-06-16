# Build and run the ARC Portal API (monorepo root = build context)
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/api-server/package.json artifacts/api-server/
COPY lib/db/package.json lib/db/
COPY lib/api-zod/package.json lib/api-zod/
COPY lib/integrations-openai-ai-server/package.json lib/integrations-openai-ai-server/
RUN pnpm install --frozen-lockfile --filter @workspace/api-server...

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules
COPY --from=deps /app/lib ./lib
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/api-server ./artifacts/api-server
COPY lib/db ./lib/db
COPY lib/api-zod ./lib/api-zod
COPY lib/integrations-openai-ai-server ./lib/integrations-openai-ai-server
RUN pnpm --filter @workspace/api-server build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=build /app/artifacts/api-server/dist ./dist
COPY --from=build /app/artifacts/api-server/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/artifacts/api-server/node_modules ./artifact_node_modules
EXPOSE 8080
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
