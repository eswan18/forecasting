import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to carefully mock the database to ensure each test is isolated
// The challenge is that kysely uses a builder pattern, so we need to track
// the sequence of calls

describe("Identity Login Flag", () => {
  // Mock implementations that we can control per-test
  let mockFeatureFlagResults: any[] = [];
  let mockUserResult: any = undefined;
  let mockCallIndex = 0;

  const mockExecuteTakeFirst = vi.fn(() => {
    // Return different results based on call order
    const result = mockFeatureFlagResults[mockCallIndex];
    mockCallIndex++;
    return Promise.resolve(result);
  });

  const mockUserExecuteTakeFirst = vi.fn(() => {
    return Promise.resolve(mockUserResult);
  });

  // Create mock chain for feature_flags queries
  const mockFeatureFlagsWhere = vi.fn(() => ({
    executeTakeFirst: mockExecuteTakeFirst,
    where: mockFeatureFlagsWhere,
  }));

  const mockFeatureFlagsSelect = vi.fn(() => ({
    where: mockFeatureFlagsWhere,
  }));

  // Create mock chain for v_users queries
  const mockUsersWhere = vi.fn(() => ({
    executeTakeFirst: mockUserExecuteTakeFirst,
  }));

  const mockUsersSelectAll = vi.fn(() => ({
    where: mockUsersWhere,
  }));

  // SelectFrom needs to return different chains based on table
  const mockSelectFrom = vi.fn((table: string) => {
    if (table === "feature_flags") {
      return { select: mockFeatureFlagsSelect };
    } else if (table === "v_users") {
      return { selectAll: mockUsersSelectAll };
    }
    return {};
  });

  beforeEach(() => {
    vi.resetModules();
    mockFeatureFlagResults = [];
    mockUserResult = undefined;
    mockCallIndex = 0;

    vi.doMock("@/lib/database", () => ({
      db: {
        selectFrom: mockSelectFrom,
        updateTable: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              execute: vi.fn().mockResolvedValue(undefined),
            })),
          })),
        })),
        insertInto: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn(() => ({
              executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 1 }),
            })),
          })),
        })),
      },
    }));

    vi.doMock("@/lib/logger", () => ({
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("isIdentityLoginEnabled", () => {
    it("should return false when global flag is disabled", async () => {
      mockFeatureFlagResults = [{ enabled: false }];

      const { isIdentityLoginEnabled } = await import("./identity-login-flag");
      const result = await isIdentityLoginEnabled("testuser");

      expect(result).toEqual({ enabled: false, user: null });
    });

    it("should return false when global flag does not exist", async () => {
      mockFeatureFlagResults = [undefined];

      const { isIdentityLoginEnabled } = await import("./identity-login-flag");
      const result = await isIdentityLoginEnabled("testuser");

      expect(result).toEqual({ enabled: false, user: null });
    });

    it("should return true for unknown user when global flag is enabled", async () => {
      mockFeatureFlagResults = [{ enabled: true }];
      mockUserResult = undefined; // User not found

      const { isIdentityLoginEnabled } = await import("./identity-login-flag");
      const result = await isIdentityLoginEnabled("unknownuser");

      expect(result).toEqual({ enabled: true, user: null });
    });

    it("should return true for known user with no override when global flag is enabled", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
        idp_user_id: null,
        is_admin: false,
        deactivated_at: null,
        login_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Call sequence: 1. Global flag, 2. Per-user flag (not found)
      mockFeatureFlagResults = [{ enabled: true }, undefined];
      mockUserResult = mockUser;

      const { isIdentityLoginEnabled } = await import("./identity-login-flag");
      const result = await isIdentityLoginEnabled("testuser");

      expect(result.enabled).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it("should return false when per-user override disables the flag", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
        idp_user_id: null,
        is_admin: false,
        deactivated_at: null,
        login_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Call sequence: 1. Global flag enabled, 2. Per-user flag disabled
      mockFeatureFlagResults = [{ enabled: true }, { enabled: false }];
      mockUserResult = mockUser;

      const { isIdentityLoginEnabled } = await import("./identity-login-flag");
      const result = await isIdentityLoginEnabled("testuser");

      expect(result.enabled).toBe(false);
      expect(result.user).toEqual(mockUser);
    });

    it("should return true when per-user override explicitly enables the flag", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
        idp_user_id: null,
        is_admin: false,
        deactivated_at: null,
        login_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Call sequence: 1. Global flag enabled, 2. Per-user flag enabled
      mockFeatureFlagResults = [{ enabled: true }, { enabled: true }];
      mockUserResult = mockUser;

      const { isIdentityLoginEnabled } = await import("./identity-login-flag");
      const result = await isIdentityLoginEnabled("testuser");

      expect(result.enabled).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it("should return false on database error (fail closed)", async () => {
      // Make the first call throw
      mockExecuteTakeFirst.mockRejectedValueOnce(new Error("Database error"));

      const { isIdentityLoginEnabled } = await import("./identity-login-flag");
      const result = await isIdentityLoginEnabled("testuser");

      expect(result).toEqual({ enabled: false, user: null });
    });
  });

  describe("getUserByIdpUserId", () => {
    it("should return user when found by IDP user ID", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
        idp_user_id: "abc-123-uuid",
        is_admin: false,
        deactivated_at: null,
        login_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserResult = mockUser;

      const { getUserByIdpUserId } = await import("./identity-login-flag");
      const result = await getUserByIdpUserId("abc-123-uuid");

      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found", async () => {
      mockUserResult = undefined;

      const { getUserByIdpUserId } = await import("./identity-login-flag");
      const result = await getUserByIdpUserId("nonexistent-uuid");

      expect(result).toBeNull();
    });

    it("should return null on database error", async () => {
      mockUserExecuteTakeFirst.mockRejectedValueOnce(new Error("Database error"));

      const { getUserByIdpUserId } = await import("./identity-login-flag");
      const result = await getUserByIdpUserId("abc-123-uuid");

      expect(result).toBeNull();
    });
  });
});
