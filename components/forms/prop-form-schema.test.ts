import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  DEFAULT_OPTION_FIELDS,
  propKindSchema,
  propOptionsSchema,
  refineKindOptions,
} from "./prop-form-schema";

const schema = z
  .object({ kind: propKindSchema, options: propOptionsSchema })
  .superRefine(refineKindOptions);

describe("prop form schema", () => {
  it("accepts binary with no options", () => {
    expect(schema.safeParse({ kind: "binary", options: [] }).success).toBe(true);
  });

  it("rejects binary with options", () => {
    const r = schema.safeParse({
      kind: "binary",
      options: [{ text: "A" }, { text: "B" }],
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["options"]);
  });

  it("accepts one_of with two distinct labels", () => {
    expect(
      schema.safeParse({
        kind: "one_of",
        options: [{ text: "A" }, { text: "B" }],
      }).success,
    ).toBe(true);
  });

  it("accepts any_of with two distinct labels", () => {
    expect(
      schema.safeParse({
        kind: "any_of",
        options: [{ text: "A" }, { text: "B" }],
      }).success,
    ).toBe(true);
  });

  it("rejects one_of with one label, blank labels, or duplicates, on the options path", () => {
    for (const options of [
      [{ text: "A" }],
      [{ text: "A" }, { text: " " }],
      [{ text: "A" }, { text: "A " }],
    ]) {
      const r = schema.safeParse({ kind: "one_of", options });
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0].path).toEqual(["options"]);
    }
  });

  it("rejects an unknown kind", () => {
    expect(propKindSchema.safeParse("multi").success).toBe(false);
  });

  it("accepts every known kind", () => {
    for (const kind of ["binary", "one_of", "any_of"]) {
      expect(propKindSchema.safeParse(kind).success).toBe(true);
    }
  });

  it("defaults to two blank option fields", () => {
    expect(DEFAULT_OPTION_FIELDS).toEqual([{ text: "" }, { text: "" }]);
  });
});
