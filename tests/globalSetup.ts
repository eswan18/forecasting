import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import {
  Kysely,
  PostgresDialect,
  Migrator,
  FileMigrationProvider,
} from "kysely";
import { createMigrator } from "./helpers/migrator";
import { Database } from "@/types/db_types";
import { promises as fs } from "fs";
import path from "path";

// Set test environment variables before any modules that depend on them are imported
// This ensures consistent test values across all test files
process.env.JWT_SECRET = "test_jwt_secret";
process.env.ARGON2_SALT = "test_salt";

// Global container and database instances
let globalContainer: any = null;
let globalDb: Kysely<Database> | null = null;

export async function setup() {
  const useContainers = process.env.TEST_USE_CONTAINERS === "true";

  if (!useContainers) {
    return;
  }

  console.log("Setting up global PostgreSQL test container...");

  try {
    // Start PostgreSQL container
    globalContainer = await new PostgreSqlContainer("postgres:16-alpine")
      .withDatabase("test_forecasting")
      .withUsername("test_user")
      .withPassword("test_password")
      .withExposedPorts(5432)
      .withStartupTimeout(120000) // 2 minutes max
      .start();

    console.log("Global PostgreSQL container started");

    // Create database connection
    const connectionString = globalContainer.getConnectionUri();
    const dialect = new PostgresDialect({
      pool: new Pool({
        connectionString,
        max: 5, // Reduced to prevent connection exhaustion with multiple test files
        ssl: false, // No SSL for test containers
      }),
    });

    globalDb = new Kysely<Database>({ dialect });

    // Run migrations
    console.log("Running database migrations...");

    const migrator = createMigrator(globalDb);

    const { error, results } = await migrator.migrateToLatest();

    if (error) {
      console.error("Failed to migrate test database:", error);
      throw error;
    }

    if (results) {
      console.log(`Applied ${results.length} migrations successfully`);
      // Only log individual migrations in verbose mode
      if (process.env.VERBOSE_TESTS === "true") {
        results.forEach(({ status, migrationName }) => {
          console.log(`  • ${migrationName}: ${status}`);
        });
      }
    }

    // Store connection info in environment variables that tests can access
    process.env.TEST_DATABASE_URL = connectionString;

    console.log("Global test database setup complete");
  } catch (error: any) {
    // Provide helpful error messages for common Docker issues
    if (error.message?.includes("Cannot connect to the Docker daemon")) {
      throw new Error(
        "Docker daemon is not running. Please start Docker Desktop or your Docker service.\n" +
          "To run tests without containers, use: npm run test (without TEST_USE_CONTAINERS=true)",
      );
    } else if (error.message?.includes("docker: command not found")) {
      throw new Error(
        "Docker is not installed. Please install Docker Desktop.\n" +
          "To run tests without containers, use: npm run test (without TEST_USE_CONTAINERS=true)",
      );
    } else if (error.message?.includes("permission denied")) {
      throw new Error(
        "Permission denied accessing Docker. Please ensure your user is in the docker group.\n" +
          "To run tests without containers, use: npm run test (without TEST_USE_CONTAINERS=true)",
      );
    } else if (error.message?.includes("timeout")) {
      throw new Error(
        "Timeout starting PostgreSQL container. This may be due to slow network or system resources.\n" +
          "Try again or use: npm run test (without TEST_USE_CONTAINERS=true)",
      );
    } else {
      // Re-throw with additional context for unknown errors
      throw new Error(
        `Failed to start PostgreSQL test container: ${error.message}\n` +
          "To run tests without containers, use: npm run test (without TEST_USE_CONTAINERS=true)",
      );
    }
  }
}

export async function teardown() {
  const useContainers = process.env.TEST_USE_CONTAINERS === "true";

  if (!useContainers) {
    return;
  }

  console.log("Cleaning up global test container...");

  if (globalDb) {
    await globalDb.destroy();
    globalDb = null;
  }

  if (globalContainer) {
    await globalContainer.stop();
    globalContainer = null;
  }

  console.log("Global cleanup complete");
}
