import { describe, it, expect, beforeEach } from "vitest";
import { getTestDb } from "../helpers/testDatabase";
import { TestDataFactory } from "../helpers/testFactories";
import { createUser, getUsers, getUserById, updateUser } from "@/lib/db_actions/users";
import { ERROR_CODES } from "@/lib/server-action-result";

// Mock getUserFromCookies since we're testing database actions in isolation
vi.mock("@/lib/get-user", () => ({
  getUserFromCookies: vi.fn(),
}));

// Mock logger to avoid console output during tests
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// We need to replace the db import with our test database
vi.mock("@/lib/database", () => ({
  db: {
    // This will be replaced in beforeEach with the actual test db
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
    updateTable: vi.fn(),
    deleteFrom: vi.fn(),
    transaction: vi.fn(),
  },
}));

import { getUserFromCookies } from "@/lib/get-user";

describe("Users Database Actions", () => {
  let testDb: any;
  let factory: TestDataFactory;

  beforeEach(async () => {
    testDb = await getTestDb();
    factory = new TestDataFactory(testDb);
  });

  describe("createUser", () => {
    it("should create a new user successfully", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password_hash: "hashed_password_123",
      };

      const result = await createUser({ user: userData });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe("number");

      // Verify user was created in database
      const createdUser = await testDb
        .selectFrom("users")
        .selectAll()
        .where("email", "=", userData.email)
        .executeTakeFirst();

      expect(createdUser).toBeDefined();
      expect(createdUser.name).toBe(userData.name);
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.password_hash).toBe(userData.password_hash);
    });

    it("should handle duplicate email error", async () => {
      const userData = {
        name: "John Doe",
        email: "duplicate@example.com",
        password_hash: "hashed_password_123",
      };

      // Create first user
      await createUser({ user: userData });

      // Try to create another user with same email
      const result = await createUser({ user: userData });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(result.error).toContain("already exists");
    });
  });

  describe("getUsers", () => {
    it("should return unauthorized error when user not logged in", async () => {
      vi.mocked(getUserFromCookies).mockResolvedValue(null);

      const result = await getUsers();

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(result.error).toContain("logged in");
    });

    it("should return all users when user is authenticated", async () => {
      const user1 = await factory.createUser();
      const user2 = await factory.createUser();

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user1.id,
        name: user1.username,
        email: user1.email,
        is_admin: user1.is_admin,
      });

      const result = await getUsers();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.find(u => u.email === user1.email)).toBeDefined();
      expect(result.data?.find(u => u.email === user2.email)).toBeDefined();
    });

    it("should apply sorting when provided", async () => {
      const user1 = await factory.createUser({ username: "alice" });
      const user2 = await factory.createUser({ username: "bob" });

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user1.id,
        name: user1.username,
        email: user1.email,
        is_admin: user1.is_admin,
      });

      const result = await getUsers({ sort: { expr: "name", modifiers: "asc" } });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].name).toBe("alice");
      expect(result.data?.[1].name).toBe("bob");
    });
  });

  describe("getUserById", () => {
    it("should return unauthorized error when user not logged in", async () => {
      vi.mocked(getUserFromCookies).mockResolvedValue(null);

      const result = await getUserById(1);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(result.error).toContain("logged in");
    });

    it("should return user when found", async () => {
      const user = await factory.createUser();

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      // Get the actual user ID from database
      const dbUser = await testDb
        .selectFrom("users")
        .select("id")
        .where("email", "=", user.email)
        .executeTakeFirst();

      const result = await getUserById(dbUser.id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.email).toBe(user.email);
      expect(result.data?.name).toBe(user.username);
    });

    it("should return undefined when user not found", async () => {
      const user = await factory.createUser();

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      const result = await getUserById(99999); // Non-existent ID

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });
  });

  describe("updateUser", () => {
    it("should return unauthorized error when user not logged in", async () => {
      const result = await updateUser({ id: 1, user: { name: "New Name" } });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(result.error).toContain("own profile");
    });

    it("should return unauthorized error when trying to update different user", async () => {
      const user1 = await factory.createUser();
      const user2 = await factory.createUser();

      // Get actual user IDs from database
      const dbUser1 = await testDb
        .selectFrom("users")
        .select("id")
        .where("email", "=", user1.email)
        .executeTakeFirst();

      const dbUser2 = await testDb
        .selectFrom("users")
        .select("id")
        .where("email", "=", user2.email)
        .executeTakeFirst();

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: dbUser1.id,
        name: user1.username,
        email: user1.email,
        is_admin: user1.is_admin,
      });

      const result = await updateUser({ 
        id: dbUser2.id, 
        user: { name: "New Name" } 
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(result.error).toContain("own profile");
    });

    it("should reject unauthorized field updates", async () => {
      const user = await factory.createUser();

      const dbUser = await testDb
        .selectFrom("users")
        .select("id")
        .where("email", "=", user.email)
        .executeTakeFirst();

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: dbUser.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      const result = await updateUser({ 
        id: dbUser.id, 
        user: { is_admin: true } as any // Try to update admin status
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(result.error).toContain("cannot update");
    });

    it("should successfully update allowed fields", async () => {
      const user = await factory.createUser();

      const dbUser = await testDb
        .selectFrom("users")
        .select("id")
        .where("email", "=", user.email)
        .executeTakeFirst();

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: dbUser.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      const updateData = {
        name: "Updated Name",
        email: "updated@example.com"
      };

      const result = await updateUser({ id: dbUser.id, user: updateData });

      expect(result.success).toBe(true);

      // Verify update in database
      const updatedUser = await testDb
        .selectFrom("users")
        .selectAll()
        .where("id", "=", dbUser.id)
        .executeTakeFirst();

      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.email).toBe(updateData.email);
    });

    it("should handle duplicate email error on update", async () => {
      const user1 = await factory.createUser({ email: "user1@example.com" });
      const user2 = await factory.createUser({ email: "user2@example.com" });

      const dbUser2 = await testDb
        .selectFrom("users")
        .select("id")
        .where("email", "=", user2.email)
        .executeTakeFirst();

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: dbUser2.id,
        name: user2.username,
        email: user2.email,
        is_admin: user2.is_admin,
      });

      // Try to update user2's email to user1's email
      const result = await updateUser({ 
        id: dbUser2.id, 
        user: { email: user1.email }
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(result.error).toContain("already exists");
    });
  });
});