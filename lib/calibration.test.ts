import { describe, it, expect } from "vitest";
import {
  computeCalibration,
  toResolvedForecasts,
  type ResolvedForecast,
} from "./calibration";
import type { VForecast } from "@/types/db_types";

describe("toResolvedForecasts", () => {
  it("drops unresolved forecasts and reduces to the calibration shape", () => {
    const forecasts = [
      { forecast: 0.8, resolution: true },
      { forecast: 0.3, resolution: false },
      { forecast: 0.5, resolution: null },
    ] as VForecast[];

    expect(toResolvedForecasts(forecasts)).toEqual([
      { forecast: 0.8, resolvedYes: true },
      { forecast: 0.3, resolvedYes: false },
    ]);
  });
});

describe("computeCalibration", () => {
  it("returns an empty result for no forecasts", () => {
    expect(computeCalibration([])).toEqual({
      buckets: [],
      total: 0,
      brierScore: null,
    });
  });

  it("omits empty bins and orders buckets low → high", () => {
    const forecasts: ResolvedForecast[] = [
      { forecast: 0.05, resolvedYes: false },
      { forecast: 0.95, resolvedYes: true },
    ];
    const { buckets, total } = computeCalibration(forecasts);
    expect(total).toBe(2);
    expect(buckets).toHaveLength(2);
    expect(buckets[0].binStart).toBe(0);
    expect(buckets[1].binStart).toBeCloseTo(0.9);
  });

  it("computes mean predicted and observed frequency per bin", () => {
    // Four forecasts in the 0.7–0.8 bin; 3 of 4 resolved YES.
    const forecasts: ResolvedForecast[] = [
      { forecast: 0.7, resolvedYes: true },
      { forecast: 0.72, resolvedYes: true },
      { forecast: 0.74, resolvedYes: true },
      { forecast: 0.76, resolvedYes: false },
    ];
    const { buckets } = computeCalibration(forecasts);
    expect(buckets).toHaveLength(1);
    expect(buckets[0].count).toBe(4);
    expect(buckets[0].meanPredicted).toBeCloseTo(0.73);
    expect(buckets[0].observedFrequency).toBe(0.75);
  });

  it("puts a forecast of exactly 1 in the final bin", () => {
    const { buckets } = computeCalibration([
      { forecast: 1, resolvedYes: true },
    ]);
    expect(buckets).toHaveLength(1);
    expect(buckets[0].binStart).toBeCloseTo(0.9);
    expect(buckets[0].binEnd).toBe(1);
  });

  it("computes the mean Brier score", () => {
    // Perfect predictions → Brier 0.
    expect(
      computeCalibration([
        { forecast: 1, resolvedYes: true },
        { forecast: 0, resolvedYes: false },
      ]).brierScore,
    ).toBe(0);

    // A single 0.5 prediction → (0.5 - 1)^2 = 0.25.
    expect(
      computeCalibration([{ forecast: 0.5, resolvedYes: true }]).brierScore,
    ).toBeCloseTo(0.25);
  });

  it("respects a custom bin count", () => {
    const forecasts: ResolvedForecast[] = [
      { forecast: 0.2, resolvedYes: false },
      { forecast: 0.8, resolvedYes: true },
    ];
    // With 2 bins the split is at 0.5, so two separate buckets.
    const { buckets } = computeCalibration(forecasts, 2);
    expect(buckets).toHaveLength(2);
    expect(buckets[0].binEnd).toBe(0.5);
  });
});
