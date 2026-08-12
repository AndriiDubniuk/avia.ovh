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
RUN mkdir -p /app/apps/billing/public
# NEXT_PUBLIC_* вшиваються в клієнтський бандл на етапі складання, тому
# мусять бути тут. Файл .env.production на сервері для них уже запізно.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ARG NEXT_PUBLIC_LANDING_URL
ENV NEXT_PUBLIC_LANDING_URL=${NEXT_PUBLIC_LANDING_URL}

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
