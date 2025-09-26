// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,

  tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
    ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
    : process.env.NODE_ENV === "production"
      ? 0.2
      : 1,

  debug: process.env.NODE_ENV !== "production",
});
