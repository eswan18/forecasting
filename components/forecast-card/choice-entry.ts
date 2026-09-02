/**
 * Pure helpers for entering a choice-prop forecast. No React, no database
 * imports: the editor and its hook share these, and they are unit tested.
 *
 * Values are keyed by option id and hold a probability in 0..1, or null when
 * the option has no value yet. Percentages are only ever whole numbers — the
 * UI enters whole percents, so the running total is the rounded sum rather
 * than a sum of rounded parts (0.23 + 0.18 + 0.15 + 0.44 reads 100%).
 */
import type { ChoiceKind } from "@/lib/prop-kind";
import type { PropOptionSummary } from "@/types/db_types";

/** option_id → probability 0..1, or null when unset. */
export type ChoiceEntryValues = Record<number, number | null>;

/** Seed the editor from the options a prop view already carries. */
export function valuesFromOptions(
  options: PropOptionSummary[],
): ChoiceEntryValues {
  const values: ChoiceEntryValues = {};
  for (const option of options) {
    values[option.option_id] = option.user_forecast;
  }
  return values;
}

/** The running total as a whole percentage; unset options count as zero. */
export function entryTotalPercent(values: ChoiceEntryValues): number {
  let sum = 0;
  for (const value of Object.values(values)) {
    if (value !== null && value !== undefined) sum += value;
  }
  return Math.round(sum * 100);
}

/** Keep only the given option ids, so extra keys never affect a check. */
function pick(
  values: ChoiceEntryValues,
  optionIds: number[],
): ChoiceEntryValues {
  const picked: ChoiceEntryValues = {};
  for (const id of optionIds) {
    picked[id] = values[id] ?? null;
  }
  return picked;
}

/**
 * Is the entry ready to save? Every option needs a value, and a `one_of`
 * prop's values must total exactly 100%.
 */
export function isEntryComplete(
  kind: ChoiceKind,
  optionIds: number[],
  values: ChoiceEntryValues,
): boolean {
  const entry = pick(values, optionIds);
  if (Object.values(entry).some((value) => value === null)) return false;
  return kind === "one_of" ? entryTotalPercent(entry) === 100 : true;
}

/** Have any of the given options changed? Extra keys are ignored. */
export function entriesEqual(
  a: ChoiceEntryValues,
  b: ChoiceEntryValues,
  optionIds: number[],
): boolean {
  return optionIds.every((id) => (a[id] ?? null) === (b[id] ?? null));
}

/**
 * The payload shape `saveChoiceForecast` expects. Throws on an incomplete
 * entry: callers gate on `isEntryComplete` first.
 */
export function toProbabilities(
  values: ChoiceEntryValues,
  optionIds: number[],
): { optionId: number; probability: number }[] {
  return optionIds.map((optionId) => {
    const probability = values[optionId];
    if (probability === null || probability === undefined) {
      throw new Error(`No probability for option ${optionId}`);
    }
    return { optionId, probability };
  });
}
