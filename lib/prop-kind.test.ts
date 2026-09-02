import { describe, expect, it } from "vitest";
import {
  PROP_KINDS,
  PROP_KIND_LABELS,
  isChoiceKind,
  isPropKind,
  scoreWeight,
} from "./prop-kind";

describe("prop-kind", () => {
  it("lists exactly the three kinds with a label each", () => {
    expect([...PROP_KINDS]).toEqual(["binary", "one_of", "any_of"]);
    for (const kind of PROP_KINDS) {
      expect(PROP_KIND_LABELS[kind]).toBeTruthy();
    }
  });

  it("isChoiceKind is true for one_of and any_of only", () => {
    expect(isChoiceKind("binary")).toBe(false);
    expect(isChoiceKind("one_of")).toBe(true);
    expect(isChoiceKind("any_of")).toBe(true);
  });

  it("isPropKind narrows unknown values", () => {
    expect(isPropKind("one_of")).toBe(true);
    expect(isPropKind("multi")).toBe(false);
    expect(isPropKind(null)).toBe(false);
  });

  it("scoreWeight is 1 for binary, 1/2 for one_of, 1/k for any_of", () => {
    expect(scoreWeight("binary", 1)).toBe(1);
    expect(scoreWeight("one_of", 7)).toBe(0.5);
    expect(scoreWeight("any_of", 4)).toBeCloseTo(0.25);
  });
});
