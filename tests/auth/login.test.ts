import { vi, describe, expect, beforeEach, beforeAll } from "vitest";
import { getTestDb } from "../helpers/testDatabase";
import { TestDataFactory } from "../helpers/testFactories";
import {
  shouldRunContainerTests,
  ifRunningContainerTestsIt,
} from "../helpers/testUtils";

let login: typeof import("@/lib/auth/login").login;
let loginViaImpersonation: typeof import("@/lib/auth/login").loginViaImpersonation;

beforeAll(async () => {
  const loginModule = await import("@/lib/auth/login");
  login = loginModule.login;
  loginViaImpersonation = loginModule.loginViaImpersonation;
});

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

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
    if (shouldRunContainerTests()) {
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
          return {
            success: true,
            data: result || null,
          };
        },
      );
    } else {
      vi.clearAllMocks();
    }
  });

  describe("login", () => {
    beforeEach(async () => {
      if (shouldRunContainerTests()) {
        testDb = await getTestDb();
        factory = new TestDataFactory(testDb);
        vi.clearAllMocks();
      } else {
        vi.clearAllMocks();
      }
    });

    ifRunningContainerTestsIt(
      "should login successfully with valid credentials",
      async () => {
        await factory.createUser({
          username: "testuser",
          password: "mypassword",
        });

        // Try to log in.
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
            maxAge: 10800,
            sameSite: "lax",
            path: "/",
          }),
        );
      },
    );

    ifRunningContainerTestsIt(
      "should fail login with invalid username",
      async () => {
        const result = await login({
          username: "nonexistent",
          password: "anypassword",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Invalid username or password.");
        }
        expect(mockCookieStore.set).not.toHaveBeenCalled();
      },
    );

    ifRunningContainerTestsIt(
      "should fail login with invalid password",
      async () => {
        await factory.createUser({
          username: "testuser",
        });

        // Try to log in.
        const result = await login({
          username: "testuser",
          password: "wrongpassword",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Invalid username or password.");
        }
        expect(mockCookieStore.set).not.toHaveBeenCalled();
      },
    );
  });

  describe("loginViaImpersonation", () => {
    beforeEach(async () => {
      if (shouldRunContainerTests()) {
        testDb = await getTestDb();
        factory = new TestDataFactory(testDb);
        vi.clearAllMocks();
      } else {
        vi.clearAllMocks();
      }
    });

    ifRunningContainerTestsIt(
      "should allow admin to impersonate another user",
      async () => {
        // Create admin user.
        const adminUser = await factory.createAdminUser({
          username: "adminuser",
        });

        // Create target user to impersonate
        await factory.createUser({
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
          deactivated_at: null,
          idp_user_id: null,
          updated_at: new Date(),
          created_at: new Date(),
        });

        await expect(
          loginViaImpersonation("targetuser"),
        ).resolves.not.toThrow();

        expect(mockCookieStore.set).toHaveBeenCalledWith(
          "token",
          expect.any(String),
          expect.objectContaining({
            httpOnly: true,
            maxAge: 10800,
            sameSite: "lax",
            path: "/",
          }),
        );
      },
    );

    ifRunningContainerTestsIt(
      "should reject impersonation by non-admin user",
      async () => {
        // Create regular user
        const regularUser = await factory.createUser({
          username: "regularuser",
        });

        // Create target user
        await factory.createUser({
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
          deactivated_at: null,
          idp_user_id: null,
          updated_at: new Date(),
          created_at: new Date(),
        });

        await expect(loginViaImpersonation("targetuser")).rejects.toThrow(
          "Not authorized.",
        );

        expect(mockCookieStore.set).not.toHaveBeenCalled();
      },
    );

    ifRunningContainerTestsIt(
      "should reject impersonation when not logged in",
      async () => {
        vi.mocked(getUserFromCookies).mockResolvedValue(null);

        await expect(loginViaImpersonation("targetuser")).rejects.toThrow(
          "Not authorized.",
        );

        expect(mockCookieStore.set).not.toHaveBeenCalled();
      },
    );

    ifRunningContainerTestsIt(
      "should reject impersonation of non-existent user",
      async () => {
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
          deactivated_at: null,
          idp_user_id: null,
          updated_at: new Date(),
          created_at: new Date(),
        });

        await expect(loginViaImpersonation("nonexistentuser")).rejects.toThrow(
          "Invalid username.",
        );

        expect(mockCookieStore.set).not.toHaveBeenCalled();
      },
    );
  });
});
