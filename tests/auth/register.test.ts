import { describe, it, expect, beforeEach } from "vitest";
import { registerNewUserIfAuthorized } from "@/lib/auth/register";
import { getTestDb } from "../helpers/testDatabase";
import { TestDataFactory } from "../helpers/testFactories";

// Mock environment variables
vi.mock("process", () => ({
  env: {
    ARGON2_SALT: "test_salt",
  },
}));

// Mock getUserFromCookies
vi.mock("@/lib/get-user", () => ({
  getUserFromCookies: vi.fn(),
}));

// Mock invite token functions
vi.mock("@/lib/db_actions/invite-tokens", () => ({
  inviteTokenIsValid: vi.fn(),
  consumeInviteToken: vi.fn(),
}));

// Mock the db_actions module - we'll replace the implementation in beforeEach
vi.mock("@/lib/db_actions", () => ({
  getLoginByUsername: vi.fn(),
  createLogin: vi.fn(),
  createUser: vi.fn(),
}));

import { getUserFromCookies } from "@/lib/get-user";
import { inviteTokenIsValid, consumeInviteToken } from "@/lib/db_actions/invite-tokens";
import { getLoginByUsername, createLogin, createUser } from "@/lib/db_actions";

describe("Authentication Register", () => {
  let testDb: any;
  let factory: TestDataFactory;

  beforeEach(async () => {
    testDb = await getTestDb();
    factory = new TestDataFactory(testDb);
    vi.clearAllMocks();
    
    // Replace the mocked db actions with our test database implementations
    vi.mocked(getLoginByUsername).mockImplementation(async (username: string) => {
      const result = await testDb
        .selectFrom("logins")
        .selectAll()
        .where("username", "=", username)
        .executeTakeFirst();
      return result;
    });
    
    vi.mocked(createLogin).mockImplementation(async ({ login }: { login: any }) => {
      const result = await testDb
        .insertInto("logins")
        .values(login)
        .returning("id")
        .executeTakeFirst();
      return result!.id;
    });
    
    vi.mocked(createUser).mockImplementation(async ({ user }: { user: any }) => {
      try {
        const result = await testDb
          .insertInto("users")
          .values(user)
          .returning("id")
          .executeTakeFirst();
        return { success: true, data: result!.id };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
  });

  describe("registerNewUser", () => {
    it("should allow admin to register new user without invite token", async () => {
      const adminUser = await factory.createAdminUser();

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: adminUser.id,
        name: adminUser.username,
        email: adminUser.email,
        is_admin: true,
      });

      const userData = {
        username: "newuser",
        password: "strongpassword123",
        name: "New User",
        email: "newuser@example.com",
      };

      await expect(registerNewUserIfAuthorized(userData)).resolves.not.toThrow();

      // Verify user was created
      const createdLogin = await testDb
        .selectFrom("logins")
        .selectAll()
        .where("username", "=", userData.username)
        .executeTakeFirst();

      expect(createdLogin).toBeDefined();
      expect(createdLogin.username).toBe(userData.username);

      const createdUser = await testDb
        .selectFrom("users")
        .selectAll()
        .where("login_id", "=", createdLogin.id)
        .executeTakeFirst();

      expect(createdUser).toBeDefined();
      expect(createdUser.name).toBe(userData.name);
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.is_admin).toBe(false);
    });

    it("should allow non-admin to register with valid invite token", async () => {
      const regularUser = await factory.createUser();

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: regularUser.id,
        name: regularUser.username,
        email: regularUser.email,
        is_admin: false,
      });

      vi.mocked(inviteTokenIsValid).mockResolvedValue(true);
      vi.mocked(consumeInviteToken).mockResolvedValue(undefined);

      const userData = {
        username: "newuser",
        password: "strongpassword123",
        name: "New User",
        email: "newuser@example.com",
        inviteToken: "valid_token_123",
      };

      await expect(registerNewUserIfAuthorized(userData)).resolves.not.toThrow();

      expect(inviteTokenIsValid).toHaveBeenCalledWith("valid_token_123");
      expect(consumeInviteToken).toHaveBeenCalledWith("valid_token_123");

      // Verify user was created
      const createdLogin = await testDb
        .selectFrom("logins")
        .selectAll()
        .where("username", "=", userData.username)
        .executeTakeFirst();

      expect(createdLogin).toBeDefined();
    });

    it("should allow anonymous user to register with valid invite token", async () => {
      vi.mocked(getUserFromCookies).mockResolvedValue(null);
      vi.mocked(inviteTokenIsValid).mockResolvedValue(true);
      vi.mocked(consumeInviteToken).mockResolvedValue(undefined);

      const userData = {
        username: "newuser",
        password: "strongpassword123",
        name: "New User",
        email: "newuser@example.com",
        inviteToken: "valid_token_123",
      };

      await expect(registerNewUserIfAuthorized(userData)).resolves.not.toThrow();

      expect(inviteTokenIsValid).toHaveBeenCalledWith("valid_token_123");
      expect(consumeInviteToken).toHaveBeenCalledWith("valid_token_123");
    });

    it("should reject non-admin registration without invite token", async () => {
      const regularUser = await factory.createUser();

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: regularUser.id,
        name: regularUser.username,
        email: regularUser.email,
        is_admin: false,
      });

      const userData = {
        username: "newuser",
        password: "strongpassword123",
        name: "New User",
        email: "newuser@example.com",
      };

      await expect(registerNewUserIfAuthorized(userData)).rejects.toThrow(
        "No invite token provided."
      );
    });

    it("should reject anonymous registration without invite token", async () => {
      vi.mocked(getUserFromCookies).mockResolvedValue(null);

      const userData = {
        username: "newuser",
        password: "strongpassword123",
        name: "New User",
        email: "newuser@example.com",
      };

      await expect(registerNewUserIfAuthorized(userData)).rejects.toThrow(
        "No invite token provided."
      );
    });

    it("should reject registration with invalid invite token", async () => {
      vi.mocked(getUserFromCookies).mockResolvedValue(null);
      vi.mocked(inviteTokenIsValid).mockResolvedValue(false);

      const userData = {
        username: "newuser",
        password: "strongpassword123",
        name: "New User",
        email: "newuser@example.com",
        inviteToken: "invalid_token_123",
      };

      await expect(registerNewUserIfAuthorized(userData)).rejects.toThrow(
        "Invalid invite token."
      );

      expect(consumeInviteToken).not.toHaveBeenCalled();
    });

    it("should reject registration with existing username", async () => {
      // Create an existing user (factory.createUser already creates the login record)
      const existingUser = await factory.createUser({
        username: "existinguser",
      });

      const adminUser = await factory.createAdminUser();
      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: adminUser.id,
        name: adminUser.username,
        email: adminUser.email,
        is_admin: true,
      });

      const userData = {
        username: "existinguser", // Same username as existing user
        password: "strongpassword123",
        name: "New User",
        email: "newuser@example.com",
      };

      await expect(registerNewUserIfAuthorized(userData)).rejects.toThrow(
        "Username already exists."
      );
    });

    it("should reject registration with empty username", async () => {
      const adminUser = await factory.createAdminUser();
      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: adminUser.id,
        name: adminUser.username,
        email: adminUser.email,
        is_admin: true,
      });

      const userData = {
        username: "",
        password: "strongpassword123",
        name: "New User",
        email: "newuser@example.com",
      };

      await expect(registerNewUserIfAuthorized(userData)).rejects.toThrow(
        "Username and password are required."
      );
    });

    it("should reject registration with empty password", async () => {
      const adminUser = await factory.createAdminUser();
      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: adminUser.id,
        name: adminUser.username,
        email: adminUser.email,
        is_admin: true,
      });

      const userData = {
        username: "newuser",
        password: "",
        name: "New User",
        email: "newuser@example.com",
      };

      await expect(registerNewUserIfAuthorized(userData)).rejects.toThrow(
        "Username and password are required."
      );
    });

    it("should reject registration with short password", async () => {
      const adminUser = await factory.createAdminUser();
      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: adminUser.id,
        name: adminUser.username,
        email: adminUser.email,
        is_admin: true,
      });

      const userData = {
        username: "newuser",
        password: "short", // Less than 8 characters
        name: "New User",
        email: "newuser@example.com",
      };

      await expect(registerNewUserIfAuthorized(userData)).rejects.toThrow(
        "Password must be at least 8 characters long."
      );
    });

    it("should hash password properly when creating user", async () => {
      const adminUser = await factory.createAdminUser();
      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: adminUser.id,
        name: adminUser.username,
        email: adminUser.email,
        is_admin: true,
      });

      const userData = {
        username: "newuser",
        password: "strongpassword123",
        name: "New User",
        email: "newuser@example.com",
      };

      await registerNewUserIfAuthorized(userData);

      // Verify password was hashed
      const createdLogin = await testDb
        .selectFrom("logins")
        .selectAll()
        .where("username", "=", userData.username)
        .executeTakeFirst();

      expect(createdLogin.password_hash).toBeDefined();
      expect(createdLogin.password_hash).not.toBe(userData.password);
      expect(createdLogin.password_hash.length).toBeGreaterThan(50); // Argon2 hashes are long
    });
  });
});