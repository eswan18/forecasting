// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Use env-configurable sampling; default to 1 in dev and lower in prod
  tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
    ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
    : process.env.NODE_ENV === "production"
      ? 0.2
      : 1,

  // Replay sampling
  replaysSessionSampleRate: process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE
    ? Number(process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE)
    : 0.1,
  replaysOnErrorSampleRate: process.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE
    ? Number(process.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE)
    : 1.0,

  debug: process.env.NODE_ENV !== "production",
});

// Export the required hook for Sentry navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
