import { describe, it, expect, beforeEach } from "vitest";
import { getTestDb, cleanupTestData } from "../helpers/testDatabase";
import { TestDataFactory } from "../helpers/testFactories";
import { login } from "@/lib/auth";

// Only run these tests when containers are enabled
const skipIfNoContainers =
  process.env.TEST_USE_CONTAINERS !== "true" ? it.skip : it;

describe("Users Integration Tests", () => {
  let testDb: any;
  let factory: TestDataFactory;

  beforeEach(async () => {
    if (process.env.TEST_USE_CONTAINERS === "true") {
      testDb = await getTestDb();
      factory = new TestDataFactory(testDb);
      await cleanupTestData(testDb);
    }
  });

  skipIfNoContainers("should allow logging in with a create user account", async () => {
    const username = "johndoe";
    const password = "hashed_password_123";
    const name = "John Doe";
    const email = "john@example.com";

    // Use factory which properly handles the test database
    const createdUser = await factory.createUser({
      username,
      password,
      name,
      email,
    });
    
    const loginResponse = await login({
      username,
      password,
    });

    expect(loginResponse.success).toBe(true);
  });

  skipIfNoContainers("should prevent logins with invalid credentials", async () => {
    const loginResponse = await login({
      username: "invalid",
      password: "invalid",
    });
    expect(loginResponse.success).toBe(false);
    if (!loginResponse.success) {
      expect(loginResponse.error).toBe("Invalid username or password.");
    }
  });

  skipIfNoContainers("should prevent multiple users from having the same email", async () => {
    // Create first user using factory
    const firstUser = await factory.createUser({
      name: "Jane Doe",
      email: "duplicate@example.com",
    });

    expect(firstUser).toBeDefined();

    // Try to create duplicate user with same email using factory
    await expect(
      factory.createUser({
        name: "Jane Doe 2",
        email: "duplicate@example.com",
      }),
    ).rejects.toThrow();
  });
});
