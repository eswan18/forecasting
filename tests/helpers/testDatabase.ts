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
 */
export async function cleanupTestData(
  db: Kysely<Database>,
  trackedIds: TrackedIds,
): Promise<void> {
  // If no tracked IDs, nothing to clean up
  if (Object.keys(trackedIds).length === 0) {
    return;
  }

  // Clean in dependency order (child tables first, parent tables last)
  // This ensures foreign key constraints are respected

  const cleanupOperations = [
    // Child tables first
    {
      name: "forecasts",
      operation: () => {
        const ids = trackedIds["forecasts"];
        if (!ids || ids.length === 0) return Promise.resolve();
        return db.deleteFrom("forecasts").where("id", "in", ids).execute();
      },
    },
    {
      name: "resolutions",
      operation: () => {
        const ids = trackedIds["resolutions"];
        if (!ids || ids.length === 0) return Promise.resolve();
        return db.deleteFrom("resolutions").where("id", "in", ids).execute();
      },
    },
    {
      name: "feature_flags",
      operation: () => {
        const ids = trackedIds["feature_flags"];
        if (!ids || ids.length === 0) return Promise.resolve();
        return db.deleteFrom("feature_flags").where("id", "in", ids).execute();
      },
    },
    {
      name: "password_reset_tokens",
      operation: () => {
        const ids = trackedIds["password_reset_tokens"];
        if (!ids || ids.length === 0) return Promise.resolve();
        return db
          .deleteFrom("password_reset_tokens")
          .where("id", "in", ids)
          .execute();
      },
    },
    {
      name: "suggested_props",
      operation: () => {
        const ids = trackedIds["suggested_props"];
        if (!ids || ids.length === 0) return Promise.resolve();
        return db
          .deleteFrom("suggested_props")
          .where("id", "in", ids)
          .execute();
      },
    },
    {
      name: "props",
      operation: () => {
        const ids = trackedIds["props"];
        if (!ids || ids.length === 0) return Promise.resolve();
        return db.deleteFrom("props").where("id", "in", ids).execute();
      },
    },
    {
      name: "competitions",
      operation: () => {
        const ids = trackedIds["competitions"];
        if (!ids || ids.length === 0) return Promise.resolve();
        // Filter out seed competitions (IDs 1 and 2) just to be safe
        const idsToDelete = ids.filter((id) => id !== 1 && id !== 2);
        if (idsToDelete.length === 0) return Promise.resolve();
        return db
          .deleteFrom("competitions")
          .where("id", "in", idsToDelete)
          .execute();
      },
    },
    {
      name: "users",
      operation: () => {
        const ids = trackedIds["users"];
        if (!ids || ids.length === 0) return Promise.resolve();
        return db.deleteFrom("users").where("id", "in", ids).execute();
      },
    },
    {
      name: "logins",
      operation: () => {
        const ids = trackedIds["logins"];
        if (!ids || ids.length === 0) return Promise.resolve();
        return db.deleteFrom("logins").where("id", "in", ids).execute();
      },
    },
    {
      name: "invite_tokens",
      operation: () => {
        const ids = trackedIds["invite_tokens"];
        if (!ids || ids.length === 0) return Promise.resolve();
        return db.deleteFrom("invite_tokens").where("id", "in", ids).execute();
      },
    },
  ];

  // Execute each cleanup operation individually
  for (const { name, operation } of cleanupOperations) {
    try {
      await operation();
    } catch (error: any) {
      // Handle missing tables gracefully
      if (error.message?.includes("does not exist")) {
        if (process.env.VERBOSE_TESTS === "true") {
          console.log(`Skipping cleanup of ${name} (table does not exist)`);
        }
      } else if (error.code === "23503") {
        // Foreign key violation - this shouldn't happen with proper ordering, but log it
        if (process.env.VERBOSE_TESTS === "true") {
          console.warn(
            `Foreign key constraint preventing cleanup of ${name}:`,
            error.message,
          );
        }
      } else {
        // Log other errors but don't fail tests
        if (process.env.VERBOSE_TESTS === "true") {
          console.warn(`Warning cleaning ${name}:`, error.message);
        }
      }
    }
  }
}
