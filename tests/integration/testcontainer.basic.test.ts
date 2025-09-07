import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import { Kysely, PostgresDialect, sql } from "kysely";

// Only run these tests when containers are enabled
const skipIfNoContainers = process.env.TEST_USE_CONTAINERS !== "true" ? it.skip : it;

describe("Testcontainer Basic Functionality", () => {
  let container: StartedPostgreSqlContainer;
  let db: Kysely<any>;

  beforeAll(async () => {
    if (process.env.TEST_USE_CONTAINERS === "true") {
      console.log("🐳 Starting PostgreSQL test container...");
      
      container = await new PostgreSqlContainer("postgres:16-alpine")
        .withDatabase("test_db")
        .withUsername("test_user")
        .withPassword("test_password")
        .withExposedPorts(5432)
        .start();
        
      console.log("✅ PostgreSQL container started");

      // Create database connection
      const connectionString = container.getConnectionUri();
      const dialect = new PostgresDialect({
        pool: new Pool({ 
          connectionString,
          max: 10,
          ssl: false
        }),
      });

      db = new Kysely({ dialect });
    }
  }, 300000);

  afterAll(async () => {
    if (process.env.TEST_USE_CONTAINERS === "true") {
      if (db) {
        await db.destroy();
      }
      if (container) {
        await container.stop();
      }
    }
  }, 30000);

  skipIfNoContainers("should connect to PostgreSQL container", async () => {
    const result = await db.selectFrom(sql`(SELECT 1 as test_value)`.as('test_query')).selectAll().execute();
    expect(result).toHaveLength(1);
    expect(result[0].test_value).toBe(1);
  });

  skipIfNoContainers("should create and query a simple table", async () => {
    // Create a test table
    await db.schema
      .createTable("test_users")
      .addColumn("id", "serial", (col) => col.primaryKey())
      .addColumn("name", "varchar(50)", (col) => col.notNull())
      .addColumn("email", "varchar(100)", (col) => col.notNull().unique())
      .execute();

    // Insert test data
    const insertResult = await db
      .insertInto("test_users")
      .values([
        { name: "John Doe", email: "john@example.com" },
        { name: "Jane Smith", email: "jane@example.com" }
      ])
      .returning("id")
      .execute();

    expect(insertResult).toHaveLength(2);

    // Query the data
    const users = await db
      .selectFrom("test_users")
      .selectAll()
      .orderBy("name")
      .execute();

    expect(users).toHaveLength(2);
    expect(users[0].name).toBe("Jane Smith");
    expect(users[0].email).toBe("jane@example.com");
    expect(users[1].name).toBe("John Doe");
    expect(users[1].email).toBe("john@example.com");
  });

  skipIfNoContainers("should handle constraints properly", async () => {
    // Try to insert duplicate email
    await expect(
      db.insertInto("test_users")
        .values({ name: "Duplicate User", email: "john@example.com" })
        .execute()
    ).rejects.toThrow();
  });

  skipIfNoContainers("should perform transactions", async () => {
    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto("test_users")
        .values({ name: "Transaction User", email: "tx@example.com" })
        .execute();

      const users = await trx
        .selectFrom("test_users")
        .select(["name", "email"])
        .where("email", "=", "tx@example.com")
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe("Transaction User");
    });

    // Verify transaction was committed
    const users = await db
      .selectFrom("test_users")
      .select("name")
      .where("email", "=", "tx@example.com")
      .execute();

    expect(users).toHaveLength(1);
  });

  skipIfNoContainers("should clean up between operations", async () => {
    // Delete all test data
    await db.deleteFrom("test_users").execute();
    
    const users = await db.selectFrom("test_users").selectAll().execute();
    expect(users).toHaveLength(0);
  });
});