import { describe, expect, it } from "vitest";
import {
  clamp01,
  valueToAngle,
  valueToRotation,
  valueToPoint,
} from "./forecast-needle";

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
  it("maps 0 -> 180 (left), 0.5 -> 90 (up), 1 -> 0 (right)", () => {
    expect(valueToAngle(0)).toBe(180);
    expect(valueToAngle(0.5)).toBe(90);
    expect(valueToAngle(1)).toBe(0);
  });

  it("is monotonically decreasing", () => {
    expect(valueToAngle(0.25)).toBe(135);
    expect(valueToAngle(0.75)).toBe(45);
  });

  it("clamps before mapping", () => {
    expect(valueToAngle(-1)).toBe(180);
    expect(valueToAngle(2)).toBe(0);
  });
});

describe("valueToRotation", () => {
  it("maps 0 -> -90, 0.5 -> 0, 1 -> +90", () => {
    expect(valueToRotation(0)).toBe(-90);
    expect(valueToRotation(0.5)).toBe(0);
    expect(valueToRotation(1)).toBe(90);
  });

  it("is the complement of the math angle (90 - angle)", () => {
    for (const v of [0, 0.2, 0.5, 0.8, 1]) {
      expect(valueToRotation(v)).toBeCloseTo(90 - valueToAngle(v));
    }
  });
});

describe("valueToPoint", () => {
  const cx = 100;
  const cy = 95;
  const r = 66;

  it("places value 0.5 straight above the center", () => {
    const p = valueToPoint(0.5, cx, cy, r);
    expect(p.x).toBeCloseTo(cx);
    expect(p.y).toBeCloseTo(cy - r);
  });

  it("places value 0 to the left and value 1 to the right at center height", () => {
    const left = valueToPoint(0, cx, cy, r);
    expect(left.x).toBeCloseTo(cx - r);
    expect(left.y).toBeCloseTo(cy);

    const right = valueToPoint(1, cx, cy, r);
    expect(right.x).toBeCloseTo(cx + r);
    expect(right.y).toBeCloseTo(cy);
  });

  it("keeps tips above the center line for in-range values", () => {
    for (const v of [0.1, 0.3, 0.6, 0.9]) {
      expect(valueToPoint(v, cx, cy, r).y).toBeLessThan(cy);
    }
  });
});
