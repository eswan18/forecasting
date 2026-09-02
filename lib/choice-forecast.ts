/**
 * Validation and scoring for choice props. Pure module (no database imports).
 * `scoreChoiceForecast` is the TypeScript reference for the SQL expression in
 * `v_forecasts.score`; container tests pin the two together.
 */
import {
  type ChoiceKind,
  MAX_OPTIONS,
  MAX_OPTION_LENGTH,
  MIN_OPTIONS,
  scoreWeight,
} from "./prop-kind";

export interface OptionProbability {
  optionId: number;
  probability: number;
}

export interface OptionOutcome {
  optionId: number;
  outcome: boolean;
}

export const PROBABILITY_SUM_TOLERANCE = 1e-6;

export function validateOptionLabels(labels: string[]): string[] {
  const errors: string[] = [];
  const trimmed = labels.map((l) => l.trim());
  if (trimmed.length < MIN_OPTIONS) {
    errors.push(`At least ${MIN_OPTIONS} options are required`);
  }
  if (trimmed.length > MAX_OPTIONS) {
    errors.push(`At most ${MAX_OPTIONS} options are allowed`);
  }
  if (trimmed.some((l) => l.length === 0)) {
    errors.push("Options cannot be blank");
  }
  if (trimmed.some((l) => l.length > MAX_OPTION_LENGTH)) {
    errors.push(`Options must be at most ${MAX_OPTION_LENGTH} characters`);
  }
  if (new Set(trimmed).size !== trimmed.length) {
    errors.push("Options must be unique");
  }
  return errors;
}

/** Shared coverage check: every option id exactly once, nothing extra. */
function coverageErrors(
  optionIds: number[],
  given: { optionId: number }[],
  what: string,
): string[] {
  const errors: string[] = [];
  const expected = new Set(optionIds);
  const seen = new Set<number>();
  for (const { optionId } of given) {
    if (!expected.has(optionId)) {
      errors.push(`Unknown option ${optionId}`);
    }
    if (seen.has(optionId)) {
      errors.push(`Option ${optionId} appears more than once`);
    }
    seen.add(optionId);
  }
  for (const id of expected) {
    if (!seen.has(id)) {
      errors.push(`Missing ${what} for option ${id}`);
    }
  }
  return errors;
}

export function validateChoiceForecast(
  kind: ChoiceKind,
  optionIds: number[],
  probabilities: OptionProbability[],
): string[] {
  const errors = coverageErrors(optionIds, probabilities, "probability");
  for (const { probability } of probabilities) {
    if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
      errors.push("Probabilities must be between 0 and 1");
      break;
    }
  }
  if (kind === "one_of" && errors.length === 0) {
    const sum = probabilities.reduce((acc, p) => acc + p.probability, 0);
    if (Math.abs(sum - 1) > PROBABILITY_SUM_TOLERANCE) {
      errors.push("Probabilities for a pick-one prop must sum to 100%");
    }
  }
  return errors;
}

export function validateChoiceOutcomes(
  kind: ChoiceKind,
  optionIds: number[],
  outcomes: OptionOutcome[],
): string[] {
  const errors = coverageErrors(optionIds, outcomes, "outcome");
  if (kind === "one_of" && errors.length === 0) {
    const trues = outcomes.filter((o) => o.outcome).length;
    if (trues !== 1) {
      errors.push("A pick-one prop must resolve with exactly one option true");
    }
  }
  return errors;
}

export function scoreBinaryForecast(forecast: number, resolution: boolean): number {
  const outcome = resolution ? 1 : 0;
  return (outcome - forecast) ** 2;
}

export function scoreChoiceForecast(
  kind: ChoiceKind,
  probabilities: OptionProbability[],
  outcomes: OptionOutcome[],
): number {
  const outcomeById = new Map(outcomes.map((o) => [o.optionId, o.outcome ? 1 : 0]));
  let sum = 0;
  for (const { optionId, probability } of probabilities) {
    const outcome = outcomeById.get(optionId);
    if (outcome === undefined) {
      throw new Error(`No outcome for option ${optionId}`);
    }
    sum += (outcome - probability) ** 2;
  }
  return sum * scoreWeight(kind, probabilities.length);
}
