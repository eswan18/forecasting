import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import { getTestDb, cleanupTestData } from "../helpers/testDatabase";
import { TestDataFactory } from "../helpers/testFactories";

// Set environment variables before any imports that depend on them
beforeAll(() => {
  vi.stubEnv("JWT_SECRET", "test_jwt_secret");
  vi.stubEnv("ARGON2_SALT", "test_salt");
});

// Mock cookies
const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Import the login function after setting up mocks
let login: typeof import("@/lib/auth/login").login;

beforeAll(async () => {
  const loginModule = await import("@/lib/auth/login");
  login = loginModule.login;
});

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
