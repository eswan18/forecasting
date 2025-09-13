import * as Sentry from "@sentry/nextjs";

export async function register() {
  // Load environment configuration first, but only in Node.js runtime
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { loadEnvironment } = await import("./lib/environment");
    loadEnvironment();
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
