// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

function parseSampleRate(value: string | undefined, fallback: number): number {
  const n = value === undefined ? NaN : parseFloat(value);
  if (!Number.isFinite(n) || n < 0 || n > 1) return fallback;
  return n;
}

const defaultTraceRate = process.env.NODE_ENV === "production" ? 0.2 : 1;

Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,

  tracesSampleRate: parseSampleRate(
    process.env.SENTRY_TRACES_SAMPLE_RATE,
    defaultTraceRate,
  ),

  debug: process.env.NODE_ENV !== "production",
});
