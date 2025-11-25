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
 * Deletes in strict reverse order of insertion (stack-based) to guarantee safe foreign key handling.
 */
export async function cleanupTestData(
  db: Kysely<Database>,
  trackedInserts: TrackedIds,
): Promise<void> {
  // If no tracked inserts, nothing to clean up
  if (trackedInserts.length === 0) {
    return;
  }

  // Reverse the array to delete in reverse order of insertion
  // This guarantees that child records are deleted before parent records
  const reversed = [...trackedInserts].reverse();

  // Delete each insert one by one in reverse order
  for (const insert of reversed) {
    // Skip seed competitions (IDs 1 and 2)
    if (
      insert.table === "competitions" &&
      (insert.id === 1 || insert.id === 2)
    ) {
      continue;
    }

    try {
      // Use type assertion since Kysely doesn't have perfect type safety for dynamic table names
      await (db as any)
        .deleteFrom(insert.table)
        .where("id", "=", insert.id)
        .execute();
    } catch (error: any) {
      // Handle missing tables gracefully
      if (error.message?.includes("does not exist")) {
        if (process.env.VERBOSE_TESTS === "true") {
          console.log(
            `Skipping cleanup of ${insert.table} (table does not exist)`,
          );
        }
      } else if (error.code === "23503") {
        // Foreign key violation - this shouldn't happen with reverse order, but log it
        if (process.env.VERBOSE_TESTS === "true") {
          console.warn(
            `Foreign key constraint preventing cleanup of ${insert.table} (id: ${insert.id}):`,
            error.message,
          );
        }
      } else {
        // Log other errors but don't fail tests
        if (process.env.VERBOSE_TESTS === "true") {
          console.warn(
            `Warning cleaning ${insert.table} (id: ${insert.id}):`,
            error.message,
          );
        }
      }
    }
  }
}
