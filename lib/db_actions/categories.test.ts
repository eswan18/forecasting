import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCategories } from "./categories";
import * as getUser from "@/lib/get-user";
import { db } from "@/lib/database";

// Mock the database module
vi.mock("@/lib/database", () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));

// Mock get-user module
vi.mock("@/lib/get-user", () => ({
  getUserFromCookies: vi.fn(),
}));

describe("Categories Database Actions", () => {
  const mockSelectAll = vi.fn();
  const mockExecute = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup the chained method calls
    vi.mocked(db.selectFrom).mockReturnValue({
      selectAll: mockSelectAll,
    } as any);

    mockSelectAll.mockReturnValue({
      execute: mockExecute,
    });
  });

  describe("getCategories", () => {
    it("should return all categories when user is authenticated", async () => {
      const mockUser = {
        id: 1,
        login_id: 1,
        username: "testuser",
        is_admin: false,
      };

      const mockCategories = [
        { id: 1, name: "Sports", description: "Sports predictions" },
        { id: 2, name: "Politics", description: "Political predictions" },
        { id: 3, name: "Technology", description: "Tech predictions" },
      ];

      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);
      mockExecute.mockResolvedValue(mockCategories);

      const result = await getCategories();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockCategories);
      }
      expect(getUser.getUserFromCookies).toHaveBeenCalledOnce();
      expect(db.selectFrom).toHaveBeenCalledWith("categories");
      expect(mockSelectAll).toHaveBeenCalledOnce();
      expect(mockExecute).toHaveBeenCalledOnce();
    });

    it("should return error when user is not authenticated", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(null);

      const result = await getCategories();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("logged in");
        expect(result.code).toBe("UNAUTHORIZED");
      }
      expect(getUser.getUserFromCookies).toHaveBeenCalledOnce();
      expect(db.selectFrom).not.toHaveBeenCalled();
    });

    it("should handle empty categories list", async () => {
      const mockUser = {
        id: 1,
        login_id: 1,
        username: "testuser",
        is_admin: false,
      };

      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);
      mockExecute.mockResolvedValue([]);

      const result = await getCategories();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
        expect(result.data).toHaveLength(0);
      }
    });

    it("should handle database errors gracefully", async () => {
      const mockUser = {
        id: 1,
        login_id: 1,
        username: "testuser",
        is_admin: false,
      };

      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);
      mockExecute.mockRejectedValue(new Error("Database connection failed"));

      const result = await getCategories();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Failed to fetch categories");
        expect(result.code).toBe("DATABASE_ERROR");
      }
      expect(getUser.getUserFromCookies).toHaveBeenCalledOnce();
      expect(db.selectFrom).toHaveBeenCalledWith("categories");
    });
  });
});
