import * as Sentry from "@sentry/nextjs";
import { loadEnvironment } from "./lib/environment";

export async function register() {
  // Load environment configuration first, before any other initialization
  loadEnvironment();

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
