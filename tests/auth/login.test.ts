import { describe, it, expect, beforeEach } from "vitest";
import { login, loginViaImpersonation } from "@/lib/auth/login";
import { getTestDb } from "../helpers/testDatabase";
import { TestDataFactory } from "../helpers/testFactories";

// Mock environment variables
vi.mock("process", () => ({
  env: {
    JWT_SECRET: "test_jwt_secret",
    ARGON2_SALT: "test_salt",
  },
}));

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

// We need to replace the db actions with our test database versions
vi.mock("@/lib/db_actions", async () => {
  const { getTestDb } = await import("../helpers/testDatabase");
  const db = await getTestDb();

  return {
    getLoginByUsername: async (username: string) => {
      const result = await db
        .selectFrom("users")
        .innerJoin("logins", "users.login_id", "logins.id")
        .select(["logins.id", "logins.username", "logins.password_hash"])
        .where("logins.username", "=", username)
        .executeTakeFirst();
      return result;
    },
  };
});

import { getUserFromCookies } from "@/lib/get-user";

describe("Authentication Login", () => {
  let testDb: any;
  let factory: TestDataFactory;

  beforeEach(async () => {
    testDb = await getTestDb();
    factory = new TestDataFactory(testDb);
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      // Create a user with login credentials
      const testUser = await factory.createUser({
        username: "testuser",
      });

      // Create a login record for this user
      const loginId = await testDb
        .insertInto("logins")
        .values({
          username: testUser.username,
          password_hash: testUser.password_hash, // Already hashed in factory
        })
        .returning("id")
        .executeTakeFirst();

      // Update user with login_id
      await testDb
        .updateTable("users")
        .set({ login_id: loginId.id })
        .where("id", "=", testUser.id)
        .execute();

      const result = await login({
        username: "testuser",
        password: "testpassword123", // Raw password, factory hashed it
      });

      expect(result.success).toBe(true);
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "token",
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          maxAge: 108000,
          path: "/",
        })
      );
    });

    it("should fail login with invalid username", async () => {
      const result = await login({
        username: "nonexistent",
        password: "anypassword",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid username or password.");
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it("should fail login with invalid password", async () => {
      // Create a user with login credentials
      const testUser = await factory.createUser({
        username: "testuser",
      });

      // Create a login record for this user
      const loginId = await testDb
        .insertInto("logins")
        .values({
          username: testUser.username,
          password_hash: testUser.password_hash,
        })
        .returning("id")
        .executeTakeFirst();

      // Update user with login_id
      await testDb
        .updateTable("users")
        .set({ login_id: loginId.id })
        .where("id", "=", testUser.id)
        .execute();

      const result = await login({
        username: "testuser",
        password: "wrongpassword",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid username or password.");
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it("should fail login when JWT_SECRET is not set", async () => {
      // Mock environment without JWT_SECRET
      vi.stubEnv("JWT_SECRET", "");

      const testUser = await factory.createUser({
        username: "testuser",
      });

      const loginId = await testDb
        .insertInto("logins")
        .values({
          username: testUser.username,
          password_hash: testUser.password_hash,
        })
        .returning("id")
        .executeTakeFirst();

      await testDb
        .updateTable("users")
        .set({ login_id: loginId.id })
        .where("id", "=", testUser.id)
        .execute();

      const result = await login({
        username: "testuser",
        password: "testpassword123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Internal error.");
      expect(mockCookieStore.set).not.toHaveBeenCalled();

      vi.unstubAllEnvs();
    });
  });

  describe("loginViaImpersonation", () => {
    it("should allow admin to impersonate another user", async () => {
      // Create admin user
      const adminUser = await factory.createAdminUser({
        username: "admin",
      });

      // Create target user to impersonate
      const targetUser = await factory.createUser({
        username: "targetuser",
      });

      // Create login records
      const adminLoginId = await testDb
        .insertInto("logins")
        .values({
          username: adminUser.username,
          password_hash: adminUser.password_hash,
        })
        .returning("id")
        .executeTakeFirst();

      const targetLoginId = await testDb
        .insertInto("logins")
        .values({
          username: targetUser.username,
          password_hash: targetUser.password_hash,
        })
        .returning("id")
        .executeTakeFirst();

      await testDb
        .updateTable("users")
        .set({ login_id: adminLoginId.id })
        .where("id", "=", adminUser.id)
        .execute();

      await testDb
        .updateTable("users")
        .set({ login_id: targetLoginId.id })
        .where("id", "=", targetUser.id)
        .execute();

      // Mock admin user session
      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: adminLoginId.id,
        name: adminUser.username,
        email: adminUser.email,
        is_admin: true,
      });

      await expect(
        loginViaImpersonation("targetuser")
      ).resolves.not.toThrow();

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "token",
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          maxAge: 108000,
          path: "/",
        })
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
        id: 1,
        name: regularUser.username,
        email: regularUser.email,
        is_admin: false,
      });

      await expect(
        loginViaImpersonation("targetuser")
      ).rejects.toThrow("Not authorized.");

      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it("should reject impersonation when not logged in", async () => {
      vi.mocked(getUserFromCookies).mockResolvedValue(null);

      await expect(
        loginViaImpersonation("targetuser")
      ).rejects.toThrow("Not authorized.");

      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it("should reject impersonation of non-existent user", async () => {
      // Create admin user
      const adminUser = await factory.createAdminUser();

      // Mock admin user session
      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: 1,
        name: adminUser.username,
        email: adminUser.email,
        is_admin: true,
      });

      await expect(
        loginViaImpersonation("nonexistentuser")
      ).rejects.toThrow("Invalid username.");

      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });
  });
});