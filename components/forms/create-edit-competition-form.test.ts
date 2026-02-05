import { describe, it, expect } from "vitest";
import { competitionFormSchema } from "./competition-form-schema";

// Helper to build a valid public competition input
function validPublic(overrides = {}) {
  return {
    name: "Test Competition 2025",
    is_private: false,
    forecasts_open_date: new Date("2025-01-01"),
    forecasts_close_date: new Date("2025-06-01"),
    end_date: new Date("2025-12-01"),
    ...overrides,
  };
}

// Helper to build a valid private competition input
function validPrivate(overrides = {}) {
  return {
    name: "Private Competition 2025",
    is_private: true,
    ...overrides,
  };
}

function getFieldErrors(result: { error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  const map: Record<string, string[]> = {};
  for (const issue of result.error?.issues ?? []) {
    const key = issue.path.join(".");
    if (!map[key]) map[key] = [];
    map[key].push(issue.message);
  }
  return map;
}

describe("competitionFormSchema", () => {
  describe("name validation", () => {
    it("rejects names shorter than 8 characters", () => {
      const result = competitionFormSchema.safeParse(validPublic({ name: "Short" }));
      expect(result.success).toBe(false);
      const errors = getFieldErrors(result);
      expect(errors["name"]).toBeDefined();
    });

    it("accepts names with exactly 8 characters", () => {
      const result = competitionFormSchema.safeParse(validPublic({ name: "12345678" }));
      expect(result.success).toBe(true);
    });

    it("rejects empty names", () => {
      const result = competitionFormSchema.safeParse(validPublic({ name: "" }));
      expect(result.success).toBe(false);
    });
  });

  describe("private competitions", () => {
    it("passes with no dates", () => {
      const result = competitionFormSchema.safeParse(validPrivate());
      expect(result.success).toBe(true);
    });

    it("passes even with dates provided", () => {
      const result = competitionFormSchema.safeParse(
        validPrivate({
          forecasts_open_date: new Date("2025-01-01"),
          forecasts_close_date: new Date("2025-06-01"),
          end_date: new Date("2025-12-01"),
        }),
      );
      expect(result.success).toBe(true);
    });

    it("passes with out-of-order dates (private ignores date ordering)", () => {
      const result = competitionFormSchema.safeParse(
        validPrivate({
          forecasts_open_date: new Date("2025-12-01"),
          forecasts_close_date: new Date("2025-06-01"),
          end_date: new Date("2025-01-01"),
        }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe("public competitions — date requirements", () => {
    it("requires forecasts_open_date", () => {
      const result = competitionFormSchema.safeParse(
        validPublic({ forecasts_open_date: undefined }),
      );
      expect(result.success).toBe(false);
      const errors = getFieldErrors(result);
      expect(errors["forecasts_open_date"]).toBeDefined();
    });

    it("requires forecasts_close_date", () => {
      const result = competitionFormSchema.safeParse(
        validPublic({ forecasts_close_date: undefined }),
      );
      expect(result.success).toBe(false);
      const errors = getFieldErrors(result);
      expect(errors["forecasts_close_date"]).toBeDefined();
    });

    it("requires end_date", () => {
      const result = competitionFormSchema.safeParse(
        validPublic({ end_date: undefined }),
      );
      expect(result.success).toBe(false);
      const errors = getFieldErrors(result);
      expect(errors["end_date"]).toBeDefined();
    });

    it("reports all missing dates at once", () => {
      const result = competitionFormSchema.safeParse(
        validPublic({
          forecasts_open_date: undefined,
          forecasts_close_date: undefined,
          end_date: undefined,
        }),
      );
      expect(result.success).toBe(false);
      const errors = getFieldErrors(result);
      expect(errors["forecasts_open_date"]).toBeDefined();
      expect(errors["forecasts_close_date"]).toBeDefined();
      expect(errors["end_date"]).toBeDefined();
    });
  });

  describe("public competitions — date ordering", () => {
    it("passes with correctly ordered dates", () => {
      const result = competitionFormSchema.safeParse(validPublic());
      expect(result.success).toBe(true);
    });

    it("rejects open_date equal to close_date", () => {
      const sameDate = new Date("2025-06-01");
      const result = competitionFormSchema.safeParse(
        validPublic({
          forecasts_open_date: sameDate,
          forecasts_close_date: sameDate,
        }),
      );
      expect(result.success).toBe(false);
      const errors = getFieldErrors(result);
      expect(errors["forecasts_open_date"]).toBeDefined();
      expect(errors["forecasts_close_date"]).toBeDefined();
    });

    it("rejects open_date after close_date", () => {
      const result = competitionFormSchema.safeParse(
        validPublic({
          forecasts_open_date: new Date("2025-07-01"),
          forecasts_close_date: new Date("2025-06-01"),
        }),
      );
      expect(result.success).toBe(false);
      const errors = getFieldErrors(result);
      expect(errors["forecasts_open_date"]).toBeDefined();
      expect(errors["forecasts_close_date"]).toBeDefined();
    });

    it("rejects close_date equal to end_date", () => {
      const sameDate = new Date("2025-12-01");
      const result = competitionFormSchema.safeParse(
        validPublic({
          forecasts_close_date: sameDate,
          end_date: sameDate,
        }),
      );
      expect(result.success).toBe(false);
      const errors = getFieldErrors(result);
      expect(errors["forecasts_close_date"]).toBeDefined();
      expect(errors["end_date"]).toBeDefined();
    });

    it("rejects close_date after end_date", () => {
      const result = competitionFormSchema.safeParse(
        validPublic({
          forecasts_close_date: new Date("2025-12-15"),
          end_date: new Date("2025-12-01"),
        }),
      );
      expect(result.success).toBe(false);
      const errors = getFieldErrors(result);
      expect(errors["forecasts_close_date"]).toBeDefined();
      expect(errors["end_date"]).toBeDefined();
    });

    it("skips ordering validation when some dates are missing", () => {
      // When close_date is missing, we get the "required" error but NOT ordering errors
      const result = competitionFormSchema.safeParse(
        validPublic({
          forecasts_open_date: new Date("2025-12-01"), // would be after close if close existed
          forecasts_close_date: undefined,
          end_date: new Date("2025-06-01"),
        }),
      );
      expect(result.success).toBe(false);
      const errors = getFieldErrors(result);
      // Should only have the "required" error for close_date
      expect(errors["forecasts_close_date"]).toHaveLength(1);
      expect(errors["forecasts_close_date"]![0]).toMatch(/required/i);
    });
  });
});
