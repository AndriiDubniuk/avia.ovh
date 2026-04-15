FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/billing/package.json apps/billing/package.json
RUN pnpm install --frozen-lockfile --filter billing...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/billing/node_modules ./apps/billing/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/billing ./apps/billing
WORKDIR /app/apps/billing
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/apps/billing/.next/standalone ./
COPY --from=builder /app/apps/billing/.next/static ./apps/billing/.next/static
COPY --from=builder /app/apps/billing/public ./apps/billing/public
EXPOSE 3002
CMD ["node", "apps/billing/server.js"]
