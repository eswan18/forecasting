import { describe, it, expect, vi, beforeEach } from "vitest";
import * as getUser from "@/lib/get-user";
import * as dbHelpers from "@/lib/db-helpers";

// Mock dependencies
vi.mock("server-only", () => ({}));

vi.mock("@/lib/pubsub/client", () => ({
  publishEvent: vi.fn().mockResolvedValue("msg-mock"),
}));

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
  getPropById,
  createProp,
  updateProp,
  resolveProp,
  unresolveProp,
  deleteProp,
  deleteResolution,
} from "./props";

describe("Props Unit Tests", () => {
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

  describe("getPropById", () => {
    it("should return prop when found", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const mockProp = {
        prop_id: 1,
        prop_text: "Test proposition",
        category_name: "Politics",
      };

      const mockTrx = {
        selectFrom: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockProp),
      };

      vi.mocked(dbHelpers.withRLS).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await getPropById(1);

      expect(result.success).toBe(true);
      if (result.success) {
        // Binary (non-choice) props carry an empty option list.
        expect(result.data).toEqual({ ...mockProp, options: [] });
      }
    });

    it("should return null when prop not found", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const mockTrx = {
        selectFrom: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(dbHelpers.withRLS).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await getPropById(999);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it("should handle database errors", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);
      vi.mocked(dbHelpers.withRLS).mockRejectedValue(
        new Error("Database error"),
      );

      const result = await getPropById(1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("DATABASE_ERROR");
      }
    });
  });

  describe("createProp", () => {
    it("should require authentication", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(null);

      const result = await createProp({
        prop: { text: "Test proposition", category_id: 1, user_id: null },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });

    it("should validate text length", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const result = await createProp({
        prop: { text: "Short", category_id: 1, user_id: null },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
        expect(result.error).toContain("validation");
      }
    });

    it("should require category for public props", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const result = await createProp({
        prop: { text: "Valid proposition text here", category_id: null, user_id: null, competition_id: null },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should create prop when valid", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const mockTrx = {
        insertInto: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 1 }),
        execute: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await createProp({
        prop: {
          text: "This is a valid proposition",
          category_id: 1,
          user_id: null,
        },
      });

      expect(result.success).toBe(true);
      expect(mockTrx.insertInto).toHaveBeenCalledWith("props");
    });

    it("should allow personal props without category", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const mockTrx = {
        insertInto: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 1 }),
        execute: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await createProp({
        prop: {
          text: "This is a personal proposition",
          category_id: null,
          user_id: 1, // Personal prop
        },
      });

      expect(result.success).toBe(true);
    });

    it("should allow private competition props without category", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const mockTrx = {
        selectFrom: vi.fn().mockImplementation(() => {
          return {
            select: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  executeTakeFirst: vi.fn().mockResolvedValue({ role: "admin" }),
                }),
                executeTakeFirst: vi.fn().mockResolvedValue({ is_private: true }),
              }),
            }),
          };
        }),
        insertInto: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 1 }),
        execute: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await createProp({
        prop: {
          text: "This is a private competition proposition",
          category_id: null,
          competition_id: 1,
          user_id: null,
        },
      });

      expect(result.success).toBe(true);
    });

    it("should require category for public competition props", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const mockTrx = {
        selectFrom: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({ is_private: false }),
      };

      vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await createProp({
        prop: {
          text: "This is a public competition proposition",
          category_id: null,
          competition_id: 1,
          user_id: null,
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
      }
    });

    describe("date validation", () => {
      it("should reject forecast deadline in the past", async () => {
        vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

        const pastDate = new Date(Date.now() - 86400000); // yesterday
        const futureDate = new Date(Date.now() + 86400000 * 7); // 7 days from now

        const result = await createProp({
          prop: {
            text: "Valid proposition text",
            category_id: null,
            competition_id: 1,
            user_id: null,
            forecasts_due_date: pastDate,
            resolution_due_date: futureDate,
          },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe("VALIDATION_ERROR");
          // Check validationErrors for field-specific error
          const validationResult = result as { validationErrors?: Record<string, string[]> };
          expect(validationResult.validationErrors?.forecasts_due_date).toContain("Forecast deadline must be in the future");
        }
      });

      it("should reject resolution deadline in the past", async () => {
        vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

        const futureDate = new Date(Date.now() + 86400000); // tomorrow
        const pastDate = new Date(Date.now() - 86400000); // yesterday

        const result = await createProp({
          prop: {
            text: "Valid proposition text",
            category_id: null,
            competition_id: 1,
            user_id: null,
            forecasts_due_date: futureDate,
            resolution_due_date: pastDate,
          },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe("VALIDATION_ERROR");
          const validationResult = result as { validationErrors?: Record<string, string[]> };
          expect(validationResult.validationErrors?.resolution_due_date).toContain("Resolution deadline must be in the future");
        }
      });

      it("should reject resolution deadline before forecast deadline", async () => {
        vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

        const laterDate = new Date(Date.now() + 86400000 * 7); // 7 days from now
        const earlierDate = new Date(Date.now() + 86400000 * 3); // 3 days from now

        const result = await createProp({
          prop: {
            text: "Valid proposition text",
            category_id: null,
            competition_id: 1,
            user_id: null,
            forecasts_due_date: laterDate, // forecast is later
            resolution_due_date: earlierDate, // resolution is earlier - invalid
          },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe("VALIDATION_ERROR");
          const validationResult = result as { validationErrors?: Record<string, string[]> };
          expect(validationResult.validationErrors?.resolution_due_date).toContain("Resolution deadline must be after forecast deadline");
        }
      });

      it("should accept valid future dates with correct ordering", async () => {
        vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

        const forecastDate = new Date(Date.now() + 86400000 * 3); // 3 days from now
        const resolutionDate = new Date(Date.now() + 86400000 * 7); // 7 days from now

        const mockTrx = {
          selectFrom: vi.fn().mockImplementation(() => {
            return {
              select: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    executeTakeFirst: vi.fn().mockResolvedValue({ role: "admin" }),
                  }),
                  executeTakeFirst: vi.fn().mockResolvedValue({ is_private: true }),
                }),
              }),
            };
          }),
          insertInto: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockReturnThis(),
          executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 1 }),
          execute: vi.fn().mockResolvedValue(undefined),
        };

        vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
          return fn(mockTrx as any);
        });

        const result = await createProp({
          prop: {
            text: "Valid proposition text",
            category_id: null,
            competition_id: 1,
            user_id: null,
            forecasts_due_date: forecastDate,
            resolution_due_date: resolutionDate,
          },
        });

        expect(result.success).toBe(true);
      });
    });

    describe("competition admin verification", () => {
      it("should reject non-admin creating prop for private competition", async () => {
        vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

        const forecastDate = new Date(Date.now() + 86400000 * 3);
        const resolutionDate = new Date(Date.now() + 86400000 * 7);

        let selectCallCount = 0;
        const mockTrx = {
          selectFrom: vi.fn().mockImplementation(() => {
            selectCallCount++;
            return {
              select: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    executeTakeFirst: vi.fn().mockResolvedValue({ role: "forecaster" }),
                  }),
                  executeTakeFirst: vi.fn().mockResolvedValue({ is_private: true }),
                }),
              }),
            };
          }),
        };

        vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
          return fn(mockTrx as any);
        });

        const result = await createProp({
          prop: {
            text: "Valid proposition text",
            category_id: null,
            competition_id: 1,
            user_id: null,
            forecasts_due_date: forecastDate,
            resolution_due_date: resolutionDate,
          },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("Only competition admins can create props");
          expect(result.code).toBe("UNAUTHORIZED");
        }
      });

      it("should reject user who is not a member of private competition", async () => {
        vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

        const forecastDate = new Date(Date.now() + 86400000 * 3);
        const resolutionDate = new Date(Date.now() + 86400000 * 7);

        const mockTrx = {
          selectFrom: vi.fn().mockImplementation(() => {
            return {
              select: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    executeTakeFirst: vi.fn().mockResolvedValue(null), // not a member
                  }),
                  executeTakeFirst: vi.fn().mockResolvedValue({ is_private: true }),
                }),
              }),
            };
          }),
        };

        vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
          return fn(mockTrx as any);
        });

        const result = await createProp({
          prop: {
            text: "Valid proposition text",
            category_id: null,
            competition_id: 1,
            user_id: null,
            forecasts_due_date: forecastDate,
            resolution_due_date: resolutionDate,
          },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("Only competition admins can create props");
          expect(result.code).toBe("UNAUTHORIZED");
        }
      });

      it("should allow admin to create prop for private competition", async () => {
        vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

        const forecastDate = new Date(Date.now() + 86400000 * 3);
        const resolutionDate = new Date(Date.now() + 86400000 * 7);

        const mockTrx = {
          selectFrom: vi.fn().mockImplementation(() => {
            return {
              select: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    executeTakeFirst: vi.fn().mockResolvedValue({ role: "admin" }),
                  }),
                  executeTakeFirst: vi.fn().mockResolvedValue({ is_private: true }),
                }),
              }),
            };
          }),
          insertInto: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockReturnThis(),
          executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 1 }),
          execute: vi.fn().mockResolvedValue(undefined),
        };

        vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
          return fn(mockTrx as any);
        });

        const result = await createProp({
          prop: {
            text: "Valid proposition text",
            category_id: null,
            competition_id: 1,
            user_id: null,
            forecasts_due_date: forecastDate,
            resolution_due_date: resolutionDate,
          },
        });

        expect(result.success).toBe(true);
      });

      it("should return not found for non-existent competition", async () => {
        vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

        const forecastDate = new Date(Date.now() + 86400000 * 3);
        const resolutionDate = new Date(Date.now() + 86400000 * 7);

        const mockTrx = {
          selectFrom: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(null), // competition not found
        };

        vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
          return fn(mockTrx as any);
        });

        const result = await createProp({
          prop: {
            text: "Valid proposition text",
            category_id: null,
            competition_id: 999,
            user_id: null,
            forecasts_due_date: forecastDate,
            resolution_due_date: resolutionDate,
          },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("Competition not found");
          expect(result.code).toBe("NOT_FOUND");
        }
      });
    });
  });

  describe("createProp with options", () => {
    /**
     * Fake transaction that records the rows handed to each insert and
     * answers the props insert with a generated id.
     */
    function makeRecordingTrx() {
      const inserts: { table: string; values: unknown }[] = [];
      const trx = {
        insertInto: vi.fn((table: string) => ({
          values: vi.fn((values: unknown) => {
            inserts.push({ table, values });
            return {
              execute: vi.fn().mockResolvedValue(undefined),
              returning: vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 42 }),
              }),
            };
          }),
        })),
      };
      return { trx, inserts };
    }

    function useTrx(trx: unknown) {
      vi.mocked(dbHelpers.withRLSAction).mockImplementation(
        async (userId, fn) => fn(trx as any),
      );
    }

    it("inserts the options after the prop, in position order", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);
      const { trx, inserts } = makeRecordingTrx();
      useTrx(trx);

      const result = await createProp({
        prop: {
          text: "Who wins the division?",
          category_id: 1,
          user_id: null,
          kind: "one_of",
        },
        options: ["Knicks", "Spurs"],
      });

      expect(result.success).toBe(true);
      expect(inserts.map((i) => i.table)).toEqual(["props", "prop_options"]);
      expect(inserts[0].values).toMatchObject({ kind: "one_of" });
      expect(inserts[1].values).toEqual([
        { prop_id: 42, text: "Knicks", position: 0 },
        { prop_id: 42, text: "Spurs", position: 1 },
      ]);
    });

    it("trims option labels before inserting them", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);
      const { trx, inserts } = makeRecordingTrx();
      useTrx(trx);

      const result = await createProp({
        prop: {
          text: "Which of these happen?",
          category_id: 1,
          user_id: null,
          kind: "any_of",
        },
        options: ["  Rain  ", "Snow\n"],
      });

      expect(result.success).toBe(true);
      expect(inserts[1].values).toEqual([
        { prop_id: 42, text: "Rain", position: 0 },
        { prop_id: 42, text: "Snow", position: 1 },
      ]);
    });

    it("rejects a choice prop with only one option", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const result = await createProp({
        prop: {
          text: "Who wins the division?",
          category_id: 1,
          user_id: null,
          kind: "one_of",
        },
        options: ["Knicks"],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
        const validationResult = result as {
          validationErrors?: Record<string, string[]>;
        };
        expect(validationResult.validationErrors?.options).toEqual([
          "At least 2 options are required",
        ]);
      }
      expect(dbHelpers.withRLSAction).not.toHaveBeenCalled();
    });

    it("rejects a choice prop with no options at all", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const result = await createProp({
        prop: {
          text: "Who wins the division?",
          category_id: 1,
          user_id: null,
          kind: "one_of",
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
        const validationResult = result as {
          validationErrors?: Record<string, string[]>;
        };
        expect(validationResult.validationErrors?.options).toBeDefined();
      }
      expect(dbHelpers.withRLSAction).not.toHaveBeenCalled();
    });

    it("rejects duplicate option labels", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const result = await createProp({
        prop: {
          text: "Who wins the division?",
          category_id: 1,
          user_id: null,
          kind: "one_of",
        },
        options: ["Knicks", " Knicks "],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const validationResult = result as {
          validationErrors?: Record<string, string[]>;
        };
        expect(validationResult.validationErrors?.options).toContain(
          "Options must be unique",
        );
      }
    });

    it("rejects options on a yes/no prop", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const result = await createProp({
        prop: { text: "Will it rain tomorrow?", category_id: 1, user_id: null },
        options: ["A", "B"],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
        const validationResult = result as {
          validationErrors?: Record<string, string[]>;
        };
        expect(validationResult.validationErrors?.options).toEqual([
          "Yes/no propositions do not have options",
        ]);
      }
      expect(dbHelpers.withRLSAction).not.toHaveBeenCalled();
    });

    it("does not touch prop_options for a yes/no prop", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);
      const { trx, inserts } = makeRecordingTrx();
      useTrx(trx);

      const result = await createProp({
        prop: { text: "Will it rain tomorrow?", category_id: 1, user_id: null },
      });

      expect(result.success).toBe(true);
      expect(inserts.map((i) => i.table)).toEqual(["props"]);
    });
  });

  describe("updateProp", () => {
    it("should require authentication", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(null);

      const result = await updateProp({
        id: 1,
        prop: { text: "Updated text" },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });

    it("should validate text length on update", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const result = await updateProp({
        id: 1,
        prop: { text: "Short" },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should update prop when valid", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const mockTrx = {
        updateTable: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(dbHelpers.withRLS).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await updateProp({
        id: 1,
        prop: { text: "This is valid updated text" },
      });

      expect(result.success).toBe(true);
      expect(mockTrx.updateTable).toHaveBeenCalledWith("props");
    });
  });

  describe("updateProp kind guard", () => {
    it("refuses to change a prop's kind and never reaches the database", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const result = await updateProp({
        id: 1,
        prop: { kind: "one_of" },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
        expect(result.error).toContain("cannot be changed");
      }
      expect(dbHelpers.withRLS).not.toHaveBeenCalled();
      expect(dbHelpers.withRLSAction).not.toHaveBeenCalled();
    });
  });

  describe("resolveProp", () => {
    it("should resolve prop when no existing resolution", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(
        mockAdminUser as any,
      );

      const mockTrx = {
        selectFrom: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(null),
        insertInto: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await resolveProp({
        propId: 1,
        resolution: true,
        userId: 2,
      });

      expect(result.success).toBe(true);
      expect(mockTrx.insertInto).toHaveBeenCalledWith("resolutions");
    });

    it("should reject resolution when already resolved without overwrite", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(
        mockAdminUser as any,
      );

      const mockTrx = {
        selectFrom: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({ resolution: true }),
      };

      vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await resolveProp({
        propId: 1,
        resolution: false,
        userId: 2,
        overwrite: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("already has a resolution");
        expect(result.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should update resolution when overwrite is true", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(
        mockAdminUser as any,
      );

      const mockTrx = {
        selectFrom: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({ resolution: true }),
        updateTable: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(dbHelpers.withRLSAction).mockImplementation(async (userId, fn) => {
        return fn(mockTrx as any);
      });

      const result = await resolveProp({
        propId: 1,
        resolution: false,
        userId: 2,
        overwrite: true,
      });

      expect(result.success).toBe(true);
      expect(mockTrx.updateTable).toHaveBeenCalledWith("resolutions");
    });
  });

  describe("unresolveProp", () => {
    it("should delete resolution", async () => {
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

      const result = await unresolveProp({ propId: 1 });

      expect(result.success).toBe(true);
      expect(mockTrx.deleteFrom).toHaveBeenCalledWith("resolutions");
    });
  });

  describe("deleteProp", () => {
    it("should delete prop", async () => {
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

      const result = await deleteProp({ id: 1 });

      expect(result.success).toBe(true);
      expect(mockTrx.deleteFrom).toHaveBeenCalledWith("props");
    });

    it("should handle database errors", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(
        mockAdminUser as any,
      );
      vi.mocked(dbHelpers.withRLS).mockRejectedValue(
        new Error("Foreign key constraint"),
      );

      const result = await deleteProp({ id: 1 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("DATABASE_ERROR");
      }
    });
  });

  describe("deleteResolution", () => {
    it("should delete resolution by id", async () => {
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

      const result = await deleteResolution({ id: 1 });

      expect(result.success).toBe(true);
      expect(mockTrx.deleteFrom).toHaveBeenCalledWith("resolutions");
    });
  });
});
