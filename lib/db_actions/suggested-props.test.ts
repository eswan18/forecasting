import { describe, it, expect, vi, beforeEach } from "vitest";
import * as getUser from "@/lib/get-user";
import * as dbHelpers from "@/lib/db-helpers";

// Mock dependencies
vi.mock("@/lib/get-user", () => ({
  getUserFromCookies: vi.fn(),
}));

vi.mock("@/lib/db-helpers", () => ({
  withRLS: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Import after mocking
import {
  getSuggestedProps,
  createSuggestedProp,
  deleteSuggestedProp,
} from "./suggested-props";

describe("Suggested Props Unit Tests", () => {
  const mockUser = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    is_admin: false,
  };

  const mockAdminUser = {
    id: 2,
    name: "Admin User",
    email: "admin@example.com",
    is_admin: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSuggestedProps", () => {
    it("should require admin access", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const result = await getSuggestedProps();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Only admins");
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });

    it("should return suggested props for admin", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(
        mockAdminUser as any,
      );

      const mockSuggestedProps = [
        { id: 1, text: "Suggestion 1", suggester_user_id: 1 },
        { id: 2, text: "Suggestion 2", suggester_user_id: 3 },
      ];

      const mockTrx = {
        selectFrom: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockSuggestedProps),
      };

      vi.mocked(dbHelpers.withRLS).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await getSuggestedProps();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockSuggestedProps);
        expect(result.data).toHaveLength(2);
      }
    });

    it("should handle database errors", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(
        mockAdminUser as any,
      );
      vi.mocked(dbHelpers.withRLS).mockRejectedValue(
        new Error("Database error"),
      );

      const result = await getSuggestedProps();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("DATABASE_ERROR");
      }
    });
  });

  describe("createSuggestedProp", () => {
    it("should require authentication", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(null);

      const result = await createSuggestedProp({
        prop: { prop: "My suggestion", suggester_user_id: 1 },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });

    it("should reject suggestion for different user", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const result = await createSuggestedProp({
        prop: { prop: "My suggestion", suggester_user_id: 999 }, // Different user
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });

    it("should create suggestion for own user", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const mockTrx = {
        insertInto: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 42 }),
      };

      vi.mocked(dbHelpers.withRLS).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await createSuggestedProp({
        prop: { prop: "My suggestion", suggester_user_id: 1 },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
      expect(mockTrx.insertInto).toHaveBeenCalledWith("suggested_props");
    });

    it("should handle database errors", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);
      vi.mocked(dbHelpers.withRLS).mockRejectedValue(
        new Error("Insert failed"),
      );

      const result = await createSuggestedProp({
        prop: { prop: "My suggestion", suggester_user_id: 1 },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("DATABASE_ERROR");
      }
    });
  });

  describe("deleteSuggestedProp", () => {
    it("should require admin access", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const result = await deleteSuggestedProp({ id: 1 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Only admins");
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });

    it("should delete suggestion for admin", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(
        mockAdminUser as any,
      );

      const mockTrx = {
        deleteFrom: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(dbHelpers.withRLS).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await deleteSuggestedProp({ id: 1 });

      expect(result.success).toBe(true);
      expect(mockTrx.deleteFrom).toHaveBeenCalledWith("suggested_props");
    });

    it("should handle database errors", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(
        mockAdminUser as any,
      );
      vi.mocked(dbHelpers.withRLS).mockRejectedValue(
        new Error("Delete failed"),
      );

      const result = await deleteSuggestedProp({ id: 1 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("DATABASE_ERROR");
      }
    });
  });
});
