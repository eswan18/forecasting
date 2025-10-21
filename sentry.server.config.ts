// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

function parseSampleRate(value: string | undefined, fallback: number): number {
  const n = value === undefined ? NaN : parseFloat(value);
  if (!Number.isFinite(n) || n < 0 || n > 1) return fallback;
  return n;
}

const defaultTraceRate = process.env.NODE_ENV === "production" ? 0.2 : 1;

if (process.env.SENTRY_ENABLED !== "false") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || undefined,

    tracesSampleRate: parseSampleRate(
      process.env.SENTRY_TRACES_SAMPLE_RATE,
      defaultTraceRate,
    ),

    debug: process.env.NODE_ENV !== "production",
  });
}
