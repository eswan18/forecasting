import { describe, expect, it } from "vitest";

import {
  entriesEqual,
  entryTotalPercent,
  isEntryComplete,
  toProbabilities,
  valuesFromOptions,
} from "./choice-entry";

const ids = [1, 2, 3];

describe("choice-entry", () => {
  it("valuesFromOptions maps user_forecast per option", () => {
    const opts = [
      {
        option_id: 1,
        text: "A",
        position: 0,
        outcome: null,
        user_forecast: 0.5,
        community_average: null,
      },
      {
        option_id: 2,
        text: "B",
        position: 1,
        outcome: null,
        user_forecast: null,
        community_average: null,
      },
    ];
    expect(valuesFromOptions(opts)).toEqual({ 1: 0.5, 2: null });
  });

  it("entryTotalPercent rounds to whole percents and ignores nulls", () => {
    expect(entryTotalPercent({ 1: 0.23, 2: 0.18, 3: 0.15, 4: 0.44 })).toBe(100);
    expect(entryTotalPercent({ 1: 0.5, 2: null })).toBe(50);
  });

  it("isEntryComplete: any_of needs every value; one_of also needs total 100", () => {
    expect(isEntryComplete("any_of", ids, { 1: 0.1, 2: 0.2, 3: 0.3 })).toBe(
      true,
    );
    expect(isEntryComplete("any_of", ids, { 1: 0.1, 2: null, 3: 0.3 })).toBe(
      false,
    );
    expect(isEntryComplete("one_of", ids, { 1: 0.5, 2: 0.3, 3: 0.2 })).toBe(
      true,
    );
    expect(isEntryComplete("one_of", ids, { 1: 0.5, 2: 0.3, 3: 0.3 })).toBe(
      false,
    );
  });

  it("entriesEqual compares only the given option ids", () => {
    expect(
      entriesEqual({ 1: 0.5, 2: 0.5 }, { 1: 0.5, 2: 0.5, 9: 1 }, [1, 2]),
    ).toBe(true);
    expect(entriesEqual({ 1: 0.5, 2: 0.5 }, { 1: 0.5, 2: 0.4 }, [1, 2])).toBe(
      false,
    );
  });

  it("toProbabilities emits one entry per option id and throws on null", () => {
    expect(toProbabilities({ 1: 0.5, 2: 0.5 }, [1, 2])).toEqual([
      { optionId: 1, probability: 0.5 },
      { optionId: 2, probability: 0.5 },
    ]);
    expect(() => toProbabilities({ 1: 0.5, 2: null }, [1, 2])).toThrow();
  });
});
