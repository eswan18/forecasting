import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { Database } from "@/types/db_types";

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

export async function cleanupTestData(db: Kysely<Database>): Promise<void> {
  // Clean up test data while preserving seed data (categories, admin user)
  // Handle table cleanup individually to avoid transaction rollbacks on missing tables

  const cleanupOperations = [
    // Clean in dependency order (child tables first, parent tables last)

    // Clean ALL feature_flags FIRST (they reference users via foreign key)
    {
      name: "feature_flags",
      operation: () => db.deleteFrom("feature_flags").execute(),
    },

    {
      name: "forecasts",
      operation: () => db.deleteFrom("forecasts").execute(),
    },
    {
      name: "resolutions",
      operation: () => db.deleteFrom("resolutions").execute(),
    },
    {
      name: "password_resets",
      operation: () => db.deleteFrom("password_reset_tokens").execute(),
    },
    {
      name: "invite_tokens",
      operation: () => db.deleteFrom("invite_tokens").execute(),
    },
    {
      name: "suggested_props",
      operation: () => db.deleteFrom("suggested_props").execute(),
    },
    { name: "props", operation: () => db.deleteFrom("props").execute() },

    // Clean test competitions (but preserve seed competitions with IDs 1 and 2)
    {
      name: "competitions",
      operation: () =>
        db.deleteFrom("competitions").where("id", "not in", [1, 2]).execute(),
    },

    // Delete users after all tables that reference them are cleaned
    {
      name: "users",
      operation: () => db.deleteFrom("users").execute(),
    },

    // Delete logins last (no more foreign key references)
    {
      name: "logins",
      operation: () => db.deleteFrom("logins").execute(),
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
        // Foreign key violation
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
