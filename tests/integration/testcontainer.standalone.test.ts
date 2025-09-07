import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

// Skip the global setup by testing without the TEST_USE_CONTAINERS flag in a different way
const skipIfNoDocker = !process.env.TEST_USE_CONTAINERS ? it.skip : it;

describe("Testcontainer Standalone Test", () => {
  let container: StartedPostgreSqlContainer | null = null;
  let db: Kysely<any> | null = null;

  beforeAll(async () => {
    if (process.env.TEST_USE_CONTAINERS === "true") {
      console.log("🐳 Starting standalone PostgreSQL test container...");
      
      container = await new PostgreSqlContainer("postgres:16-alpine")
        .withDatabase("standalone_test")
        .withUsername("test_user")
        .withPassword("test_password")
        .withExposedPorts(5432)
        .start();
        
      console.log("✅ Standalone PostgreSQL container started");

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
      console.log("✅ Database connection established");
    }
  }, 300000);

  afterAll(async () => {
    if (container && db) {
      console.log("🧹 Cleaning up test container...");
      await db.destroy();
      await container.stop();
      console.log("✅ Cleanup complete");
    }
  }, 30000);

  skipIfNoDocker("should verify testcontainer setup works", async () => {
    expect(db).toBeDefined();
    expect(container).toBeDefined();
    
    // Test basic connectivity with a simple query
    const result = await db!
      .selectNoFrom(({ val }) => [
        val(1).as('test_value'),
        val('testcontainers_working').as('status')
      ])
      .execute();
    
    expect(result).toHaveLength(1);
    expect(Number(result[0].test_value)).toBe(1);
    expect(result[0].status).toBe('testcontainers_working');
    
    console.log("📊 Connection test:", result[0]);
  });

  skipIfNoDocker("should create tables and handle basic operations", async () => {
    // Create a simple users table
    await db!.schema
      .createTable("simple_users")
      .addColumn("id", "serial", (col) => col.primaryKey())
      .addColumn("username", "varchar(50)", (col) => col.notNull().unique())
      .addColumn("email", "varchar(100)", (col) => col.notNull())
      .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo("now()"))
      .execute();

    console.log("✅ Created simple_users table");

    // Insert test data
    const insertedUsers = await db!
      .insertInto("simple_users")
      .values([
        { username: "testuser1", email: "user1@test.com" },
        { username: "testuser2", email: "user2@test.com" },
        { username: "admin", email: "admin@test.com" }
      ])
      .returning(["id", "username"])
      .execute();

    expect(insertedUsers).toHaveLength(3);
    console.log("✅ Inserted 3 test users");

    // Query and verify data
    const allUsers = await db!
      .selectFrom("simple_users")
      .selectAll()
      .orderBy("username")
      .execute();

    expect(allUsers).toHaveLength(3);
    expect(allUsers[0].username).toBe("admin");
    expect(allUsers[1].username).toBe("testuser1");
    expect(allUsers[2].username).toBe("testuser2");

    // Test timestamps are working
    expect(allUsers[0].created_at).toBeInstanceOf(Date);
    
    console.log("✅ Verified data integrity and timestamps");
  });

  skipIfNoDocker("should handle database constraints", async () => {
    // Test unique constraint
    await expect(
      db!.insertInto("simple_users")
        .values({ username: "testuser1", email: "duplicate@test.com" })
        .execute()
    ).rejects.toThrow();

    console.log("✅ Unique constraints working correctly");
  });

  skipIfNoDocker("should support transactions", async () => {
    const initialCount = await db!
      .selectFrom("simple_users")
      .select(db!.fn.count("id").as("count"))
      .executeTakeFirst();

    await db!.transaction().execute(async (trx) => {
      // Insert a user within transaction
      await trx
        .insertInto("simple_users")
        .values({ username: "txuser", email: "tx@test.com" })
        .execute();

      // Verify it exists within transaction
      const txUsers = await trx
        .selectFrom("simple_users")
        .select("username")
        .where("username", "=", "txuser")
        .execute();
      
      expect(txUsers).toHaveLength(1);
    });

    // Verify transaction was committed
    const finalCount = await db!
      .selectFrom("simple_users")
      .select(db!.fn.count("id").as("count"))
      .executeTakeFirst();

    expect(Number(finalCount!.count)).toBe(Number(initialCount!.count) + 1);
    console.log("✅ Transactions working correctly");
  });

  skipIfNoDocker("should demonstrate realistic test data patterns", async () => {
    // Create a more complex table structure
    await db!.schema
      .createTable("test_posts")
      .addColumn("id", "serial", (col) => col.primaryKey())
      .addColumn("user_id", "integer", (col) => col.notNull().references("simple_users.id"))
      .addColumn("title", "varchar(200)", (col) => col.notNull())
      .addColumn("content", "text")
      .addColumn("published", "boolean", (col) => col.notNull().defaultTo(false))
      .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo("now()"))
      .execute();

    // Get a user to create posts for
    const user = await db!
      .selectFrom("simple_users")
      .select("id")
      .where("username", "=", "testuser1")
      .executeTakeFirst();

    expect(user).toBeDefined();

    // Create posts
    await db!
      .insertInto("test_posts")
      .values([
        { user_id: user!.id, title: "First Post", content: "Hello World!", published: true },
        { user_id: user!.id, title: "Draft Post", content: "Work in progress", published: false }
      ])
      .execute();

    // Test joins
    const postsWithUsers = await db!
      .selectFrom("test_posts")
      .innerJoin("simple_users", "simple_users.id", "test_posts.user_id")
      .select([
        "test_posts.title",
        "test_posts.published",
        "simple_users.username"
      ])
      .where("simple_users.username", "=", "testuser1")
      .orderBy("test_posts.created_at")
      .execute();

    expect(postsWithUsers).toHaveLength(2);
    expect(postsWithUsers[0].title).toBe("First Post");
    expect(postsWithUsers[0].published).toBe(true);
    expect(postsWithUsers[0].username).toBe("testuser1");

    console.log("✅ Complex queries and relationships working");
  });
});