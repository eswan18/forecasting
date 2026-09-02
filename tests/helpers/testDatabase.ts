import { Pool } from "pg";
import { Kysely, PostgresDialect, Transaction, sql } from "kysely";
import { Database } from "@/types/db_types";
import { TrackedIds } from "./testIdTracker";

// Singleton instance to prevent too many client connections
let testDbInstance: Kysely<Database> | null = null;
let rlsTestDbInstance: Kysely<Database> | null = null;

/**
 * Get the test database connection that was set up by global setup
 * Uses a singleton pattern to prevent connection pool exhaustion
 */
export async function getTestDb(): Promise<Kysely<Database>> {
  // Return existing instance if available
  if (testDbInstance) {
    return testDbInstance;
  }

  // Check if we're using containers
  const useContainers = process.env.TEST_USE_CONTAINERS === "true";

  if (!useContainers) {
    throw new Error(
      "TEST_USE_CONTAINERS is not set to 'true'. Cannot get test database.",
    );
  }

  // Get the connection string from environment variable set by globalSetup.ts
  const connectionString = process.env.TEST_DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Test database not initialized. Make sure globalSetup.ts ran successfully.\n" +
        "This usually means Docker is not available or global setup failed.",
    );
  }

  const dialect = new PostgresDialect({
    pool: new Pool({
      connectionString,
      max: 5, // Reduced from 10 to prevent connection exhaustion
      ssl: false,
    }),
  });

  testDbInstance = new Kysely<Database>({ dialect });
  return testDbInstance;
}

/**
 * Get a test database connection as `app_user`, the non-owner role created by
 * globalSetup.ts.
 *
 * `getTestDb()` connects as the container's superuser, which owns every table
 * and therefore bypasses row-level security. Queries issued through this
 * connection are subject to the RLS policies, so it is the only way to assert
 * what a policy actually does. Pair it with `asUser` to choose the acting user.
 */
export async function getRlsTestDb(): Promise<Kysely<Database>> {
  if (rlsTestDbInstance) {
    return rlsTestDbInstance;
  }

  const useContainers = process.env.TEST_USE_CONTAINERS === "true";

  if (!useContainers) {
    throw new Error(
      "TEST_USE_CONTAINERS is not set to 'true'. Cannot get RLS test database.",
    );
  }

  const connectionString = process.env.TEST_RLS_DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "RLS test database not initialized. Make sure globalSetup.ts ran successfully.\n" +
        "This usually means Docker is not available or global setup failed.",
    );
  }

  const dialect = new PostgresDialect({
    pool: new Pool({
      connectionString,
      max: 5,
      ssl: false,
    }),
  });

  rlsTestDbInstance = new Kysely<Database>({ dialect });
  return rlsTestDbInstance;
}

/**
 * Run `fn` in a transaction with `app.current_user_id` set, exactly the way
 * `withRLS` in lib/db-helpers.ts does it in application code. Pass `null` to
 * act as an unauthenticated visitor (`current_user_id()` then returns NULL,
 * because the helper reads the setting with `NULLIF(..., '')::integer`).
 */
export async function asUser<T>(
  db: Kysely<Database>,
  userId: number | null,
  fn: (trx: Transaction<Database>) => Promise<T>,
): Promise<T> {
  return db.transaction().execute(async (trx) => {
    await sql`SELECT set_config('app.current_user_id', ${
      userId === null ? "" : String(userId)
    }, true)`.execute(trx);
    return fn(trx);
  });
}

/**
 * Clean up test data using tracked IDs.
 * Only deletes IDs that were tracked for the current test, enabling parallel test execution.
 * Deletes in reverse order of insertion to guarantee safe foreign key handling.
 */
export async function cleanupTestData(
  db: Kysely<Database>,
  trackedInserts: TrackedIds,
): Promise<void> {
  if (trackedInserts.length === 0) {
    return;
  }

  const reversed = [...trackedInserts].reverse();

  for (const insert of reversed) {
    try {
      await (db as any)
        .deleteFrom(insert.table)
        .where("id", "=", insert.id)
        .execute();
    } catch (error) {
      console.error(
        `Error deleting ${insert.table} with id ${insert.id}:`,
        error,
      );
    }
  }
}
