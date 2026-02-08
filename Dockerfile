FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time args for NEXT_PUBLIC_ vars and Sentry source maps
ARG NEXT_PUBLIC_IDP_BASE_URL
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_AUTH_TOKEN

ENV NEXT_PUBLIC_IDP_BASE_URL=$NEXT_PUBLIC_IDP_BASE_URL
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

# Dummy values for build — Next.js evaluates server-side modules during page
# data collection, but doesn't actually connect to anything.
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV IDP_BASE_URL="http://dummy"

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

RUN adduser -D -u 1001 appuser

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder --chown=appuser:appuser /app/.next/standalone ./
COPY --from=builder --chown=appuser:appuser /app/.next/static ./.next/static

USER appuser
EXPOSE 3000

CMD ["node", "server.js"]
