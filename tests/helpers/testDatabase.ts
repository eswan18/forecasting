import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { Database } from "@/types/db_types";
import { TrackedIds } from "./testIdTracker";

// Singleton instance to prevent too many client connections
let testDbInstance: Kysely<Database> | null = null;

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
    if (
      insert.table === "competitions" &&
      (insert.id === 1 || insert.id === 2)
    ) {
      continue;
    }

    try {
      await (db as any)
        .deleteFrom(insert.table)
        .where("id", "=", insert.id)
        .execute();
    } catch (error) {
      // Silently ignore errors during cleanup
    }
  }
}
