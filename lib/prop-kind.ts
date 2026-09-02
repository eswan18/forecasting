/**
 * Prop kinds. Pure module: no database imports, safe for unit tests and
 * client components.
 *
 * - binary: one yes/no probability (every pre-existing prop).
 * - one_of: mutually exclusive options; probabilities sum to 1; exactly one
 *   option resolves true.
 * - any_of: independent options; probabilities unconstrained; any number of
 *   options (including none) resolve true.
 *
 * See docs/superpowers/specs/2026-09-01-choice-props-design.md.
 */
export const PROP_KINDS = ["binary", "one_of", "any_of"] as const;
export type PropKind = (typeof PROP_KINDS)[number];
export type ChoiceKind = Exclude<PropKind, "binary">;

export const PROP_KIND_LABELS: Record<PropKind, string> = {
  binary: "Yes / No",
  one_of: "Pick one",
  any_of: "Any that apply",
};

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 20;
export const MAX_OPTION_LENGTH = 200;

export function isChoiceKind(kind: PropKind): kind is ChoiceKind {
  return kind === "one_of" || kind === "any_of";
}

export function isPropKind(value: unknown): value is PropKind {
  return (
    typeof value === "string" && (PROP_KINDS as readonly string[]).includes(value)
  );
}

/**
 * Multiplier applied to Σ(outcome − probability)² to put every kind on the
 * same 0–1 scale: binary is the plain Brier, one_of halves the multi-category
 * Brier (so a two-option prop scores like a binary one), any_of averages the
 * per-option Briers.
 */
export function scoreWeight(kind: PropKind, optionCount: number): number {
  switch (kind) {
    case "binary":
      return 1;
    case "one_of":
      return 0.5;
    case "any_of":
      return 1 / optionCount;
  }
}
