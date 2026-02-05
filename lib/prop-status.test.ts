import { describe, it, expect } from "vitest";
import {
  getPropStatus,
  getPropStatusFromProp,
  getPropStatusLabel,
  PropStatus,
} from "./prop-status";

describe("getPropStatus", () => {
  const now = new Date("2024-06-15T12:00:00Z");

  describe("resolution states", () => {
    it("should return resolved-yes when resolution is true", () => {
      const pastDate = new Date("2024-06-10T12:00:00Z");
      expect(getPropStatus(pastDate, true, { currentDate: now })).toBe(
        "resolved-yes",
      );
    });

    it("should return resolved-no when resolution is false", () => {
      const pastDate = new Date("2024-06-10T12:00:00Z");
      expect(getPropStatus(pastDate, false, { currentDate: now })).toBe(
        "resolved-no",
      );
    });

    it("should prioritize resolution over dates", () => {
      // Even if date is in the future, resolved props show resolution status
      const futureDate = new Date("2024-06-20T12:00:00Z");
      expect(getPropStatus(futureDate, true, { currentDate: now })).toBe(
        "resolved-yes",
      );
    });
  });

  describe("open state", () => {
    it("should return open when no close date", () => {
      expect(getPropStatus(null, null, { currentDate: now })).toBe("open");
    });

    it("should return open when close date is in the future", () => {
      const futureDate = new Date("2024-06-20T12:00:00Z"); // 5 days away
      expect(getPropStatus(futureDate, null, { currentDate: now })).toBe(
        "open",
      );
    });

    it("should return open when close date is soon but still in the future", () => {
      const soonDate = new Date("2024-06-16T10:00:00Z"); // 22 hours away
      expect(getPropStatus(soonDate, null, { currentDate: now })).toBe("open");
    });
  });

  describe("closed state", () => {
    it("should return closed when past deadline and not resolved", () => {
      const pastDate = new Date("2024-06-14T12:00:00Z"); // 1 day ago
      expect(getPropStatus(pastDate, null, { currentDate: now })).toBe(
        "closed",
      );
    });

    it("should return closed when exactly at deadline", () => {
      expect(getPropStatus(now, null, { currentDate: now })).toBe("closed");
    });
  });
});

describe("getPropStatusFromProp", () => {
  const now = new Date("2024-06-15T12:00:00Z");

  it("should use prop_forecasts_due_date for private competitions", () => {
    const prop = {
      prop_forecasts_due_date: new Date("2024-06-20T12:00:00Z"),
      competition_forecasts_close_date: new Date("2024-06-10T12:00:00Z"), // past
      competition_is_private: true,
      resolution: null,
    };
    // Private competition uses prop date (future), not competition date (past)
    expect(getPropStatusFromProp(prop, { currentDate: now })).toBe("open");
  });

  it("should use competition_forecasts_close_date for public competitions", () => {
    const prop = {
      prop_forecasts_due_date: new Date("2024-06-20T12:00:00Z"), // future
      competition_forecasts_close_date: new Date("2024-06-10T12:00:00Z"), // past
      competition_is_private: false,
      resolution: null,
    };
    // Public competition uses competition date (past)
    expect(getPropStatusFromProp(prop, { currentDate: now })).toBe("closed");
  });

  it("should handle missing dates gracefully", () => {
    const prop = {
      resolution: null,
    };
    expect(getPropStatusFromProp(prop, { currentDate: now })).toBe("open");
  });

  it("should return resolution status regardless of competition type", () => {
    const prop = {
      prop_forecasts_due_date: new Date("2024-06-20T12:00:00Z"),
      competition_is_private: true,
      resolution: true,
    };
    expect(getPropStatusFromProp(prop, { currentDate: now })).toBe(
      "resolved-yes",
    );
  });
});

describe("getPropStatusLabel", () => {
  it.each<[PropStatus, string]>([
    ["open", "Open"],
    ["closed", "Closed"],
    ["resolved-yes", "Yes"],
    ["resolved-no", "No"],
  ])("should return correct label for %s", (status, expected) => {
    expect(getPropStatusLabel(status)).toBe(expected);
  });
});
