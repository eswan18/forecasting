import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { Database } from "@/types/db_types";

/**
 * Get the test database connection that was set up by global setup
 */
export async function getTestDb(): Promise<Kysely<Database>> {
  // Check if we're using containers
  const useContainers = process.env.TEST_USE_CONTAINERS === "true";
  
  if (!useContainers) {
    throw new Error("TEST_USE_CONTAINERS is not set to 'true'. Cannot get test database.");
  }

  // Get the connection string from environment variable set by globalSetup.ts
  const connectionString = process.env.__TEST_DATABASE_URL__;
  
  if (!connectionString) {
    throw new Error(
      "Test database not initialized. Make sure globalSetup.ts ran successfully.\n" + 
      "This usually means Docker is not available or global setup failed."
    );
  }

  const dialect = new PostgresDialect({
    pool: new Pool({ 
      connectionString,
      max: 10,
      ssl: false
    }),
  });

  return new Kysely<Database>({ dialect });
}

export async function cleanupTestData(db: Kysely<Database>): Promise<void> {
  // Clean up test data in proper order to respect foreign key constraints
  // NOTE: We preserve seed data (categories, admin user) between tests
  
  // Clean in dependency order (child tables first, parent tables last)
  const cleanupOrder = [
    // Leaf tables first (tables that other tables reference)
    "forecasts",       // References users, props
    "resolutions",     // References users, props
    "password_resets", // References users
    "invite_tokens",   // References users  
    "suggested_props", // References users
    
    // Props references users, competitions, categories
    "props",
    
    // Competitions (props reference this)
    "competitions", 
    
    // Feature flags that are test-created only
    { table: "feature_flags", where: ["name", "not in", ["2025-forecasts", "personal-props"]] },
    
    // Users (but preserve admin user)
    { table: "users", where: ["id", "!=", 1] },
    
    // Logins (but preserve admin login)
    { table: "logins", where: ["username", "!=", "admin"] }
  ];
  
  for (const item of cleanupOrder) {
    try {
      if (typeof item === "string") {
        // Simple table cleanup
        await db.deleteFrom(item as any).execute();
      } else {
        // Conditional cleanup
        const query = db.deleteFrom(item.table as any);
        const [column, operator, value] = item.where;
        await query.where(column as any, operator as any, value as any).execute();
      }
    } catch (error: any) {
      // Ignore "relation does not exist" errors for optional tables
      if (!error.message?.includes('does not exist')) {
        // Log warnings for debugging but don't fail tests
        if (process.env.VERBOSE_TESTS === "true") {
          console.warn(`Warning cleaning ${typeof item === "string" ? item : item.table}:`, error.message);
        }
      }
    }
  }
}