import { vi, describe, it, expect, beforeEach, beforeAll } from "vitest";
import { getTestDb } from "../helpers/testDatabase";
import { TestDataFactory } from "../helpers/testFactories";

// Set environment variables before any imports that depend on them
beforeAll(() => {
  vi.stubEnv("JWT_SECRET", "test_jwt_secret");
  vi.stubEnv("ARGON2_SALT", "test_salt");
});

// Import the login functions after setting up the environment
let login: typeof import("@/lib/auth/login").login;
let loginViaImpersonation: typeof import("@/lib/auth/login").loginViaImpersonation;

beforeAll(async () => {
  const loginModule = await import("@/lib/auth/login");
  login = loginModule.login;
  loginViaImpersonation = loginModule.loginViaImpersonation;
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

// Mock getUserFromCookies
vi.mock("@/lib/get-user", () => ({
  getUserFromCookies: vi.fn(),
}));

// Mock the db_actions module - we'll replace the implementation in beforeEach
vi.mock("@/lib/db_actions", () => ({
  getLoginByUsername: vi.fn(),
  createLogin: vi.fn(),
  createUser: vi.fn(),
}));

import { getUserFromCookies } from "@/lib/get-user";
import { getLoginByUsername } from "@/lib/db_actions";

describe("Authentication Login", () => {
  let testDb: any;
  let factory: TestDataFactory;

  beforeEach(async () => {
    testDb = await getTestDb();
    factory = new TestDataFactory(testDb);
    vi.clearAllMocks();

    // Replace the mocked getLoginByUsername with our test database implementation
    vi.mocked(getLoginByUsername).mockImplementation(
      async (username: string) => {
        const result = await testDb
          .selectFrom("logins")
          .selectAll()
          .where("username", "=", username)
          .executeTakeFirst();
        return result;
      },
    );
  });

  describe("login", () => {
    beforeEach(async () => {
      testDb = await getTestDb();
      factory = new TestDataFactory(testDb);
      vi.clearAllMocks();
    });

    it("should login successfully with valid credentials", async () => {
      // Create a user with login credentials
      const testUser = await factory.createUser({
        username: "testuser",
        password: "mypassword",
      });

      // The factory already created the login record and linked it to the user

      const result = await login({
        username: "testuser",
        password: "mypassword",
      });

      expect(result.success).toBe(true);
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "token",
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          maxAge: 108000,
          path: "/",
        }),
      );
    });

    it("should fail login with invalid username", async () => {
      const result = await login({
        username: "nonexistent",
        password: "anypassword",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid username or password.");
      }
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it("should fail login with invalid password", async () => {
      // Create a user with login credentials
      const testUser = await factory.createUser({
        username: "testuser",
      });

      // The factory already created the login record and linked it to the user

      const result = await login({
        username: "testuser",
        password: "wrongpassword",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid username or password.");
      }
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

  });

  describe("loginViaImpersonation", () => {
    beforeEach(async () => {
      testDb = await getTestDb();
      factory = new TestDataFactory(testDb);
      vi.clearAllMocks();
    });

    it("should allow admin to impersonate another user", async () => {
      // Create admin user
      const adminUser = await factory.createAdminUser({
        username: "testadmin",
      });

      // Create target user to impersonate
      const targetUser = await factory.createUser({
        username: "targetuser",
      });

      // The factory already created the login records and linked them to the users

      // Mock admin user session
      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        is_admin: true,
        login_id: adminUser.login_id,
        username: adminUser.username || null,
      });

      await expect(loginViaImpersonation("targetuser")).resolves.not.toThrow();

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "token",
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          maxAge: 108000,
          path: "/",
        }),
      );
    });

    it("should reject impersonation by non-admin user", async () => {
      // Create regular user
      const regularUser = await factory.createUser({
        username: "regularuser",
      });

      // Create target user
      const targetUser = await factory.createUser({
        username: "targetuser",
      });

      // Mock regular user session
      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: regularUser.id,
        name: regularUser.name,
        email: regularUser.email,
        is_admin: false,
        login_id: regularUser.login_id,
        username: regularUser.username || null,
      });

      await expect(loginViaImpersonation("targetuser")).rejects.toThrow(
        "Not authorized.",
      );

      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it("should reject impersonation when not logged in", async () => {
      vi.mocked(getUserFromCookies).mockResolvedValue(null);

      await expect(loginViaImpersonation("targetuser")).rejects.toThrow(
        "Not authorized.",
      );

      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it("should reject impersonation of non-existent user", async () => {
      // Create admin user
      const adminUser = await factory.createAdminUser();

      // Mock admin user session
      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        is_admin: true,
        login_id: adminUser.login_id,
        username: adminUser.username || null,
      });

      await expect(loginViaImpersonation("nonexistentuser")).rejects.toThrow(
        "Invalid username.",
      );

      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });
  });
});
