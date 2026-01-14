import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to carefully mock the database to ensure each test is isolated
// The challenge is that kysely uses a builder pattern, so we need to track
// the sequence of calls

describe("Identity Login Functions", () => {
  // Mock implementations that we can control per-test
  let mockUserResult: any = undefined;

  const mockUserExecuteTakeFirst = vi.fn(() => {
    return Promise.resolve(mockUserResult);
  });

  // Create mock chain for v_users queries
  const mockUsersWhere = vi.fn(() => ({
    executeTakeFirst: mockUserExecuteTakeFirst,
  }));

  const mockUsersSelectAll = vi.fn(() => ({
    where: mockUsersWhere,
  }));

  // SelectFrom needs to return different chains based on table
  const mockSelectFrom = vi.fn((table: string) => {
    if (table === "v_users") {
      return { selectAll: mockUsersSelectAll };
    }
    return {};
  });

  beforeEach(() => {
    vi.resetModules();
    mockUserResult = undefined;

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
