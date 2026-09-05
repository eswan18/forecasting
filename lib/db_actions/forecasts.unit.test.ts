import { describe, it, expect, vi, beforeEach } from "vitest";
import * as getUser from "@/lib/get-user";
import * as dbHelpers from "@/lib/db-helpers";

// Mock dependencies
// `forecasts.ts` transitively imports the server-only `attachOptions` helper.
vi.mock("server-only", () => ({}));

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
import {
  createForecast,
  saveChoiceForecast,
  updateForecast,
} from "./forecasts";

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
        executeTakeFirst: vi.fn().mockResolvedValue({
          prop_kind: "binary",
          competition_forecasts_close_date: null,
        }),
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
        executeTakeFirst: vi.fn().mockResolvedValue({
          prop_kind: "binary",
          competition_forecasts_close_date: pastDate,
        }),
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
        executeTakeFirst: vi.fn().mockResolvedValue({
          prop_kind: "binary",
          competition_forecasts_close_date: futureDate,
        }),
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

    it("should reject a forecast on a choice prop", async () => {
      const mockTrx = {
        selectFrom: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          prop_kind: "one_of",
          competition_forecasts_close_date: null,
        }),
        insertInto: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 42 }),
      };

      vi.mocked(dbHelpers.withRLSAction).mockImplementation(
        async (userId, fn) => fn(mockTrx as any),
      );

      const result = await createForecast({
        forecast: { prop_id: 1, user_id: 1, forecast: 0.75 },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          "Use the per-option form for this proposition",
        );
        expect(result.code).toBe("VALIDATION_ERROR");
      }
      expect(mockTrx.insertInto).not.toHaveBeenCalled();
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
        executeTakeFirst: vi.fn().mockResolvedValue({
          prop_kind: "binary",
          competition_forecasts_close_date: null,
        }),
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
        executeTakeFirst: vi.fn().mockResolvedValue({
          prop_kind: "binary",
          competition_forecasts_close_date: pastDate,
        }),
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

    it("should reject an update to a choice prop's forecast", async () => {
      const mockTrx = {
        selectFrom: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          prop_kind: "any_of",
          competition_forecasts_close_date: null,
        }),
        updateTable: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(dbHelpers.withRLSAction).mockImplementation(
        async (userId, fn) => fn(mockTrx as any),
      );

      const result = await updateForecast({
        id: 1,
        forecast: { forecast: 0.8 },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          "Use the per-option form for this proposition",
        );
        expect(result.code).toBe("VALIDATION_ERROR");
      }
      expect(mockTrx.updateTable).not.toHaveBeenCalled();
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
      // Should not even call withRLSAction
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

  describe("saveChoiceForecast", () => {
    /**
     * A fake transaction covering the chains `saveChoiceForecast` uses: the
     * `v_props` and `prop_options` reads, the `forecasts` upsert, and the
     * `forecast_options` delete + insert. Writes are recorded so the tests can
     * assert on what would reach the database.
     */
    function makeChoiceTrx({
      prop,
      optionIds = [],
      forecastId = 42,
    }: {
      prop?: {
        prop_kind: string;
        competition_forecasts_close_date: Date | null;
      };
      optionIds?: number[];
      forecastId?: number;
    }) {
      const recorded = {
        header: undefined as any,
        conflictColumns: undefined as string[] | undefined,
        conflictUpdate: undefined as any,
        deletedForecastId: undefined as number | undefined,
        insertedOptions: undefined as any[] | undefined,
        order: [] as string[],
      };

      const selectFrom = vi.fn((table: string) => {
        const builder: any = {
          select: () => builder,
          where: () => builder,
          executeTakeFirst: async () =>
            table === "v_props" ? prop : undefined,
          execute: async () =>
            table === "prop_options" ? optionIds.map((id) => ({ id })) : [],
        };
        return builder;
      });

      const insertInto = vi.fn((table: string) => {
        const builder: any = {
          values: (values: any) => {
            if (table === "forecasts") {
              recorded.header = values;
            } else {
              recorded.insertedOptions = values;
            }
            return builder;
          },
          onConflict: (fn: (oc: any) => unknown) => {
            const oc: any = {
              columns: (columns: string[]) => {
                recorded.conflictColumns = columns;
                return oc;
              },
              doUpdateSet: (update: any) => {
                recorded.conflictUpdate = update;
                return oc;
              },
            };
            fn(oc);
            return builder;
          },
          returning: () => builder,
          executeTakeFirstOrThrow: async () => ({ id: forecastId }),
          execute: async () => {
            recorded.order.push(`insert:${table}`);
          },
        };
        return builder;
      });

      const deleteFrom = vi.fn((table: string) => {
        const builder: any = {
          where: (_column: string, _op: string, value: number) => {
            recorded.deletedForecastId = value;
            return builder;
          },
          execute: async () => {
            recorded.order.push(`delete:${table}`);
          },
        };
        return builder;
      });

      return { trx: { selectFrom, insertInto, deleteFrom }, recorded };
    }

    function runWith(trx: unknown) {
      vi.mocked(dbHelpers.withRLSAction).mockImplementation(
        async (userId, fn) => fn(trx as any),
      );
    }

    const openOneOf = {
      prop_kind: "one_of",
      competition_forecasts_close_date: null,
    };

    it("should reject a caller who is not logged in", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(null as any);

      const result = await saveChoiceForecast({
        propId: 1,
        probabilities: [{ optionId: 10, probability: 1 }],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED");
      }
      expect(dbHelpers.withRLSAction).not.toHaveBeenCalled();
    });

    it("should reject a prop that does not exist", async () => {
      const { trx } = makeChoiceTrx({ prop: undefined });
      runWith(trx);

      const result = await saveChoiceForecast({
        propId: 999,
        probabilities: [{ optionId: 10, probability: 1 }],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND");
      }
    });

    it("should reject a binary prop", async () => {
      const { trx } = makeChoiceTrx({
        prop: { prop_kind: "binary", competition_forecasts_close_date: null },
      });
      runWith(trx);

      const result = await saveChoiceForecast({
        propId: 1,
        probabilities: [{ optionId: 10, probability: 1 }],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("yes/no");
        expect(result.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should reject a forecast past the close date", async () => {
      const { trx, recorded } = makeChoiceTrx({
        prop: {
          prop_kind: "one_of",
          competition_forecasts_close_date: new Date("2020-01-01"),
        },
        optionIds: [10, 11],
      });
      runWith(trx);

      const result = await saveChoiceForecast({
        propId: 1,
        probabilities: [
          { optionId: 10, probability: 0.5 },
          { optionId: 11, probability: 0.5 },
        ],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot save forecasts past the due date");
        expect(result.code).toBe("VALIDATION_ERROR");
      }
      expect(recorded.header).toBeUndefined();
    });

    it("should surface the validator's message when one_of probabilities do not sum to 1", async () => {
      const { trx, recorded } = makeChoiceTrx({
        prop: openOneOf,
        optionIds: [10, 11],
      });
      runWith(trx);

      const result = await saveChoiceForecast({
        propId: 1,
        probabilities: [
          { optionId: 10, probability: 0.6 },
          { optionId: 11, probability: 0.6 },
        ],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain(
          "Probabilities for a pick-one prop must sum to 100%",
        );
        expect(result.code).toBe("VALIDATION_ERROR");
      }
      expect(recorded.header).toBeUndefined();
    });

    it("should surface the validator's message when an option has no probability", async () => {
      const { trx } = makeChoiceTrx({ prop: openOneOf, optionIds: [10, 11] });
      runWith(trx);

      const result = await saveChoiceForecast({
        propId: 1,
        probabilities: [{ optionId: 10, probability: 1 }],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Missing probability for option 11");
      }
    });

    it("should upsert a null-forecast header and replace the option rows", async () => {
      const { trx, recorded } = makeChoiceTrx({
        prop: openOneOf,
        optionIds: [10, 11, 12],
        forecastId: 7,
      });
      runWith(trx);

      const result = await saveChoiceForecast({
        propId: 3,
        probabilities: [
          { optionId: 10, probability: 0.6 },
          { optionId: 11, probability: 0.3 },
          { optionId: 12, probability: 0.1 },
        ],
      });

      expect(result).toEqual({ success: true, data: 7 });
      // The header always belongs to the current user and carries no forecast.
      expect(recorded.header).toEqual({
        prop_id: 3,
        user_id: mockUser.id,
        forecast: null,
      });
      expect(recorded.conflictColumns).toEqual(["prop_id", "user_id"]);
      expect(recorded.conflictUpdate).toEqual({ forecast: null });
      // One child row per option, with the previous ones cleared first.
      expect(recorded.deletedForecastId).toBe(7);
      expect(recorded.insertedOptions).toEqual([
        { forecast_id: 7, prop_id: 3, option_id: 10, probability: 0.6 },
        { forecast_id: 7, prop_id: 3, option_id: 11, probability: 0.3 },
        { forecast_id: 7, prop_id: 3, option_id: 12, probability: 0.1 },
      ]);
      expect(recorded.order).toEqual([
        "delete:forecast_options",
        "insert:forecast_options",
      ]);
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(dbHelpers.withRLSAction).mockRejectedValue(
        new Error("Connection reset"),
      );

      const result = await saveChoiceForecast({
        propId: 1,
        probabilities: [{ optionId: 10, probability: 1 }],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("DATABASE_ERROR");
      }
    });
  });
});
