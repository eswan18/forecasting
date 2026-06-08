import { describe, expect, it } from "vitest";
import {
  SWEEP_DEGREES,
  clamp01,
  valueToAngle,
  valueToRotation,
  valueToPoint,
} from "./forecast-needle";

const HALF_SWEEP = SWEEP_DEGREES / 2;
const toRad = (deg: number) => (deg * Math.PI) / 180;

describe("clamp01", () => {
  it("passes through values in range", () => {
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.37)).toBe(0.37);
    expect(clamp01(1)).toBe(1);
  });

  it("clamps out-of-range values", () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(1.5)).toBe(1);
  });

  it("treats NaN as 0", () => {
    expect(clamp01(Number.NaN)).toBe(0);
  });
});

describe("valueToAngle", () => {
  it("centers the arc on straight-up and spans SWEEP_DEGREES", () => {
    expect(valueToAngle(0)).toBeCloseTo(90 + HALF_SWEEP);
    expect(valueToAngle(0.5)).toBeCloseTo(90);
    expect(valueToAngle(1)).toBeCloseTo(90 - HALF_SWEEP);
  });

  it("is monotonically decreasing and symmetric about 0.5", () => {
    expect(valueToAngle(0.25)).toBeGreaterThan(valueToAngle(0.75));
    expect(valueToAngle(0.25) - 90).toBeCloseTo(90 - valueToAngle(0.75));
  });

  it("clamps before mapping", () => {
    expect(valueToAngle(-1)).toBeCloseTo(90 + HALF_SWEEP);
    expect(valueToAngle(2)).toBeCloseTo(90 - HALF_SWEEP);
  });
});

describe("valueToRotation", () => {
  it("maps 0 -> -SWEEP/2, 0.5 -> 0, 1 -> +SWEEP/2", () => {
    expect(valueToRotation(0)).toBeCloseTo(-HALF_SWEEP);
    expect(valueToRotation(0.5)).toBeCloseTo(0);
    expect(valueToRotation(1)).toBeCloseTo(HALF_SWEEP);
  });

  it("is the complement of the math angle (90 - angle)", () => {
    for (const v of [0, 0.2, 0.5, 0.8, 1]) {
      expect(valueToRotation(v)).toBeCloseTo(90 - valueToAngle(v));
    }
  });
});

describe("valueToPoint", () => {
  const cx = 88;
  const cy = 90;
  const r = 76;

  it("places value 0.5 straight above the center", () => {
    const p = valueToPoint(0.5, cx, cy, r);
    expect(p.x).toBeCloseTo(cx);
    expect(p.y).toBeCloseTo(cy - r);
  });

  it("lifts the ends symmetrically off the baseline", () => {
    const left = valueToPoint(0, cx, cy, r);
    const right = valueToPoint(1, cx, cy, r);

    // Symmetric about the vertical center line.
    expect(left.x).toBeCloseTo(cx - r * Math.sin(toRad(HALF_SWEEP)));
    expect(right.x).toBeCloseTo(cx + r * Math.sin(toRad(HALF_SWEEP)));
    expect(left.x + right.x).toBeCloseTo(2 * cx);

    // Ends sit above the hub (not on the baseline like a flat semicircle).
    expect(left.y).toBeCloseTo(cy - r * Math.cos(toRad(HALF_SWEEP)));
    expect(left.y).toBeCloseTo(right.y);
    expect(left.y).toBeLessThan(cy);
    expect(left.y).toBeGreaterThan(cy - r);
  });

  it("keeps tips above the center line for in-range values", () => {
    for (const v of [0.1, 0.3, 0.6, 0.9]) {
      expect(valueToPoint(v, cx, cy, r).y).toBeLessThan(cy);
    }
  });
});
