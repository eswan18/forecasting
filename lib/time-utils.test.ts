import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime } from "./time-utils";

describe("formatDate", () => {
  const testDate = new Date("2025-01-15T17:00:00Z");

  it("should format date in UTC by default", () => {
    const result = formatDate(testDate);
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2025");
  });

  it("should format date in specified timezone", () => {
    // 5pm UTC = 12pm Eastern (UTC-5)
    const result = formatDate(testDate, "America/New_York");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
  });
});

describe("formatDateTime", () => {
  const testDate = new Date("2025-01-15T17:00:00Z");

  it("should format datetime in UTC by default with UTC label", () => {
    const result = formatDateTime(testDate);
    expect(result).toContain("17:00");
    expect(result).toContain("UTC");
  });

  it("should format datetime in specified timezone with timezone label", () => {
    const result = formatDateTime(testDate, "America/New_York");
    expect(result).toContain("12:00");
    // Check for timezone indicator (could be EST, EDT, or full name)
    expect(result).toMatch(/EST|EDT|Eastern/);
  });
});
