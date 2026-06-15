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

  it("maps low probabilities to red", () => {
    expect(getProbabilityColors(0).bar).toBe("bg-red-400");
    expect(getProbabilityColors(0.2).bar).toBe("bg-red-400");
  });

  it("maps each bucket to its hue at the boundaries", () => {
    expect(getProbabilityColors(0.21).bar).toBe("bg-orange-400");
    expect(getProbabilityColors(0.4).bar).toBe("bg-orange-400");
    expect(getProbabilityColors(0.41).bar).toBe("bg-yellow-500");
    expect(getProbabilityColors(0.6).bar).toBe("bg-yellow-500");
    expect(getProbabilityColors(0.61).bar).toBe("bg-lime-500");
    expect(getProbabilityColors(0.8).bar).toBe("bg-lime-500");
  });

  it("maps high probabilities to green", () => {
    expect(getProbabilityColors(0.81).bar).toBe("bg-green-500");
    expect(getProbabilityColors(1).bar).toBe("bg-green-500");
  });

  it("pairs a tinted bg with a tinted text in every bucket", () => {
    for (const p of [0, 0.3, 0.5, 0.7, 0.95]) {
      const c = getProbabilityColors(p);
      expect(c.bg).toMatch(/^bg-\w+-100 dark:bg-\w+-950$/);
      expect(c.text).toMatch(/^text-\w+-700 dark:text-\w+-400$/);
    }
  });
});
