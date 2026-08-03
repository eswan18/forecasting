FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time args for Sentry source maps
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_RELEASE

ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV SENTRY_RELEASE=$SENTRY_RELEASE

# Dummy values for build — Next.js evaluates server-side modules during page
# data collection, but doesn't actually connect to anything.
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV IDP_BASE_URL="http://dummy"
ENV IDP_PUBLIC_URL="http://dummy"

RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app

RUN adduser -D -u 1001 appuser

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=appuser:appuser /app/.next/standalone ./
COPY --from=builder --chown=appuser:appuser /app/.next/static ./.next/static

# The migration runner: `migrations/` compiled to a single self-contained script
# by scripts/build-migration-runner.ts. Copied explicitly rather than taken from
# `.next/standalone`, which does happen to contain the source tree today — but
# that is Next's file tracing being generous, and it is free to stop. Migrations
# breaking silently because tracing changed is not a failure mode worth having.
# The bundle inlines kysely and pg, so it needs nothing from node_modules.
#
# bifrost preview environments run this as an initContainer:
#   ["node", "/app/migrate/index.js"]
# See the README's "Applying migrations from inside the image".
COPY --from=builder --chown=appuser:appuser /app/dist/migrate ./migrate

USER appuser
EXPOSE 3000

CMD ["node", "server.js"]
