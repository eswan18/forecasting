import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock cookies
const mockCookieGet = vi.fn();
const mockCookieSet = vi.fn();
const mockCookieDelete = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: mockCookieGet,
    set: mockCookieSet,
    delete: mockCookieDelete,
  }),
}));

// Mock database
const mockExecuteTakeFirst = vi.fn();
const mockWhere = vi.fn(() => ({
  executeTakeFirst: mockExecuteTakeFirst,
}));
const mockSelectAll = vi.fn(() => ({ where: mockWhere }));
const mockSelectFrom = vi.fn(() => ({ selectAll: mockSelectAll }));

vi.mock("@/lib/database", () => ({
  db: {
    selectFrom: mockSelectFrom,
  },
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock getRealUserFromCookies
const mockGetRealUserFromCookies = vi.fn();
vi.mock("@/lib/get-user", () => ({
  getRealUserFromCookies: () => mockGetRealUserFromCookies(),
}));

// Set JWT_SECRET for tests
process.env.JWT_SECRET = "test-secret-key-for-testing";

describe("Impersonation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("startImpersonation", () => {
    it("should fail when not authenticated", async () => {
      mockGetRealUserFromCookies.mockResolvedValue(null);

      const { startImpersonation } = await import("./impersonation");
      const result = await startImpersonation(123);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Not authenticated");
    });

    it("should fail when user is not admin", async () => {
      mockGetRealUserFromCookies.mockResolvedValue({
        id: 1,
        name: "Regular User",
        is_admin: false,
      });

      const { startImpersonation } = await import("./impersonation");
      const result = await startImpersonation(123);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Not authorized");
    });

    it("should fail when target user does not exist", async () => {
      mockGetRealUserFromCookies.mockResolvedValue({
        id: 1,
        name: "Admin User",
        is_admin: true,
      });
      mockExecuteTakeFirst.mockResolvedValue(undefined);

      const { startImpersonation } = await import("./impersonation");
      const result = await startImpersonation(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });

    it("should fail when trying to impersonate yourself", async () => {
      mockGetRealUserFromCookies.mockResolvedValue({
        id: 1,
        name: "Admin User",
        is_admin: true,
      });
      mockExecuteTakeFirst.mockResolvedValue({
        id: 1,
        name: "Admin User",
      });

      const { startImpersonation } = await import("./impersonation");
      const result = await startImpersonation(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Cannot impersonate yourself");
    });

    it("should succeed when admin impersonates another user", async () => {
      const adminUser = {
        id: 1,
        name: "Admin User",
        username: "admin",
        is_admin: true,
      };
      const targetUser = {
        id: 2,
        name: "Target User",
        username: "target",
        is_admin: false,
      };

      mockGetRealUserFromCookies.mockResolvedValue(adminUser);
      mockExecuteTakeFirst.mockResolvedValue(targetUser);

      const { startImpersonation } = await import("./impersonation");
      const result = await startImpersonation(2);

      expect(result.success).toBe(true);
      expect(mockCookieSet).toHaveBeenCalledWith(
        "impersonate",
        expect.stringMatching(/^2:1:\d+:[a-f0-9]+$/),
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        }),
      );
    });
  });

  describe("stopImpersonation", () => {
    it("should delete the impersonation cookie", async () => {
      const { stopImpersonation } = await import("./impersonation");
      await stopImpersonation();

      expect(mockCookieDelete).toHaveBeenCalledWith("impersonate");
    });
  });
});
