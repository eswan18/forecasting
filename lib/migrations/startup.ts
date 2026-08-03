/**
 * The `instrumentation.ts` entry point for the migration check in `./check`.
 *
 * Kept separate from `./check` so the check itself stays importable without a
 * database: this module reaches for `@/lib/database`, whose module-level
 * connection throws when `DATABASE_URL` is unset.
 */

import { writeSync } from "node:fs";

import { verifyMigrations } from "./check";

/**
 * Verifies the database schema against this build's migration manifest and
 * kills the process if they disagree.
 *
 * `process.exit` rather than `throw`: Next.js catches a throw from `register()`
 * and keeps the server up, listening and answering every request (including
 * `/api/health`) with a 500 — the process stays alive and the container looks
 * "started", which is precisely the ambiguous failure this check exists to
 * replace. Exiting non-zero makes it an unmistakable boot failure.
 *
 * The message goes out with `writeSync` because `process.exit` does not flush
 * pending async writes, and `stderr` is a pipe (not a TTY) under Docker and
 * Kubernetes — `console.error` alone can be truncated away exactly when the
 * message matters most.
 *
 * This runs in every environment, local `next dev` included: a dev database
 * that has not been migrated refuses to boot. That is deliberate, and matches
 * the identity service.
 */
export async function verifyMigrationsOrExit(): Promise<void> {
  const { db } = await import("@/lib/database");

  const result = await verifyMigrations(db);
  if (result.ok) {
    return;
  }

  writeSync(2, `\n${result.message}\n\n`);
  process.exit(1);
}
