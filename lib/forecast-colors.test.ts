import { describe, it, expect } from "vitest";
import { getProbabilityColors } from "./forecast-colors";

describe("getProbabilityColors", () => {
  it("returns a muted set for a null forecast", () => {
    const c = getProbabilityColors(null);
    expect(c.bg).toBe("bg-muted");
    expect(c.text).toBe("text-muted-foreground");
    expect(c.bar).toBe("bg-muted-foreground/30");
    expect(c.border).toBe("border-muted-foreground/30");
  });

  it("maps each 20% bucket to a distinct indigo bar at the boundaries", () => {
    // ≤20
    expect(getProbabilityColors(0).bar).toBe("bg-indigo-300 dark:bg-indigo-700");
    expect(getProbabilityColors(0.2).bar).toBe("bg-indigo-300 dark:bg-indigo-700");
    // ≤40
    expect(getProbabilityColors(0.21).bar).toBe("bg-indigo-400 dark:bg-indigo-600");
    expect(getProbabilityColors(0.4).bar).toBe("bg-indigo-400 dark:bg-indigo-600");
    // ≤60
    expect(getProbabilityColors(0.41).bar).toBe("bg-indigo-500 dark:bg-indigo-500");
    expect(getProbabilityColors(0.6).bar).toBe("bg-indigo-500 dark:bg-indigo-500");
    // ≤80
    expect(getProbabilityColors(0.61).bar).toBe("bg-indigo-600 dark:bg-indigo-400");
    expect(getProbabilityColors(0.8).bar).toBe("bg-indigo-600 dark:bg-indigo-400");
    // >80
    expect(getProbabilityColors(0.81).bar).toBe("bg-indigo-700 dark:bg-indigo-300");
    expect(getProbabilityColors(1).bar).toBe("bg-indigo-700 dark:bg-indigo-300");
  });

  it("uses a single indigo hue across every bucket (no stoplight ramp)", () => {
    for (const p of [0, 0.3, 0.5, 0.7, 0.95]) {
      const c = getProbabilityColors(p);
      expect(c.bg).toMatch(/^bg-indigo-\d+ dark:bg-indigo-\d+$/);
      expect(c.text).toMatch(/^text-(indigo-\d+|white) dark:text-indigo-\d+$/);
      expect(c.bar).toMatch(/^bg-indigo-\d+ dark:bg-indigo-\d+$/);
      expect(c.border).toMatch(/^border-indigo-\d+ dark:border-indigo-\d+$/);
    }
  });

  it("deepens monotonically with probability (light-mode bar shade increases)", () => {
    const shade = (p: number) =>
      Number(getProbabilityColors(p).bar.match(/^bg-indigo-(\d+)/)![1]);
    const shades = [0.1, 0.3, 0.5, 0.7, 0.9].map(shade);
    const ascending = [...shades].sort((a, b) => a - b);
    expect(shades).toEqual(ascending);
    expect(new Set(shades).size).toBe(shades.length); // every bucket distinct
  });
});
