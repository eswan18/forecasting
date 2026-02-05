import { describe, it, expect, vi, beforeEach } from "vitest";
import * as getUser from "@/lib/get-user";
import * as dbHelpers from "@/lib/db-helpers";

// Mock dependencies
vi.mock("@/lib/get-user", () => ({
  getUserFromCookies: vi.fn(),
}));

vi.mock("@/lib/db-helpers", () => ({
  withRLS: vi.fn(),
  withRLSAction: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Import after mocking
import { createForecast, updateForecast } from "./forecasts";

describe("Forecasts Unit Tests", () => {
  const mockUser = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    is_admin: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);
  });

  describe("createForecast", () => {
    it("should create a forecast when competition is open", async () => {
      const mockTrx = {
        selectFrom: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi
          .fn()
          .mockResolvedValue({ competition_forecasts_close_date: null }),
        insertInto: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 42 }),
      };

      vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await createForecast({
        forecast: { prop_id: 1, user_id: 1, forecast: 0.75 },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it("should reject forecast when competition has closed", async () => {
      const pastDate = new Date("2020-01-01");
      const mockTrx = {
        selectFrom: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi
          .fn()
          .mockResolvedValue({ competition_forecasts_close_date: pastDate }),
      };

      vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await createForecast({
        forecast: { prop_id: 1, user_id: 1, forecast: 0.75 },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot create forecasts past the due date");
        expect(result.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should allow forecast when close date is in the future", async () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      const mockTrx = {
        selectFrom: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi
          .fn()
          .mockResolvedValue({ competition_forecasts_close_date: futureDate }),
        insertInto: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 99 }),
      };

      vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await createForecast({
        forecast: { prop_id: 1, user_id: 1, forecast: 0.5 },
      });

      expect(result.success).toBe(true);
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(dbHelpers.withRLSAction).mockRejectedValue(
        new Error("Database connection failed"),
      );

      const result = await createForecast({
        forecast: { prop_id: 1, user_id: 1, forecast: 0.5 },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("DATABASE_ERROR");
      }
    });
  });

  describe("updateForecast", () => {
    it("should update forecast when competition is open", async () => {
      const mockTrx = {
        selectFrom: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi
          .fn()
          .mockResolvedValue({ competition_forecasts_close_date: null }),
        updateTable: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await updateForecast({
        id: 1,
        forecast: { forecast: 0.8 },
      });

      expect(result.success).toBe(true);
      expect(mockTrx.updateTable).toHaveBeenCalledWith("forecasts");
      expect(mockTrx.set).toHaveBeenCalledWith({ forecast: 0.8 });
    });

    it("should reject update when forecast not found", async () => {
      const mockTrx = {
        selectFrom: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await updateForecast({
        id: 999,
        forecast: { forecast: 0.5 },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Forecast not found");
        expect(result.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should reject update when competition has closed", async () => {
      const pastDate = new Date("2020-01-01");
      const mockTrx = {
        selectFrom: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi
          .fn()
          .mockResolvedValue({ competition_forecasts_close_date: pastDate }),
      };

      vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await updateForecast({
        id: 1,
        forecast: { forecast: 0.6 },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot update forecasts past the due date");
        expect(result.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should reject update with invalid columns", async () => {
      const result = await updateForecast({
        id: 1,
        forecast: { forecast: 0.5, user_id: 999 } as any,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
        expect(result.code).toBe("UNAUTHORIZED");
      }
      // Should not even call withRLS
      expect(dbHelpers.withRLSAction).not.toHaveBeenCalled();
    });

    it("should reject update with no forecast field", async () => {
      const result = await updateForecast({
        id: 1,
        forecast: { user_id: 999 } as any,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
      expect(dbHelpers.withRLSAction).not.toHaveBeenCalled();
    });

    it("should reject update with empty object", async () => {
      const result = await updateForecast({
        id: 1,
        forecast: {} as any,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(dbHelpers.withRLSAction).mockRejectedValue(
        new Error("Connection timeout"),
      );

      const result = await updateForecast({
        id: 1,
        forecast: { forecast: 0.5 },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("DATABASE_ERROR");
      }
    });
  });
});
