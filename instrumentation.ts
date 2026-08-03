import * as Sentry from "@sentry/nextjs";

export async function register() {
  // Load environment configuration first, but only in Node.js runtime and outside of K8s (where env vars come from configmaps/secrets)
  if (process.env.NEXT_RUNTIME === "nodejs" && !(process.env.K8S === "1")) {
    const { loadEnvironment } = await import("./lib/environment");
    loadEnvironment();
    await import("./sentry.server.config");
  }

  // Refuse to start if the database schema doesn't match the migrations this
  // build was compiled with. Must come after loadEnvironment(), which is where
  // DATABASE_URL comes from outside K8s. Never applies migrations; see
  // lib/migrations/check.ts.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { verifyMigrationsOrExit } = await import("./lib/migrations/startup");
    await verifyMigrationsOrExit();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
