import { describe, it, expect, beforeEach } from "vitest";
import { getTestDb, cleanupTestData } from "../helpers/testDatabase";
import { TestDataFactory } from "../helpers/testFactories";
import { registerNewUser } from "@/lib/auth/register-internal";

// Only run these tests when containers are enabled
const skipIfNoContainers = process.env.TEST_USE_CONTAINERS !== "true" ? it.skip : it;

describe("Users Integration Tests", () => {
  let testDb: any;
  let factory: TestDataFactory;

  // Database setup handled by global tests/setup.ts

  beforeEach(async () => {
    if (process.env.TEST_USE_CONTAINERS === "true") {
      testDb = await getTestDb();
      factory = new TestDataFactory(testDb);
      await cleanupTestData(testDb);
    }
  });

  skipIfNoContainers("should create user with real database", async () => {
    const username = "johndoe";
    const password = "hashed_password_123";
    const name = "John Doe";
    const email = "john@example.com";

    const result = await registerNewUser({ username, password, name, email });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // Verify user was created
    const createdUser = await testDb
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst();

    expect(createdUser).toBeDefined();
    expect(createdUser.name).toBe(name);
    expect(createdUser.email).toBe(email);

    // Verify login linkage
    const login = await testDb
      .selectFrom("logins")
      .selectAll()
      .where("username", "=", username)
      .executeTakeFirst();

    expect(login).toBeDefined();
    expect(createdUser.login_id).toBe(login.id);
  });

  skipIfNoContainers("should handle duplicate email constraint", async () => {
    // Create first user using factory
    const firstUser = await factory.createUser({
      name: "Jane Doe",
      email: "duplicate@example.com"
    });

    expect(firstUser).toBeDefined();

    // Try to create duplicate user with same email using factory
    await expect(
      factory.createUser({
        name: "Jane Doe 2",
        email: "duplicate@example.com"
      })
    ).rejects.toThrow();
  });

  skipIfNoContainers("should create user using factory", async () => {
    const user = await factory.createUser({
      username: "factoryuser",
      email: "factory@example.com",
    });

    expect(user).toBeDefined();
    expect(user.username).toBe("factoryuser");
    expect(user.email).toBe("factory@example.com");

    // Verify in database
    const dbUser = await testDb
      .selectFrom("users")
      .selectAll()
      .where("email", "=", user.email)
      .executeTakeFirst();

    expect(dbUser).toBeDefined();
    expect(dbUser.email).toBe(user.email);
  });

  skipIfNoContainers("should create multiple users", async () => {
    const user1 = await factory.createUser({ username: "user1" });
    const user2 = await factory.createUser({ username: "user2" });

    expect(user1.id).not.toBe(user2.id);
    expect(user1.email).not.toBe(user2.email);

    // Verify both exist in database (plus admin user from seed data)
    const users = await testDb.selectFrom("users").selectAll().execute();
    expect(users).toHaveLength(3); // 2 test users + 1 admin user
  });

  skipIfNoContainers("should create admin user", async () => {
    const adminUser = await factory.createAdminUser({
      username: "admin1",
    });

    expect(adminUser.is_admin).toBe(true);

    // Verify in database
    const dbUser = await testDb
      .selectFrom("users")
      .selectAll()
      .where("email", "=", adminUser.email)
      .executeTakeFirst();

    expect(dbUser.is_admin).toBe(true);
  });
});