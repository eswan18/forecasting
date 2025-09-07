import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import { Kysely, PostgresDialect, Migrator, FileMigrationProvider } from "kysely";
import { Database } from "@/types/db_types";
import { promises as fs } from "fs";
import path from "path";

let globalContainer: StartedPostgreSqlContainer | null = null;
let globalDb: Kysely<Database> | null = null;

export async function setupTestDatabase(): Promise<Kysely<Database>> {
  if (globalDb) {
    return globalDb;
  }

  console.log("🐳 Starting PostgreSQL test container...");
  
  // Start PostgreSQL container
  globalContainer = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("test_forecasting")
    .withUsername("test_user")
    .withPassword("test_password")
    .withExposedPorts(5432)
    .withStartupTimeout(120000) // 2 minutes max
    .start();
    
  console.log("✅ PostgreSQL container started");

  // Create database connection
  const connectionString = globalContainer.getConnectionUri();
  const dialect = new PostgresDialect({
    pool: new Pool({ 
      connectionString,
      max: 10,
      ssl: false // No SSL for test containers
    }),
  });

  globalDb = new Kysely<Database>({ dialect });

  // Run migrations
  await runMigrations(globalDb);

  return globalDb;
}

async function runMigrations(db: Kysely<Database>) {
  console.log("🔄 Running database migrations...");
  
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(process.cwd(), "migrations"),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  if (error) {
    console.error("❌ Failed to migrate test database:", error);
    throw error;
  }

  if (results) {
    console.log(`✅ Applied ${results.length} migrations successfully`);
    results.forEach(({ status, migrationName }) => {
      console.log(`  • ${migrationName}: ${status}`);
    });
  }
}

export async function cleanupTestDatabase(): Promise<void> {
  if (globalDb) {
    await globalDb.destroy();
    globalDb = null;
  }
  
  if (globalContainer) {
    await globalContainer.stop();
    globalContainer = null;
  }
}

export async function getTestDb(): Promise<Kysely<Database>> {
  if (!globalDb) {
    throw new Error("Test database not initialized. Call setupTestDatabase() first.");
  }
  return globalDb;
}

export async function cleanupTestData(db: Kysely<Database>): Promise<void> {
  // Clean up test data in proper order to respect foreign key constraints
  // Use try-catch to handle tables that may not exist in all test scenarios
  const tables = [
    "forecasts",
    "resolutions", 
    "props",
    "competitions",
    "password_resets",
    "invite_tokens", 
    "suggested_props",
    "feature_flags", // Must be before users due to foreign key
    "users",
    "logins" // Must be after users due to foreign key
  ];
  
  for (const table of tables) {
    try {
      await db.deleteFrom(table as any).execute();
    } catch (error: any) {
      // Ignore "relation does not exist" errors for optional tables
      if (!error.message?.includes('does not exist')) {
        throw error;
      }
    }
  }
}