import { z } from "zod";

import { validateOptionLabels } from "@/lib/choice-forecast";
import { PROP_KINDS, isChoiceKind, type PropKind } from "@/lib/prop-kind";

/**
 * The prop form's validation, used by `new-prop-form.tsx`. Kept free of
 * database imports so it can be unit tested (see the CLAUDE.md testability
 * rule) — that separation is the whole reason this is its own file.
 */

export const propKindSchema = z.enum(PROP_KINDS);

/**
 * Options as the form holds them: react-hook-form field arrays need objects,
 * not bare strings. Length and content limits live in `refineKindOptions`,
 * which only applies them for choice kinds.
 */
export const propOptionsSchema = z.array(z.object({ text: z.string() }));

export type PropOptionField = z.infer<typeof propOptionsSchema>[number];

/**
 * A fresh pair of blank option rows for a form switching to a choice kind.
 * A factory rather than a constant: each caller writes these straight into
 * form state, so they must not share one array of objects.
 */
export const defaultOptionFields = (): PropOptionField[] => [
  { text: "" },
  { text: "" },
];

/**
 * `superRefine` callback tying `kind` and `options` together: choice kinds
 * need options that pass `validateOptionLabels`, binary props must have none.
 * Every issue lands on `["options"]` so the options editor shows it.
 */
export function refineKindOptions(
  data: { kind: PropKind; options: PropOptionField[] },
  ctx: z.RefinementCtx,
): void {
  if (isChoiceKind(data.kind)) {
    for (const message of validateOptionLabels(
      data.options.map((option) => option.text),
    )) {
      ctx.addIssue({ code: "custom", path: ["options"], message });
    }
  } else if (data.options.length > 0) {
    ctx.addIssue({
      code: "custom",
      path: ["options"],
      message: "Yes/no propositions do not have options",
    });
  }
}
