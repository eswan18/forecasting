import { describe, expect, it } from "vitest";
import {
  validateOptionLabels,
  validateChoiceForecast,
  validateChoiceOutcomes,
  scoreBinaryForecast,
  scoreChoiceForecast,
} from "./choice-forecast";

const ids = [10, 20, 30, 40];
const uniform = (n: number) =>
  ids.slice(0, n).map((optionId) => ({ optionId, probability: 1 / n }));
const oneHot = (winner: number, n: number) =>
  ids.slice(0, n).map((optionId) => ({ optionId, outcome: optionId === winner }));

describe("validateOptionLabels", () => {
  it("accepts 2..20 trimmed unique non-empty labels", () => {
    expect(validateOptionLabels(["Knicks", " Spurs "])).toEqual([]);
  });
  it("rejects fewer than 2", () => {
    expect(validateOptionLabels(["Only"])).not.toEqual([]);
  });
  it("rejects more than 20", () => {
    const many = Array.from({ length: 21 }, (_, i) => `Option ${i}`);
    expect(validateOptionLabels(many)).not.toEqual([]);
  });
  it("rejects blank labels", () => {
    expect(validateOptionLabels(["A", "   "])).not.toEqual([]);
  });
  it("rejects duplicates after trimming", () => {
    expect(validateOptionLabels(["A", "A "])).not.toEqual([]);
  });
  it("rejects labels over 200 characters", () => {
    expect(validateOptionLabels(["A", "x".repeat(201)])).not.toEqual([]);
  });
});

describe("validateChoiceForecast", () => {
  it("accepts a one_of forecast that covers every option and sums to 1", () => {
    expect(validateChoiceForecast("one_of", ids, uniform(4))).toEqual([]);
  });
  it("tolerates floating-point drift in the sum", () => {
    const probs = [0.23, 0.18, 0.15, 0.44].map((probability, i) => ({
      optionId: ids[i],
      probability,
    }));
    expect(validateChoiceForecast("one_of", ids, probs)).toEqual([]);
  });
  it("rejects a one_of forecast that does not sum to 1", () => {
    const probs = ids.map((optionId) => ({ optionId, probability: 0.5 }));
    expect(validateChoiceForecast("one_of", ids, probs)).not.toEqual([]);
  });
  it("accepts an any_of forecast with any sum", () => {
    const probs = ids.map((optionId) => ({ optionId, probability: 0.9 }));
    expect(validateChoiceForecast("any_of", ids, probs)).toEqual([]);
  });
  it("rejects a missing option", () => {
    expect(validateChoiceForecast("any_of", ids, uniform(3))).not.toEqual([]);
  });
  it("rejects an unknown option", () => {
    const probs = [...uniform(4), { optionId: 999, probability: 0 }];
    expect(validateChoiceForecast("any_of", ids, probs)).not.toEqual([]);
  });
  it("rejects a duplicated option", () => {
    const probs = [...uniform(4), { optionId: 10, probability: 0 }];
    expect(validateChoiceForecast("any_of", ids, probs)).not.toEqual([]);
  });
  it("rejects probabilities outside [0, 1] or non-finite", () => {
    const bad = ids.map((optionId) => ({ optionId, probability: 1.2 }));
    expect(validateChoiceForecast("any_of", ids, bad)).not.toEqual([]);
    const nan = ids.map((optionId) => ({ optionId, probability: NaN }));
    expect(validateChoiceForecast("any_of", ids, nan)).not.toEqual([]);
  });
});

describe("validateChoiceOutcomes", () => {
  it("accepts a one_of resolution with exactly one true", () => {
    expect(validateChoiceOutcomes("one_of", ids, oneHot(20, 4))).toEqual([]);
  });
  it("rejects a one_of resolution with zero or two trues", () => {
    const none = ids.map((optionId) => ({ optionId, outcome: false }));
    const two = ids.map((optionId) => ({ optionId, outcome: optionId <= 20 }));
    expect(validateChoiceOutcomes("one_of", ids, none)).not.toEqual([]);
    expect(validateChoiceOutcomes("one_of", ids, two)).not.toEqual([]);
  });
  it("accepts an any_of resolution with zero, some, or all true", () => {
    const none = ids.map((optionId) => ({ optionId, outcome: false }));
    const all = ids.map((optionId) => ({ optionId, outcome: true }));
    expect(validateChoiceOutcomes("any_of", ids, none)).toEqual([]);
    expect(validateChoiceOutcomes("any_of", ids, all)).toEqual([]);
  });
  it("rejects missing, unknown, or duplicated options", () => {
    expect(validateChoiceOutcomes("any_of", ids, oneHot(10, 3))).not.toEqual([]);
    expect(
      validateChoiceOutcomes("any_of", ids, [...oneHot(10, 4), { optionId: 999, outcome: false }]),
    ).not.toEqual([]);
    expect(
      validateChoiceOutcomes("any_of", ids, [...oneHot(10, 4), { optionId: 10, outcome: false }]),
    ).not.toEqual([]);
  });
});

describe("scoring", () => {
  it("binary is the plain Brier", () => {
    expect(scoreBinaryForecast(0.7, true)).toBeCloseTo(0.09);
    expect(scoreBinaryForecast(0.7, false)).toBeCloseTo(0.49);
  });
  it("one_of: uniform over 2/4/10 options scores 0.25 / 0.375 / 0.45", () => {
    const many = Array.from({ length: 10 }, (_, i) => i + 1);
    const u10 = many.map((optionId) => ({ optionId, probability: 0.1 }));
    const o10 = many.map((optionId) => ({ optionId, outcome: optionId === 1 }));
    expect(scoreChoiceForecast("one_of", uniform(2), oneHot(10, 2))).toBeCloseTo(0.25);
    expect(scoreChoiceForecast("one_of", uniform(4), oneHot(10, 4))).toBeCloseTo(0.375);
    expect(scoreChoiceForecast("one_of", u10, o10)).toBeCloseTo(0.45);
  });
  it("one_of: a perfect forecast scores 0 and all mass on a loser scores 1", () => {
    const perfect = ids.map((optionId) => ({ optionId, probability: optionId === 20 ? 1 : 0 }));
    const wrong = ids.map((optionId) => ({ optionId, probability: optionId === 30 ? 1 : 0 }));
    expect(scoreChoiceForecast("one_of", perfect, oneHot(20, 4))).toBeCloseTo(0);
    expect(scoreChoiceForecast("one_of", wrong, oneHot(20, 4))).toBeCloseTo(1);
  });
  it("one_of: two options reduces to the binary Brier", () => {
    const probs = [{ optionId: 10, probability: 0.7 }, { optionId: 20, probability: 0.3 }];
    expect(scoreChoiceForecast("one_of", probs, oneHot(10, 2))).toBeCloseTo(scoreBinaryForecast(0.7, true));
  });
  it("any_of: 50% on every option scores 0.25 regardless of count", () => {
    const half = (n: number) => ids.slice(0, n).map((optionId) => ({ optionId, probability: 0.5 }));
    expect(scoreChoiceForecast("any_of", half(2), oneHot(10, 2))).toBeCloseTo(0.25);
    expect(scoreChoiceForecast("any_of", half(4), oneHot(10, 4))).toBeCloseTo(0.25);
  });
  it("any_of: is the mean of per-option binary Briers", () => {
    const probs = [{ optionId: 10, probability: 0.9 }, { optionId: 20, probability: 0.2 }];
    const outs = [{ optionId: 10, outcome: true }, { optionId: 20, outcome: true }];
    expect(scoreChoiceForecast("any_of", probs, outs)).toBeCloseTo((0.01 + 0.64) / 2);
  });
  it("matches options by id, not by array order", () => {
    const probs = [{ optionId: 20, probability: 1 }, { optionId: 10, probability: 0 }];
    expect(scoreChoiceForecast("one_of", probs, oneHot(20, 2))).toBeCloseTo(0);
  });
});
