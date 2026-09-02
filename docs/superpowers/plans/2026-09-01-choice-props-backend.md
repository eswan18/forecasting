# Choice Props — Stage One (Database + Backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the database and server actions able to store, validate and score choice props (`one_of` / `any_of`) with per-option probabilities, while every existing binary prop keeps working unchanged and no new UI ships.

**Architecture:** Header rows stay one-per-(user, prop) in `forecasts` and one-per-prop in `resolutions`; per-option values live in new child tables `forecast_options` / `resolution_options` keyed to a new `prop_options` table. The `v_forecasts.score` column becomes the per-prop score for every kind so the existing `AVG(score)` aggregation is untouched. Two pure TypeScript modules hold the kind metadata, validation, and a reference score implementation that container tests pin to the SQL.

**Tech Stack:** Next.js 15 app router, TypeScript, Kysely + `pg`, PostgreSQL 15+ (Neon in prod, `postgres:16-alpine` in testcontainers), Vitest, Zod (not used in this stage).

**Spec:** `docs/superpowers/specs/2026-09-01-choice-props-design.md` — read it first; this plan argues from it.

## Global Constraints

- Scores stay on the **0 to 1** Brier scale. `one_of` = `½ · Σ(oᵢ − pᵢ)²`, `any_of` = `(1/k) · Σ(oᵢ − pᵢ)²`, binary = `(o − p)²`.
- Kind values are exactly `"binary" | "one_of" | "any_of"`; the view column is `prop_kind`.
- `MIN_OPTIONS = 2`, `MAX_OPTIONS = 20`, `MAX_OPTION_LENGTH = 200`, `PROBABILITY_SUM_TOLERANCE = 1e-6`.
- Pure modules (`lib/prop-kind.ts`, `lib/choice-forecast.ts`) must not import anything that transitively imports `lib/database.ts` (unit tests run without `DATABASE_URL`).
- "Is resolved" checks use `resolution_id` (or `score IS NOT NULL` where a score is wanted), never the `resolution` boolean.
- "Has this user forecasted" is `user_forecast_id !== null`, never `user_forecast !== null`.
- Server actions return `ServerActionResult<T>` via `success` / `error` / `validationError` from `@/lib/server-action-result`, run DB work inside `withRLS` / `withRLSAction` from `@/lib/db-helpers`, and log with `logger` like their neighbours. See `docs/server-actions-best-practices.md`.
- New migration = new entry in `lib/migrations/manifest.ts`: run `npx tsx scripts/generate-migration-manifest.ts` and commit the result.
- Docker is **not** available on the dev machine. Container tests (`ifRunningContainerTestsIt`) skip locally and run in CI. Write them anyway, carefully; `npm run test` must stay green locally, `npx tsc --noEmit` and `npm run lint` must pass.
- `pg` returns `numeric`/`decimal` columns as **strings** (the test bootstrap's `forecasts.forecast` is `decimal`). Wrap with `Number()` before comparing.
- Commit after every task with the trailer:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01BqHhYaxchKxPy6gJahfQbg
  ```

---

## File map

| File | Responsibility |
|---|---|
| `lib/prop-kind.ts` (new) | Kind union, labels, limits, `isChoiceKind`, `scoreWeight`. |
| `lib/choice-forecast.ts` (new) | Validation of labels / probabilities / outcomes; TS reference score. |
| `migrations/1788220800000_add-choice-props.ts` (new) | Everything in spec §2. |
| `lib/migrations/manifest.ts` | Regenerated. |
| `types/db_types.ts` | New tables/view, nullable columns, `PropOptionSummary`, `options` on `PropWithUserForecast`. |
| `tests/helpers/testFactories.ts` | Drop `resolved_at`; add `createChoiceProp`, `createChoiceForecast`, `createChoiceResolution`. |
| `lib/db_actions/prop-options.ts` (new) | `attachOptions` read helper + `updatePropOptions` action. |
| `lib/db_actions/forecasts.ts` | `saveChoiceForecast`; kind guards; `options` on read actions. |
| `lib/db_actions/props.ts` | `createProp` options; `updateProp` kind guard; `resolveProp` outcomes. |
| `lib/db_actions/competition-scores.ts` | `score IS NOT NULL`; `kind` + `options` on breakdown rows. |
| `lib/db_actions/competition-stats.ts` | `kind` + `hasUserForecast` on deadlines. |
| `lib/db_actions/index.ts` | Export the new module. |
| Analytics/display consumers (see Task 3 step 6) | Binary-only filters / null handling forced by the nullable `forecast`. |

---

### Task 1: `lib/prop-kind.ts`

**Files:**
- Create: `lib/prop-kind.ts`
- Test: `lib/prop-kind.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const PROP_KINDS: readonly ["binary", "one_of", "any_of"];
  export type PropKind = "binary" | "one_of" | "any_of";
  export type ChoiceKind = "one_of" | "any_of";
  export const PROP_KIND_LABELS: Record<PropKind, string>;
  export const MIN_OPTIONS: 2; MAX_OPTIONS: 20; MAX_OPTION_LENGTH: 200;
  export function isChoiceKind(kind: PropKind): kind is ChoiceKind;
  export function isPropKind(value: unknown): value is PropKind;
  export function scoreWeight(kind: PropKind, optionCount: number): number;
  ```

- [ ] **Step 1: Write the failing test** — `lib/prop-kind.test.ts`

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/prop-kind.test.ts`
Expected: FAIL — cannot resolve `./prop-kind`.

- [ ] **Step 3: Implement** — `lib/prop-kind.ts`

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/prop-kind.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/prop-kind.ts lib/prop-kind.test.ts
git commit -m "feat(props): add prop-kind pure module"
```

---

### Task 2: `lib/choice-forecast.ts`

**Files:**
- Create: `lib/choice-forecast.ts`
- Test: `lib/choice-forecast.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  ```ts
  export interface OptionProbability { optionId: number; probability: number }
  export interface OptionOutcome { optionId: number; outcome: boolean }
  export const PROBABILITY_SUM_TOLERANCE = 1e-6;
  export function validateOptionLabels(labels: string[]): string[];
  export function validateChoiceForecast(kind: ChoiceKind, optionIds: number[], probabilities: OptionProbability[]): string[];
  export function validateChoiceOutcomes(kind: ChoiceKind, optionIds: number[], outcomes: OptionOutcome[]): string[];
  export function scoreBinaryForecast(forecast: number, resolution: boolean): number;
  export function scoreChoiceForecast(kind: ChoiceKind, probabilities: OptionProbability[], outcomes: OptionOutcome[]): number;
  ```
  Validators return `[]` when valid, otherwise human-readable messages (used verbatim in `error(...)`).

- [ ] **Step 1: Write the failing tests** — `lib/choice-forecast.test.ts`

```ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run lib/choice-forecast.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — `lib/choice-forecast.ts`

```ts
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
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/choice-forecast.test.ts lib/prop-kind.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/choice-forecast.ts lib/choice-forecast.test.ts
git commit -m "feat(props): add choice-forecast validation and reference scoring"
```

---

### Task 3: Migration, manifest, types, and the nullable-forecast sweep

**Files:**
- Create: `migrations/1788220800000_add-choice-props.ts`
- Modify: `lib/migrations/manifest.ts` (regenerate), `types/db_types.ts`, `tests/helpers/testFactories.ts`
- Modify (type sweep, see step 6): `app/standalone/calibration/page.tsx`, `app/competitions/[competitionId]/forecast-stats/cards/certainty-card/certainty-card.tsx`, `.../bold-takes-card/bold-takes-card.tsx`, `.../prop-consensus-card/prop-consensus-card.tsx`, `app/props/[propId]/page.tsx`, `app/props/[propId]/forecast-distribution-chart.tsx`, `app/props/[propId]/forecasts-list.tsx`, `components/landing/recently-resolved.tsx`, `app/competitions/[competitionId]/scores/user/[userId]/components/score-table-parts.tsx`, `lib/db_actions/competition-scores.ts` (type only), fixtures that build `VProp`/`VForecast` objects.
- Test: `lib/migrations/manifest.test.ts` (existing), `tests/integration/choice-props-schema.integration.test.ts` (new, container)

**Interfaces:**
- Consumes: `PropKind` from Task 1.
- Produces: the schema in spec §2; `types/db_types.ts` additions below; factories `createChoiceProp`, `createChoiceForecast`, `createChoiceResolution`.

- [ ] **Step 1: Write the migration** — `migrations/1788220800000_add-choice-props.ts`

Reference the existing view SQL at `migrations/1769364811701_private_competitions_rls_views.ts:359-423` and the policies at lines 107-348 of the same file; the text below is those definitions plus the additions.

```ts
import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Choice props: props whose forecast is a probability per option.
 * See docs/superpowers/specs/2026-09-01-choice-props-design.md §2.
 *
 * Header rows stay one-per-(user, prop) in forecasts and one-per-prop in
 * resolutions; per-option values live in forecast_options / resolution_options
 * keyed to prop_options. v_forecasts.score becomes the per-prop score for
 * every kind so AVG(score) keeps meaning "average over props".
 */
export async function up(db: Kysely<any>): Promise<void> {
  // ---- props.kind -------------------------------------------------------
  await sql`ALTER TABLE props ADD COLUMN kind text NOT NULL DEFAULT 'binary'`.execute(db);
  await sql`ALTER TABLE props ADD CONSTRAINT props_kind_check CHECK (kind IN ('binary', 'one_of', 'any_of'))`.execute(db);

  // ---- prop_options -----------------------------------------------------
  await sql`
    CREATE TABLE prop_options (
      id serial PRIMARY KEY,
      prop_id integer NOT NULL REFERENCES props(id) ON DELETE CASCADE,
      text text NOT NULL,
      position integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT prop_options_prop_position_unique UNIQUE (prop_id, position),
      CONSTRAINT prop_options_prop_text_unique UNIQUE (prop_id, text),
      CONSTRAINT prop_options_id_prop_unique UNIQUE (id, prop_id)
    )`.execute(db);
  await sql`CREATE TRIGGER set_updated_at BEFORE INSERT OR UPDATE ON prop_options FOR EACH ROW EXECUTE FUNCTION set_updated_at()`.execute(db);

  // ---- forecasts --------------------------------------------------------
  await sql`ALTER TABLE forecasts ALTER COLUMN forecast DROP NOT NULL`.execute(db);
  await sql`ALTER TABLE forecasts ADD CONSTRAINT forecasts_id_prop_unique UNIQUE (id, prop_id)`.execute(db);

  await sql`
    CREATE TABLE forecast_options (
      forecast_id integer NOT NULL,
      prop_id integer NOT NULL,
      option_id integer NOT NULL,
      probability double precision NOT NULL CHECK (probability >= 0 AND probability <= 1),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (forecast_id, option_id),
      CONSTRAINT forecast_options_forecast_fk FOREIGN KEY (forecast_id, prop_id) REFERENCES forecasts(id, prop_id) ON DELETE CASCADE,
      CONSTRAINT forecast_options_option_fk FOREIGN KEY (option_id, prop_id) REFERENCES prop_options(id, prop_id)
    )`.execute(db);
  await sql`CREATE TRIGGER set_updated_at BEFORE INSERT OR UPDATE ON forecast_options FOR EACH ROW EXECUTE FUNCTION set_updated_at()`.execute(db);

  // ---- resolutions ------------------------------------------------------
  // resolved_at is gone from production (see docs/schema.png, types/db_types.ts)
  // but the test bootstrap still creates it NOT NULL, which breaks every
  // app-path insert in the container tests. No-op where it is already gone.
  await sql`ALTER TABLE resolutions DROP COLUMN IF EXISTS resolved_at`.execute(db);
  await sql`ALTER TABLE resolutions ALTER COLUMN resolution DROP NOT NULL`.execute(db);
  await sql`ALTER TABLE resolutions ADD CONSTRAINT resolutions_prop_unique UNIQUE (prop_id)`.execute(db);
  await sql`ALTER TABLE resolutions ADD CONSTRAINT resolutions_id_prop_unique UNIQUE (id, prop_id)`.execute(db);

  await sql`
    CREATE TABLE resolution_options (
      resolution_id integer NOT NULL,
      prop_id integer NOT NULL,
      option_id integer NOT NULL,
      outcome boolean NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (resolution_id, option_id),
      CONSTRAINT resolution_options_resolution_fk FOREIGN KEY (resolution_id, prop_id) REFERENCES resolutions(id, prop_id) ON DELETE CASCADE,
      CONSTRAINT resolution_options_option_fk FOREIGN KEY (option_id, prop_id) REFERENCES prop_options(id, prop_id)
    )`.execute(db);
  await sql`CREATE TRIGGER set_updated_at BEFORE INSERT OR UPDATE ON resolution_options FOR EACH ROW EXECUTE FUNCTION set_updated_at()`.execute(db);

  // ---- kind-consistency triggers ---------------------------------------
  await sql`
    CREATE FUNCTION prop_kind_of(p_id integer) RETURNS text AS $$
      SELECT kind FROM props WHERE id = p_id
    $$ LANGUAGE sql STABLE SECURITY DEFINER`.execute(db);

  await sql`
    CREATE FUNCTION check_forecast_matches_prop_kind() RETURNS trigger AS $$
    BEGIN
      IF (prop_kind_of(NEW.prop_id) = 'binary') <> (NEW.forecast IS NOT NULL) THEN
        RAISE EXCEPTION 'forecasts.forecast must be set for binary props and null for choice props (prop %)', NEW.prop_id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER`.execute(db);
  await sql`CREATE TRIGGER enforce_forecast_kind BEFORE INSERT OR UPDATE ON forecasts FOR EACH ROW EXECUTE FUNCTION check_forecast_matches_prop_kind()`.execute(db);

  await sql`
    CREATE FUNCTION check_resolution_matches_prop_kind() RETURNS trigger AS $$
    BEGIN
      IF (prop_kind_of(NEW.prop_id) = 'binary') <> (NEW.resolution IS NOT NULL) THEN
        RAISE EXCEPTION 'resolutions.resolution must be set for binary props and null for choice props (prop %)', NEW.prop_id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER`.execute(db);
  await sql`CREATE TRIGGER enforce_resolution_kind BEFORE INSERT OR UPDATE ON resolutions FOR EACH ROW EXECUTE FUNCTION check_resolution_matches_prop_kind()`.execute(db);

  await sql`
    CREATE FUNCTION forbid_prop_kind_change() RETURNS trigger AS $$
    BEGIN
      IF NEW.kind IS DISTINCT FROM OLD.kind THEN
        RAISE EXCEPTION 'props.kind cannot be changed after creation (prop %)', OLD.id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql`.execute(db);
  await sql`CREATE TRIGGER enforce_prop_kind_immutable BEFORE UPDATE ON props FOR EACH ROW EXECUTE FUNCTION forbid_prop_kind_change()`.execute(db);

  // ---- row-level security ----------------------------------------------
  await sql`ALTER TABLE prop_options ENABLE ROW LEVEL SECURITY`.execute(db);
  await sql`
    CREATE POLICY view_prop_options ON prop_options
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM props p
        WHERE p.id = prop_options.prop_id
          AND (
            (p.user_id IS NOT NULL AND p.user_id = current_user_id())
            OR (
              p.user_id IS NULL
              AND (
                p.competition_id IS NULL
                OR NOT EXISTS (
                  SELECT 1 FROM competitions c
                  WHERE c.id = p.competition_id AND c.is_private = TRUE
                )
              )
            )
            OR (p.competition_id IS NOT NULL AND is_competition_member(p.competition_id))
            OR is_current_user_admin()
          )
      )
    )`.execute(db);
  await sql`
    CREATE POLICY manage_prop_options ON prop_options
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM props p
        WHERE p.id = prop_options.prop_id
          AND (
            (p.user_id IS NOT NULL AND p.user_id = current_user_id())
            OR (p.competition_id IS NOT NULL AND is_competition_admin(p.competition_id))
          )
      )
      OR is_current_user_admin()
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM props p
        WHERE p.id = prop_options.prop_id
          AND (
            (p.user_id IS NOT NULL AND p.user_id = current_user_id())
            OR (p.competition_id IS NOT NULL AND is_competition_admin(p.competition_id))
          )
      )
      OR is_current_user_admin()
    )`.execute(db);

  await sql`ALTER TABLE forecast_options ENABLE ROW LEVEL SECURITY`.execute(db);
  await sql`
    CREATE POLICY view_forecast_options ON forecast_options
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM forecasts f
        WHERE f.id = forecast_options.forecast_id
          AND (
            f.user_id = current_user_id()
            OR EXISTS (
              SELECT 1 FROM props p
              WHERE p.id = f.prop_id
                AND (
                  (p.user_id IS NOT NULL AND p.user_id = current_user_id())
                  OR (
                    p.user_id IS NULL
                    AND (
                      p.competition_id IS NULL
                      OR NOT EXISTS (
                        SELECT 1 FROM competitions c
                        WHERE c.id = p.competition_id AND c.is_private = TRUE
                      )
                    )
                  )
                  OR (p.competition_id IS NOT NULL AND is_competition_member(p.competition_id))
                )
            )
          )
      )
      OR is_current_user_admin()
    )`.execute(db);
  await sql`
    CREATE POLICY manage_forecast_options ON forecast_options
    FOR ALL
    USING (
      EXISTS (SELECT 1 FROM forecasts f WHERE f.id = forecast_options.forecast_id AND f.user_id = current_user_id())
      OR is_current_user_admin()
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM forecasts f WHERE f.id = forecast_options.forecast_id AND f.user_id = current_user_id())
      OR is_current_user_admin()
    )`.execute(db);

  await sql`ALTER TABLE resolution_options ENABLE ROW LEVEL SECURITY`.execute(db);
  await sql`
    CREATE POLICY view_resolution_options ON resolution_options
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM resolutions r
        WHERE r.id = resolution_options.resolution_id
          AND (
            (r.user_id IS NOT NULL AND r.user_id = current_user_id())
            OR EXISTS (
              SELECT 1 FROM props p
              WHERE p.id = r.prop_id
                AND p.user_id IS NULL
                AND (
                  p.competition_id IS NULL
                  OR NOT EXISTS (
                    SELECT 1 FROM competitions c
                    WHERE c.id = p.competition_id AND c.is_private = TRUE
                  )
                )
            )
            OR EXISTS (
              SELECT 1 FROM props p
              WHERE p.id = r.prop_id
                AND p.competition_id IS NOT NULL
                AND is_competition_member(p.competition_id)
            )
            OR is_current_user_admin()
          )
      )
    )`.execute(db);
  await sql`
    CREATE POLICY manage_resolution_options ON resolution_options
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM resolutions r
        WHERE r.id = resolution_options.resolution_id
          AND (
            (r.user_id IS NOT NULL AND r.user_id = current_user_id())
            OR EXISTS (
              SELECT 1 FROM props p
              WHERE p.id = r.prop_id
                AND p.competition_id IS NOT NULL
                AND is_competition_admin(p.competition_id)
            )
            OR is_current_user_admin()
          )
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM resolutions r
        WHERE r.id = resolution_options.resolution_id
          AND (
            (r.user_id IS NOT NULL AND r.user_id = current_user_id())
            OR EXISTS (
              SELECT 1 FROM props p
              WHERE p.id = r.prop_id
                AND p.competition_id IS NOT NULL
                AND is_competition_admin(p.competition_id)
            )
            OR is_current_user_admin()
          )
      )
    )`.execute(db);

  // ---- views ------------------------------------------------------------
  await db.schema.dropView("v_forecasts").execute();
  await db.schema.dropView("v_props").execute();

  await sql`
    CREATE VIEW v_props WITH (security_barrier, security_invoker) AS
    SELECT categories.id AS category_id, categories.name AS category_name,
      props.id AS prop_id, props.text AS prop_text, props.notes AS prop_notes,
      props.kind AS prop_kind,
      props.user_id AS prop_user_id, props.competition_id,
      props.forecasts_due_date AS prop_forecasts_due_date,
      props.resolution_due_date AS prop_resolution_due_date,
      props.created_by_user_id AS prop_created_by_user_id,
      competitions.name AS competition_name, competitions.is_private AS competition_is_private,
      COALESCE(props.forecasts_due_date, competitions.forecasts_close_date) AS competition_forecasts_close_date,
      COALESCE(props.forecasts_due_date, competitions.forecasts_open_date) AS competition_forecasts_open_date,
      resolutions.id AS resolution_id, resolutions.resolution,
      resolutions.notes AS resolution_notes, resolutions.user_id AS resolution_user_id
    FROM props
      LEFT JOIN categories ON props.category_id = categories.id
      LEFT JOIN resolutions ON props.id = resolutions.prop_id
      LEFT JOIN competitions ON props.competition_id = competitions.id`.execute(db);

  await sql`
    CREATE VIEW v_forecasts WITH (security_barrier, security_invoker) AS
    SELECT users.id AS user_id, users.name AS user_name,
      categories.id AS category_id, categories.name AS category_name,
      COALESCE(props.forecasts_due_date, competitions.forecasts_close_date) AS competition_forecasts_close_date,
      COALESCE(props.forecasts_due_date, competitions.forecasts_open_date) AS competition_forecasts_open_date,
      props.id AS prop_id, props.text AS prop_text, props.notes AS prop_notes,
      props.kind AS prop_kind,
      props.user_id AS prop_user_id, props.competition_id,
      props.forecasts_due_date AS prop_forecasts_due_date,
      props.resolution_due_date AS prop_resolution_due_date,
      props.created_by_user_id AS prop_created_by_user_id,
      competitions.name AS competition_name, competitions.is_private AS competition_is_private,
      forecasts.id AS forecast_id, forecasts.forecast,
      forecasts.created_at AS forecast_created_at, forecasts.updated_at AS forecast_updated_at,
      resolutions.id AS resolution_id, resolutions.resolution,
      resolutions.notes AS resolution_notes,
      resolutions.created_at AS resolution_created_at, resolutions.updated_at AS resolution_updated_at,
      resolutions.user_id AS resolution_user_id,
      CASE props.kind
        WHEN 'binary' THEN power(resolutions.resolution::integer::double precision - forecasts.forecast, 2::double precision)
        ELSE (
          SELECT SUM(power(ro.outcome::integer::double precision - fo.probability, 2::double precision))
                 * CASE props.kind WHEN 'one_of' THEN 0.5 ELSE 1.0 / COUNT(*) END
          FROM forecast_options fo
          JOIN resolution_options ro
            ON ro.option_id = fo.option_id AND ro.resolution_id = resolutions.id
          WHERE fo.forecast_id = forecasts.id
        )
      END AS score
    FROM users
      JOIN forecasts ON users.id = forecasts.user_id
      JOIN props ON forecasts.prop_id = props.id
      LEFT JOIN categories ON props.category_id = categories.id
      LEFT JOIN resolutions ON props.id = resolutions.prop_id
      LEFT JOIN competitions ON props.competition_id = competitions.id`.execute(db);

  await sql`
    CREATE VIEW v_prop_options WITH (security_barrier, security_invoker) AS
    SELECT po.id AS option_id, po.prop_id, po.text AS option_text, po.position,
           ro.outcome
    FROM prop_options po
    LEFT JOIN resolutions r ON r.prop_id = po.prop_id
    LEFT JOIN resolution_options ro ON ro.resolution_id = r.id AND ro.option_id = po.id`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropView("v_prop_options").execute();
  await db.schema.dropView("v_forecasts").execute();
  await db.schema.dropView("v_props").execute();

  // Recreate the pre-migration views (verbatim from 1769364811701).
  await sql`
    CREATE VIEW v_props WITH (security_barrier, security_invoker) AS
    SELECT categories.id AS category_id, categories.name AS category_name,
      props.id AS prop_id, props.text AS prop_text, props.notes AS prop_notes,
      props.user_id AS prop_user_id, props.competition_id,
      props.forecasts_due_date AS prop_forecasts_due_date,
      props.resolution_due_date AS prop_resolution_due_date,
      props.created_by_user_id AS prop_created_by_user_id,
      competitions.name AS competition_name, competitions.is_private AS competition_is_private,
      COALESCE(props.forecasts_due_date, competitions.forecasts_close_date) AS competition_forecasts_close_date,
      COALESCE(props.forecasts_due_date, competitions.forecasts_open_date) AS competition_forecasts_open_date,
      resolutions.id AS resolution_id, resolutions.resolution,
      resolutions.notes AS resolution_notes, resolutions.user_id AS resolution_user_id
    FROM props
      LEFT JOIN categories ON props.category_id = categories.id
      LEFT JOIN resolutions ON props.id = resolutions.prop_id
      LEFT JOIN competitions ON props.competition_id = competitions.id`.execute(db);

  await sql`
    CREATE VIEW v_forecasts WITH (security_barrier, security_invoker) AS
    SELECT users.id AS user_id, users.name AS user_name,
      categories.id AS category_id, categories.name AS category_name,
      COALESCE(props.forecasts_due_date, competitions.forecasts_close_date) AS competition_forecasts_close_date,
      COALESCE(props.forecasts_due_date, competitions.forecasts_open_date) AS competition_forecasts_open_date,
      props.id AS prop_id, props.text AS prop_text, props.notes AS prop_notes,
      props.user_id AS prop_user_id, props.competition_id,
      props.forecasts_due_date AS prop_forecasts_due_date,
      props.resolution_due_date AS prop_resolution_due_date,
      props.created_by_user_id AS prop_created_by_user_id,
      competitions.name AS competition_name, competitions.is_private AS competition_is_private,
      forecasts.id AS forecast_id, forecasts.forecast,
      forecasts.created_at AS forecast_created_at, forecasts.updated_at AS forecast_updated_at,
      resolutions.id AS resolution_id, resolutions.resolution,
      resolutions.notes AS resolution_notes,
      resolutions.created_at AS resolution_created_at, resolutions.updated_at AS resolution_updated_at,
      resolutions.user_id AS resolution_user_id,
      power(resolutions.resolution::integer::double precision - forecasts.forecast, 2::double precision) AS score
    FROM users
      JOIN forecasts ON users.id = forecasts.user_id
      JOIN props ON forecasts.prop_id = props.id
      LEFT JOIN categories ON props.category_id = categories.id
      LEFT JOIN resolutions ON props.id = resolutions.prop_id
      LEFT JOIN competitions ON props.competition_id = competitions.id`.execute(db);

  await sql`DROP TRIGGER enforce_prop_kind_immutable ON props`.execute(db);
  await sql`DROP FUNCTION forbid_prop_kind_change()`.execute(db);
  await sql`DROP TRIGGER enforce_resolution_kind ON resolutions`.execute(db);
  await sql`DROP FUNCTION check_resolution_matches_prop_kind()`.execute(db);
  await sql`DROP TRIGGER enforce_forecast_kind ON forecasts`.execute(db);
  await sql`DROP FUNCTION check_forecast_matches_prop_kind()`.execute(db);
  await sql`DROP FUNCTION prop_kind_of(integer)`.execute(db);

  await sql`DROP TABLE resolution_options`.execute(db);
  await sql`DROP TABLE forecast_options`.execute(db);
  await sql`DROP TABLE prop_options`.execute(db);

  await sql`ALTER TABLE resolutions DROP CONSTRAINT resolutions_id_prop_unique`.execute(db);
  await sql`ALTER TABLE resolutions DROP CONSTRAINT resolutions_prop_unique`.execute(db);
  await sql`ALTER TABLE resolutions ALTER COLUMN resolution SET NOT NULL`.execute(db);
  await sql`ALTER TABLE forecasts DROP CONSTRAINT forecasts_id_prop_unique`.execute(db);
  await sql`ALTER TABLE forecasts ALTER COLUMN forecast SET NOT NULL`.execute(db);
  await sql`ALTER TABLE props DROP CONSTRAINT props_kind_check`.execute(db);
  await sql`ALTER TABLE props DROP COLUMN kind`.execute(db);
}
```

- [ ] **Step 2: Regenerate the manifest and run its test**

Run: `npx tsx scripts/generate-migration-manifest.ts && npx vitest run lib/migrations/manifest.test.ts`
Expected: manifest gains `"1788220800000_add-choice-props"` as its last entry; PASS.

- [ ] **Step 3: Update `types/db_types.ts`**

Add at the top: `import type { PropKind } from "@/lib/prop-kind";`

Change:
- `PropsTable`: add `kind: Generated<PropKind>;`
- `ForecastsTable`: `forecast: number | null;`
- `ResolutionsTable`: `resolution: boolean | null;`
- `VPropsView`: add `prop_kind: PropKind;` after `prop_notes`.
- `VForecastsView`: add `prop_kind: PropKind;` after `prop_notes`; `forecast: number | null;`

Add:

```ts
export interface PropOptionsTable {
  id: Generated<number>;
  prop_id: number;
  text: string;
  position: number;
  updated_at: Generated<Date>;
  created_at: Generated<Date>;
}
export type PropOption = Selectable<PropOptionsTable>;
export type NewPropOption = Insertable<PropOptionsTable>;

export interface ForecastOptionsTable {
  forecast_id: number;
  prop_id: number;
  option_id: number;
  probability: number;
  updated_at: Generated<Date>;
  created_at: Generated<Date>;
}
export type NewForecastOption = Insertable<ForecastOptionsTable>;

export interface ResolutionOptionsTable {
  resolution_id: number;
  prop_id: number;
  option_id: number;
  outcome: boolean;
  updated_at: Generated<Date>;
  created_at: Generated<Date>;
}
export type NewResolutionOption = Insertable<ResolutionOptionsTable>;

export interface VPropOptionsView {
  option_id: number;
  prop_id: number;
  option_text: string;
  position: number;
  outcome: boolean | null;
}
export type VPropOption = Selectable<VPropOptionsView>;

/** One option of a choice prop as every UI surface sees it. */
export interface PropOptionSummary {
  option_id: number;
  text: string;
  position: number;
  /** Resolved outcome; null while the prop is open. */
  outcome: boolean | null;
  /** The requesting user's probability, null if they have not forecasted. */
  user_forecast: number | null;
  community_average: number | null;
}
```

Register `prop_options: PropOptionsTable; forecast_options: ForecastOptionsTable; resolution_options: ResolutionOptionsTable; v_prop_options: VPropOptionsView;` in `Database`. Leave `PropWithUserForecast` alone in this task (Task 5 adds `options`).

- [ ] **Step 4: Update the test factories** — `tests/helpers/testFactories.ts`

Remove `resolved_at: new Date()` from `createResolution`'s defaults (the column is dropped now). Add the imports `PropOption` and:

```ts
  /**
   * A choice prop with its options. Returns the prop plus its option rows
   * ordered by position.
   */
  async createChoiceProp(
    kind: "one_of" | "any_of",
    labels: string[],
    overrides: Partial<TestProp> = {},
  ): Promise<{ prop: TestProp; options: PropOption[] }> {
    const prop = await this.createProp({ ...overrides, kind } as any);
    const options: PropOption[] = [];
    for (const [position, text] of labels.entries()) {
      const option = await this.db
        .insertInto("prop_options")
        .values({ prop_id: prop.id, text, position })
        .returningAll()
        .executeTakeFirstOrThrow();
      // Not tracked: cascades from the prop delete.
      options.push(option);
    }
    return { prop, options };
  }

  /** A choice forecast: header row with a null forecast plus one child per option. */
  async createChoiceForecast(
    userId: number,
    propId: number,
    probabilities: { optionId: number; probability: number }[],
  ): Promise<TestForecast> {
    const header = await this.db
      .insertInto("forecasts")
      .values({ user_id: userId, prop_id: propId, forecast: null })
      .returningAll()
      .executeTakeFirstOrThrow();
    this.getTracker().trackId("forecasts", header.id);
    await this.db
      .insertInto("forecast_options")
      .values(
        probabilities.map((p) => ({
          forecast_id: header.id,
          prop_id: propId,
          option_id: p.optionId,
          probability: p.probability,
        })),
      )
      .execute();
    return header;
  }

  /** A choice resolution: header row with a null resolution plus one child per option. */
  async createChoiceResolution(
    propId: number,
    outcomes: { optionId: number; outcome: boolean }[],
    overrides: Partial<Omit<TestResolution, "id" | "prop_id" | "resolution">> = {},
  ): Promise<TestResolution> {
    const header = await this.db
      .insertInto("resolutions")
      .values({ prop_id: propId, resolution: null, notes: null, user_id: null, ...overrides })
      .returningAll()
      .executeTakeFirstOrThrow();
    this.getTracker().trackId("resolutions", header.id);
    await this.db
      .insertInto("resolution_options")
      .values(
        outcomes.map((o) => ({
          resolution_id: header.id,
          prop_id: propId,
          option_id: o.optionId,
          outcome: o.outcome,
        })),
      )
      .execute();
    return header;
  }
```

Cleanup note: `cleanupTestData` deletes tracked rows in reverse insertion order; forecasts and resolutions are tracked and deleted before their prop, so the child tables cascade correctly and `prop_options` cascades from the prop.

- [ ] **Step 5: Write the container schema test** — `tests/integration/choice-props-schema.integration.test.ts`

Look at `tests/integration/users.integration.test.ts` for the file's shape. Each test uses `getTestDb()` + `new TestDataFactory(db)` and `ifRunningContainerTestsIt`.

```ts
import { describe, expect, beforeEach } from "vitest";
import { sql } from "kysely";
import { getTestDb } from "../helpers/testDatabase";
import { TestDataFactory } from "../helpers/testFactories";
import { ifRunningContainerTestsIt, shouldRunContainerTests } from "../helpers/testUtils";

describe("choice props schema", () => {
  let db: any;
  let factory: TestDataFactory;

  beforeEach(async () => {
    if (shouldRunContainerTests()) {
      db = await getTestDb();
      factory = new TestDataFactory(db);
    }
  });

  ifRunningContainerTestsIt("defaults props.kind to binary", async () => {
    const prop = await factory.createProp();
    const row = await db.selectFrom("props").select("kind").where("id", "=", prop.id).executeTakeFirstOrThrow();
    expect(row.kind).toBe("binary");
  });

  ifRunningContainerTestsIt("rejects an unknown kind", async () => {
    await expect(factory.createProp({ kind: "multi" } as any)).rejects.toThrow();
  });

  ifRunningContainerTestsIt("rejects changing a prop's kind", async () => {
    const prop = await factory.createProp();
    await expect(
      db.updateTable("props").set({ kind: "one_of" }).where("id", "=", prop.id).execute(),
    ).rejects.toThrow(/cannot be changed/);
  });

  ifRunningContainerTestsIt("rejects a null forecast on a binary prop and a scalar forecast on a choice prop", async () => {
    const user = await factory.createUser();
    const binary = await factory.createProp();
    await expect(
      db.insertInto("forecasts").values({ user_id: user.id, prop_id: binary.id, forecast: null }).execute(),
    ).rejects.toThrow(/binary props/);
    const { prop } = await factory.createChoiceProp("one_of", ["A", "B"]);
    await expect(
      db.insertInto("forecasts").values({ user_id: user.id, prop_id: prop.id, forecast: 0.5 }).execute(),
    ).rejects.toThrow(/choice props/);
  });

  ifRunningContainerTestsIt("rejects a null resolution on a binary prop and a boolean resolution on a choice prop", async () => {
    const binary = await factory.createProp();
    await expect(
      db.insertInto("resolutions").values({ prop_id: binary.id, resolution: null }).execute(),
    ).rejects.toThrow(/binary props/);
    const { prop } = await factory.createChoiceProp("any_of", ["A", "B"]);
    await expect(
      db.insertInto("resolutions").values({ prop_id: prop.id, resolution: true }).execute(),
    ).rejects.toThrow(/choice props/);
  });

  ifRunningContainerTestsIt("allows only one resolution per prop", async () => {
    const prop = await factory.createProp();
    await factory.createResolution(prop.id);
    await expect(factory.createResolution(prop.id)).rejects.toThrow(/resolutions_prop_unique/);
  });

  ifRunningContainerTestsIt("rejects a forecast option that belongs to a different prop", async () => {
    const user = await factory.createUser();
    const a = await factory.createChoiceProp("one_of", ["A1", "A2"]);
    const b = await factory.createChoiceProp("one_of", ["B1", "B2"]);
    const header = await db
      .insertInto("forecasts")
      .values({ user_id: user.id, prop_id: a.prop.id, forecast: null })
      .returning("id")
      .executeTakeFirstOrThrow();
    getTestTracker().trackId("forecasts", header.id); // so afterEach cleanup removes it
    await expect(
      db.insertInto("forecast_options").values({
        forecast_id: header.id, prop_id: a.prop.id, option_id: b.options[0].id, probability: 1,
      }).execute(),
    ).rejects.toThrow();
  });

  ifRunningContainerTestsIt("has RLS enabled and the named policies on the new tables", async () => {
    const rls = await sql<{ relname: string; relrowsecurity: boolean }>`
      SELECT relname, relrowsecurity FROM pg_class
      WHERE relname IN ('prop_options', 'forecast_options', 'resolution_options')`.execute(db);
    expect(rls.rows).toHaveLength(3);
    expect(rls.rows.every((r) => r.relrowsecurity)).toBe(true);
    const policies = await sql<{ policyname: string }>`
      SELECT policyname FROM pg_policies
      WHERE tablename IN ('prop_options', 'forecast_options', 'resolution_options')`.execute(db);
    expect(policies.rows.map((p) => p.policyname).sort()).toEqual([
      "manage_forecast_options", "manage_prop_options", "manage_resolution_options",
      "view_forecast_options", "view_prop_options", "view_resolution_options",
    ]);
  });

  ifRunningContainerTestsIt("exposes options with outcomes through v_prop_options", async () => {
    const { prop, options } = await factory.createChoiceProp("one_of", ["A", "B", "C"]);
    await factory.createChoiceResolution(prop.id, options.map((o, i) => ({ optionId: o.id, outcome: i === 1 })));
    const rows = await db.selectFrom("v_prop_options").selectAll().where("prop_id", "=", prop.id).orderBy("position").execute();
    expect(rows.map((r: any) => [r.option_text, r.outcome])).toEqual([["A", false], ["B", true], ["C", false]]);
  });
});
```

- [ ] **Step 6: The nullable-forecast type sweep**

Run `npx tsc --noEmit`. Fix every error using exactly these policies (add a one-line comment `// Choice props are binary-only here for now; see docs/superpowers/specs/2026-09-01-choice-props-design.md §4.4` at each analytics filter):

1. **Analytics = binary only.** Create `lib/binary-forecast.ts` containing only:
   ```ts
   import type { VForecast } from "@/types/db_types";
   /** A v_forecasts row for a binary prop, with the scalar forecast narrowed to non-null. */
   export type BinaryForecast = VForecast & { forecast: number };
   export const isBinaryForecast = (f: VForecast): f is BinaryForecast =>
     f.prop_kind === "binary" && f.forecast !== null;
   ```
   (a type-only import, so it stays safe for unit tests and client components). In `app/standalone/calibration/page.tsx` filter with `isBinaryForecast` before mapping. In `certainty-card.tsx`, `bold-takes-card.tsx`, and `prop-consensus-card.tsx` filter the fetched forecasts with `isBinaryForecast` before passing them on, and change the leaf/stat helpers' parameter types from `VForecast[]` to `BinaryForecast[]` so they keep receiving a non-null `forecast`.
2. **Single prop page** `app/props/[propId]/page.tsx`: compute `const binaryForecasts = forecasts.filter(isBinaryForecast)` and use it for the stats, the chart and the list; keep `forecasts.length` for the forecaster count. Change `forecast-distribution-chart.tsx` and `forecasts-list.tsx` prop types to `BinaryForecast[]` (import from `lib/binary-forecast.ts`).
3. **Recently resolved** `components/landing/recently-resolved.tsx`: filter with `isBinaryForecast` and add `// TODO(choice-props stage two): render choice props here`.
4. **Score breakdown**: `UserForecastScore.forecast` becomes `number | null` in `lib/db_actions/competition-scores.ts`; in `score-table-parts.tsx` render `forecast.forecast === null ? "—" : \`${(forecast.forecast * 100).toFixed(1)}%\``. Update `forecast-scores-table.fixtures.ts` if its type no longer matches.
5. **Fixtures / mocks**: any object literal typed as `VProp` or `VForecast` needs `prop_kind: "binary"` (e.g. `components/forecast-card/forecast-card.fixtures.ts`, `app/props/[propId]/prop-views.fixtures.ts`, test mocks in `lib/db_actions/*.test.ts` that are not `as any`).
6. `resolveProp` still inserts a boolean `resolution` — that still type-checks; leave it.

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run test`
Expected: all clean; the new integration file shows as skipped locally.

- [ ] **Step 8: Commit**

```bash
git add migrations/1788220800000_add-choice-props.ts lib/migrations/manifest.ts types/db_types.ts tests/helpers/testFactories.ts tests/integration/choice-props-schema.integration.test.ts lib/binary-forecast.ts <every file touched in step 6>
git commit -m "feat(db): add choice props schema, kind triggers, options views"
```

---

### Task 4: Container tests pinning `v_forecasts.score` to the reference implementation

**Files:**
- Test: `tests/integration/choice-props-scoring.integration.test.ts` (new)

**Interfaces:**
- Consumes: factories from Task 3; `scoreBinaryForecast` / `scoreChoiceForecast` from Task 2.

- [ ] **Step 1: Write the tests**

```ts
import { describe, expect, beforeEach } from "vitest";
import { sql } from "kysely";
import { getTestDb } from "../helpers/testDatabase";
import { TestDataFactory } from "../helpers/testFactories";
import { ifRunningContainerTestsIt, shouldRunContainerTests } from "../helpers/testUtils";
import { scoreBinaryForecast, scoreChoiceForecast } from "@/lib/choice-forecast";

async function scoreFor(db: any, userId: number, propId: number): Promise<number | null> {
  const row = await db
    .selectFrom("v_forecasts")
    .select("score")
    .where("user_id", "=", userId)
    .where("prop_id", "=", propId)
    .executeTakeFirstOrThrow();
  return row.score === null ? null : Number(row.score);
}

describe("v_forecasts.score for every prop kind", () => {
  let db: any;
  let factory: TestDataFactory;

  beforeEach(async () => {
    if (shouldRunContainerTests()) {
      db = await getTestDb();
      factory = new TestDataFactory(db);
    }
  });

  ifRunningContainerTestsIt("binary is unchanged: (outcome − p)²", async () => {
    const user = await factory.createUser();
    const prop = await factory.createProp();
    await factory.createForecast(user.id, prop.id, { forecast: 0.7 });
    expect(await scoreFor(db, user.id, prop.id)).toBeNull();
    await factory.createResolution(prop.id, { resolution: true });
    expect(await scoreFor(db, user.id, prop.id)).toBeCloseTo(scoreBinaryForecast(0.7, true));
  });

  ifRunningContainerTestsIt("one_of matches scoreChoiceForecast and halves the multi-category Brier", async () => {
    const user = await factory.createUser();
    const { prop, options } = await factory.createChoiceProp("one_of", ["Knicks", "Spurs", "Thunder", "Other"]);
    const probs = [0.23, 0.18, 0.15, 0.44].map((probability, i) => ({ optionId: options[i].id, probability }));
    await factory.createChoiceForecast(user.id, prop.id, probs);
    expect(await scoreFor(db, user.id, prop.id)).toBeNull();
    const outcomes = options.map((o) => ({ optionId: o.id, outcome: o.text === "Spurs" }));
    await factory.createChoiceResolution(prop.id, outcomes);
    const expected = scoreChoiceForecast("one_of", probs, outcomes);
    expect(await scoreFor(db, user.id, prop.id)).toBeCloseTo(expected, 10);
    // Sanity: ½·[(0.23)² + (1−0.18)² + (0.15)² + (0.44)²]
    expect(expected).toBeCloseTo(0.5 * (0.0529 + 0.6724 + 0.0225 + 0.1936), 10);
  });

  ifRunningContainerTestsIt("any_of matches scoreChoiceForecast and averages per-option Briers", async () => {
    const user = await factory.createUser();
    const { prop, options } = await factory.createChoiceProp("any_of", ["A", "B", "C"]);
    const probs = [0.9, 0.2, 0.5].map((probability, i) => ({ optionId: options[i].id, probability }));
    await factory.createChoiceForecast(user.id, prop.id, probs);
    const outcomes = [true, true, false].map((outcome, i) => ({ optionId: options[i].id, outcome }));
    await factory.createChoiceResolution(prop.id, outcomes);
    expect(await scoreFor(db, user.id, prop.id)).toBeCloseTo(scoreChoiceForecast("any_of", probs, outcomes), 10);
  });

  ifRunningContainerTestsIt("a competition average counts a choice prop once", async () => {
    const user = await factory.createUser();
    const competition = await factory.createCompetition();
    const binary = await factory.createCompetitionProp(competition.id);
    await factory.createForecast(user.id, binary.id, { forecast: 0.6 });
    await factory.createResolution(binary.id, { resolution: false });
    const { prop, options } = await factory.createChoiceProp("one_of", ["A", "B", "C", "D"], {
      competition_id: competition.id,
    });
    const probs = options.map((o) => ({ optionId: o.id, probability: 0.25 }));
    await factory.createChoiceForecast(user.id, prop.id, probs);
    await factory.createChoiceResolution(prop.id, options.map((o, i) => ({ optionId: o.id, outcome: i === 0 })));
    const row = await sql<{ avg: string }>`
      SELECT AVG(score) AS avg FROM v_forecasts WHERE competition_id = ${competition.id} AND user_id = ${user.id}`.execute(db);
    expect(Number(row.rows[0].avg)).toBeCloseTo((0.36 + 0.375) / 2, 10);
  });
});
```

Check `factory.createCompetitionProp`'s signature at `tests/helpers/testFactories.ts:184` and match it.

- [ ] **Step 2: Run locally (skips) and type-check**

Run: `npx tsc --noEmit && npx vitest run tests/integration/choice-props-scoring.integration.test.ts`
Expected: type-clean; tests skipped.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/choice-props-scoring.integration.test.ts
git commit -m "test(db): pin v_forecasts.score to the reference scoring for all kinds"
```

---

### Task 5: `attachOptions` and the read actions

**Files:**
- Create: `lib/db_actions/prop-options.ts`
- Modify: `lib/db_actions/forecasts.ts:326-410` (`getPropsWithUserForecasts`), `lib/db_actions/props.ts:16-56` (`getPropById`), `types/db_types.ts` (`PropWithUserForecast`), `lib/db_actions/index.ts`
- Test: `lib/db_actions/prop-options.test.ts` (container), `lib/db_actions/forecasts.test.ts` (container, extend)

**Interfaces:**
- Produces:
  ```ts
  // lib/db_actions/prop-options.ts
  export async function attachOptions<T extends { prop_id: number; prop_kind: PropKind }>(
    trx: Transaction<Database>, props: T[], userId: number | null,
  ): Promise<Map<number, PropOptionSummary[]>>;
  ```
  `PropWithUserForecast` gains `options: PropOptionSummary[]`. `getPropById` returns `ServerActionResult<(VProp & { options: PropOptionSummary[] }) | null>`.

- [ ] **Step 1: Write the failing container test** — `lib/db_actions/prop-options.test.ts`

```ts
import { describe, expect, beforeEach, vi } from "vitest";
import { getTestDb } from "../../tests/helpers/testDatabase";
import { TestDataFactory } from "../../tests/helpers/testFactories";
import { ifRunningContainerTestsIt, shouldRunContainerTests } from "../../tests/helpers/testUtils";

vi.mock("server-only", () => ({}));

describe("attachOptions", () => {
  let db: any;
  let factory: TestDataFactory;
  let attachOptions: typeof import("./prop-options").attachOptions;

  beforeEach(async () => {
    if (shouldRunContainerTests()) {
      db = await getTestDb();
      factory = new TestDataFactory(db);
      attachOptions = (await import("./prop-options")).attachOptions;
    }
  });

  ifRunningContainerTestsIt("returns nothing for binary props", async () => {
    const prop = await factory.createProp();
    const map = await db.transaction().execute((trx: any) =>
      attachOptions(trx, [{ prop_id: prop.id, prop_kind: "binary" }], null),
    );
    expect(map.size).toBe(0);
  });

  ifRunningContainerTestsIt("returns options in position order with user values, averages and outcomes", async () => {
    const me = await factory.createUser();
    const other = await factory.createUser();
    const { prop, options } = await factory.createChoiceProp("one_of", ["A", "B", "C"]);
    await factory.createChoiceForecast(me.id, prop.id, [
      { optionId: options[0].id, probability: 0.5 },
      { optionId: options[1].id, probability: 0.3 },
      { optionId: options[2].id, probability: 0.2 },
    ]);
    await factory.createChoiceForecast(other.id, prop.id, [
      { optionId: options[0].id, probability: 0.1 },
      { optionId: options[1].id, probability: 0.1 },
      { optionId: options[2].id, probability: 0.8 },
    ]);
    await factory.createChoiceResolution(prop.id, options.map((o, i) => ({ optionId: o.id, outcome: i === 2 })));

    const map = await db.transaction().execute((trx: any) =>
      attachOptions(trx, [{ prop_id: prop.id, prop_kind: "one_of" }], me.id),
    );
    const summary = map.get(prop.id)!;
    expect(summary.map((o: any) => o.text)).toEqual(["A", "B", "C"]);
    expect(summary.map((o: any) => o.user_forecast)).toEqual([0.5, 0.3, 0.2]);
    expect(summary.map((o: any) => Number(o.community_average))).toEqual([0.3, 0.2, 0.5]);
    expect(summary.map((o: any) => o.outcome)).toEqual([false, false, true]);
  });

  ifRunningContainerTestsIt("leaves user_forecast null for a user without a forecast", async () => {
    const me = await factory.createUser();
    const { prop, options } = await factory.createChoiceProp("any_of", ["A", "B"]);
    const map = await db.transaction().execute((trx: any) =>
      attachOptions(trx, [{ prop_id: prop.id, prop_kind: "any_of" }], me.id),
    );
    const summary = map.get(prop.id)!;
    expect(summary).toHaveLength(options.length);
    expect(summary.every((o: any) => o.user_forecast === null && o.community_average === null && o.outcome === null)).toBe(true);
  });
});
```

- [ ] **Step 2: Implement `attachOptions`** — `lib/db_actions/prop-options.ts`

```ts
"use server";

import { sql, type Transaction } from "kysely";
import type { Database, PropOptionSummary } from "@/types/db_types";
import { isChoiceKind, type PropKind } from "@/lib/prop-kind";

/**
 * Loads the option summaries for every choice prop in `props`, keyed by prop
 * id and ordered by position. Binary props get no entry (callers default to
 * `[]`). Runs inside the caller's RLS transaction.
 */
export async function attachOptions<T extends { prop_id: number; prop_kind: PropKind }>(
  trx: Transaction<Database>,
  props: T[],
  userId: number | null,
): Promise<Map<number, PropOptionSummary[]>> {
  const propIds = [...new Set(props.filter((p) => isChoiceKind(p.prop_kind)).map((p) => p.prop_id))];
  const result = new Map<number, PropOptionSummary[]>();
  if (propIds.length === 0) return result;

  const [options, averages, mine] = await Promise.all([
    trx
      .selectFrom("v_prop_options")
      .selectAll()
      .where("prop_id", "in", propIds)
      .orderBy("prop_id")
      .orderBy("position")
      .execute(),
    trx
      .selectFrom("forecast_options")
      .select(["option_id", sql<number>`AVG(probability)`.as("community_average")])
      .where("prop_id", "in", propIds)
      .groupBy("option_id")
      .execute(),
    userId === null
      ? Promise.resolve([])
      : trx
          .selectFrom("forecast_options")
          .innerJoin("forecasts", "forecasts.id", "forecast_options.forecast_id")
          .select(["forecast_options.option_id", "forecast_options.probability"])
          .where("forecast_options.prop_id", "in", propIds)
          .where("forecasts.user_id", "=", userId)
          .execute(),
  ]);

  const averageByOption = new Map(averages.map((a) => [a.option_id, Number(a.community_average)]));
  const mineByOption = new Map(mine.map((m) => [m.option_id, Number(m.probability)]));

  for (const o of options) {
    const list = result.get(o.prop_id) ?? [];
    list.push({
      option_id: o.option_id,
      text: o.option_text,
      position: o.position,
      outcome: o.outcome,
      user_forecast: mineByOption.get(o.option_id) ?? null,
      community_average: averageByOption.get(o.option_id) ?? null,
    });
    result.set(o.prop_id, list);
  }
  return result;
}
```

(`"use server"` at the top of a file makes every export a server action; check how `lib/db_actions/props.ts` starts and mirror it exactly — if it uses `import "server-only"` instead, do that.)

- [ ] **Step 3: Thread options through the read actions**

- `types/db_types.ts`: `PropWithUserForecast` gains `options: PropOptionSummary[];`.
- `lib/db_actions/forecasts.ts` `getPropsWithUserForecasts`: after `const rows = await query.execute();` inside the `withRLS` callback, `const optionsByProp = await attachOptions(trx, rows, userId); return rows.map((row) => ({ ...row, options: optionsByProp.get(row.prop_id) ?? [] }));`. Update the declared return type to `PropWithUserForecast[]` (import the type).
- `lib/db_actions/props.ts` `getPropById`: inside its `withRLS`, after fetching the `v_props` row, if found: `const options = (await attachOptions(trx, [prop], currentUser?.id ?? null)).get(prop.prop_id) ?? []; return { ...prop, options };`. Return type `ServerActionResult<(VProp & { options: PropOptionSummary[] }) | null>`.
- Every fixture typed as `PropWithUserForecast` gets `options: []` (e.g. `components/forecast-card/forecast-card.fixtures.ts`).
- `lib/db_actions/index.ts`: `export * from "./prop-options";`
- Extend `lib/db_actions/forecasts.test.ts` (container) with one test: a competition with one binary and one `one_of` prop; `getPropsWithUserForecasts` returns `options: []` for the binary prop and three summaries for the choice prop with the user's values. Mock `getUserFromCookies` like the file already does.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run test`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add lib/db_actions/prop-options.ts lib/db_actions/prop-options.test.ts lib/db_actions/forecasts.ts lib/db_actions/forecasts.test.ts lib/db_actions/props.ts lib/db_actions/index.ts types/db_types.ts <fixtures>
git commit -m "feat(props): attach option summaries to prop read actions"
```

---

### Task 6: Prop write actions — options on create, kind immutability, label edits

**Files:**
- Modify: `lib/db_actions/props.ts` (`createProp` at ~371, `updateProp` at ~308), `lib/db_actions/prop-options.ts` (add `updatePropOptions`)
- Test: `lib/db_actions/props.test.ts` (unit, extend), `lib/db_actions/prop-options.test.ts` (extend)

**Interfaces:**
- Produces:
  ```ts
  createProp({ prop, options }: { prop: NewProp; options?: string[] }): Promise<ServerActionResult<void>>
  updatePropOptions({ propId, options }: { propId: number; options: { id: number; text: string }[] }): Promise<ServerActionResult<void>>
  ```

- [ ] **Step 1: Unit tests (mocked) in `lib/db_actions/props.test.ts`**

Follow the file's existing mocking of `withRLSAction` (it passes a fake `trx`). Add a `describe("createProp with options")`:

- `one_of` with `options: ["Knicks", "Spurs"]` → success; the fake `trx.insertInto` is called for `"props"` (with `kind: "one_of"`) and then for `"prop_options"` with `[{ prop_id, text: "Knicks", position: 0 }, { prop_id, text: "Spurs", position: 1 }]`. (Have the fake `insertInto("props")...returning("id").executeTakeFirstOrThrow()` resolve `{ id: 42 }`.)
- `one_of` with one option → `validationError` with `options` key.
- `one_of` with no options → validation error.
- binary with `options: ["A", "B"]` → validation error ("Yes/no propositions do not have options").
- labels are trimmed before insert.

Add a `describe("updateProp kind guard")`: `updateProp({ id, prop: { kind: "one_of" } })` → `error(..., VALIDATION_ERROR)` and `withRLSAction` never called.

- [ ] **Step 2: Implement in `createProp`**

Signature `({ prop, options }: { prop: NewProp; options?: string[] })`. In the validation block:

```ts
const kind: PropKind = prop.kind ?? "binary";
const trimmedOptions = (options ?? []).map((o) => o.trim());
if (isChoiceKind(kind)) {
  const optionErrors = validateOptionLabels(trimmedOptions);
  if (optionErrors.length > 0) validationErrors.options = optionErrors;
} else if (trimmedOptions.length > 0) {
  validationErrors.options = ["Yes/no propositions do not have options"];
}
```

Replace the insert with:

```ts
const { id: propId } = await trx.insertInto("props").values(prop).returning("id").executeTakeFirstOrThrow();
if (isChoiceKind(kind)) {
  await trx
    .insertInto("prop_options")
    .values(trimmedOptions.map((text, position) => ({ prop_id: propId, text, position })))
    .execute();
}
```

- [ ] **Step 3: Implement the `updateProp` guard**

Before anything else in `updateProp`:

```ts
if ("kind" in prop) {
  return error("The kind of a proposition cannot be changed", ERROR_CODES.VALIDATION_ERROR);
}
```

- [ ] **Step 4: Implement `updatePropOptions`** in `lib/db_actions/prop-options.ts`

```ts
export async function updatePropOptions({
  propId,
  options,
}: {
  propId: number;
  options: { id: number; text: string }[];
}): Promise<ServerActionResult<void>> {
  const currentUser = await getUserFromCookies();
  if (!currentUser) return error("You must be logged in to edit propositions", ERROR_CODES.UNAUTHORIZED);
  const labelErrors = validateOptionLabels(options.map((o) => o.text));
  if (labelErrors.length > 0) return validationError("Please fix the validation errors", { options: labelErrors }, ERROR_CODES.VALIDATION_ERROR);
  try {
    const result = await withRLSAction(currentUser.id, async (trx) => {
      const existing = await trx.selectFrom("prop_options").select("id").where("prop_id", "=", propId).execute();
      const existingIds = existing.map((e) => e.id).sort();
      const givenIds = options.map((o) => o.id).sort();
      if (existingIds.length === 0) return error("Proposition not found or has no options", ERROR_CODES.NOT_FOUND);
      if (JSON.stringify(existingIds) !== JSON.stringify(givenIds)) {
        return error("Options cannot be added or removed; only their labels can change", ERROR_CODES.VALIDATION_ERROR);
      }
      for (const o of options) {
        await trx.updateTable("prop_options").set({ text: o.text.trim() }).where("id", "=", o.id).where("prop_id", "=", propId).execute();
      }
      return success(undefined);
    });
    if (result.success) { revalidatePath("/props"); revalidatePath("/competitions"); }
    return result;
  } catch (err) {
    logger.error("Failed to update prop options", err as Error, { operation: "updatePropOptions", propId });
    return error("Failed to update options", ERROR_CODES.DATABASE_ERROR);
  }
}
```

Add the `logger.debug/info` calls in the style of the neighbouring actions. Container tests in `prop-options.test.ts`: happy path renames labels; mismatched id set → VALIDATION_ERROR; duplicate labels → validation error; non-owner (a user who is neither admin nor competition admin) gets NOT_FOUND because RLS hides the options — mock `getUserFromCookies` as the other tests do.

- [ ] **Step 5: Verify and commit**

Run: `npx tsc --noEmit && npm run lint && npm run test`

```bash
git add lib/db_actions/props.ts lib/db_actions/props.test.ts lib/db_actions/prop-options.ts lib/db_actions/prop-options.test.ts
git commit -m "feat(props): create choice props with options, guard kind, edit option labels"
```

---

### Task 7: `saveChoiceForecast` and the binary guards

**Files:**
- Modify: `lib/db_actions/forecasts.ts` (`createForecast` ~108, `updateForecast` ~178; add `saveChoiceForecast`)
- Test: `lib/db_actions/forecasts.unit.test.ts` (extend), `lib/db_actions/forecasts.test.ts` (container, extend)

**Interfaces:**
- Produces: `saveChoiceForecast({ propId, probabilities }: { propId: number; probabilities: OptionProbability[] }): Promise<ServerActionResult<number>>` — resolves to the forecast header id.

- [ ] **Step 1: Unit tests** in `forecasts.unit.test.ts` (mocked `withRLSAction` as the file already does)

- not logged in → UNAUTHORIZED.
- prop is binary → VALIDATION_ERROR mentioning "yes/no".
- close date in the past → VALIDATION_ERROR "past the due date".
- probabilities fail `validateChoiceForecast` (e.g. sum ≠ 1 for one_of) → VALIDATION_ERROR whose message contains the validator's text.
- happy path: the fake trx sees an upsert into `forecasts` with `forecast: null`, a `deleteFrom("forecast_options")`, an `insertInto("forecast_options")` with one row per option, and the action resolves `success(<id>)`.
- `createForecast` on a choice prop → VALIDATION_ERROR; `updateForecast` on a choice-prop forecast → VALIDATION_ERROR.

- [ ] **Step 2: Implement `saveChoiceForecast`**

```ts
export async function saveChoiceForecast({
  propId,
  probabilities,
}: {
  propId: number;
  probabilities: OptionProbability[];
}): Promise<ServerActionResult<number>> {
  const currentUser = await getUserFromCookies();
  if (!currentUser) return error("You must be logged in to forecast", ERROR_CODES.UNAUTHORIZED);
  logger.debug("Saving choice forecast", { propId, currentUserId: currentUser.id });
  const startTime = Date.now();
  try {
    const result = await withRLSAction(currentUser.id, async (trx) => {
      const prop = await trx
        .selectFrom("v_props")
        .select(["prop_kind", "competition_forecasts_close_date"])
        .where("prop_id", "=", propId)
        .executeTakeFirst();
      if (!prop) return error("Proposition not found", ERROR_CODES.NOT_FOUND);
      if (!isChoiceKind(prop.prop_kind)) {
        return error("This is a yes/no proposition; submit a single probability instead", ERROR_CODES.VALIDATION_ERROR);
      }
      const closeDate = prop.competition_forecasts_close_date;
      if (closeDate && closeDate <= new Date()) {
        return error("Cannot save forecasts past the due date", ERROR_CODES.VALIDATION_ERROR);
      }
      const options = await trx.selectFrom("prop_options").select("id").where("prop_id", "=", propId).execute();
      const errors = validateChoiceForecast(prop.prop_kind, options.map((o) => o.id), probabilities);
      if (errors.length > 0) return error(errors.join("; "), ERROR_CODES.VALIDATION_ERROR);

      const { id } = await trx
        .insertInto("forecasts")
        .values({ prop_id: propId, user_id: currentUser.id, forecast: null })
        .onConflict((oc) => oc.columns(["prop_id", "user_id"]).doUpdateSet({ forecast: null }))
        .returning("id")
        .executeTakeFirstOrThrow();
      await trx.deleteFrom("forecast_options").where("forecast_id", "=", id).execute();
      await trx
        .insertInto("forecast_options")
        .values(probabilities.map((p) => ({ forecast_id: id, prop_id: propId, option_id: p.optionId, probability: p.probability })))
        .execute();
      return success(id);
    });
    if (result.success) {
      logger.info("Choice forecast saved", { operation: "saveChoiceForecast", propId, forecastId: result.data, duration: Date.now() - startTime });
      revalidatePath("/competitions");
      revalidatePath("/standalone/forecasts");
    }
    return result;
  } catch (err) {
    logger.error("Failed to save choice forecast", err as Error, { operation: "saveChoiceForecast", propId });
    return error("Failed to save forecast", ERROR_CODES.DATABASE_ERROR);
  }
}
```

The `doUpdateSet({ forecast: null })` is a no-op write that makes the `set_updated_at` trigger bump the header's timestamp.

- [ ] **Step 3: Binary guards**

`createForecast`: add `"prop_kind"` to the `v_props` select; after the close-date check: `if (prop?.prop_kind !== "binary") return error("Use the per-option form for this proposition", ERROR_CODES.VALIDATION_ERROR);`. `updateForecast`: add `"prop_kind"` to the `v_forecasts` select and the same guard.

- [ ] **Step 4: Container tests** in `forecasts.test.ts`

- happy path saves, then re-saving with different probabilities replaces the child rows (count stays = option count, values updated, header id unchanged).
- the trigger path: `createForecast` for a choice prop is rejected before hitting the database (VALIDATION_ERROR).

- [ ] **Step 5: Verify and commit**

Run: `npx tsc --noEmit && npm run lint && npm run test`

```bash
git add lib/db_actions/forecasts.ts lib/db_actions/forecasts.unit.test.ts lib/db_actions/forecasts.test.ts
git commit -m "feat(forecasts): save per-option forecasts for choice props"
```

---

### Task 8: `resolveProp` with per-option outcomes

**Files:**
- Modify: `lib/db_actions/props.ts:175-263`
- Test: `lib/db_actions/props.test.ts` (extend)

**Interfaces:**
- Produces:
  ```ts
  resolveProp({ propId, resolution, outcomes, notes, userId, overwrite = false }: {
    propId: number; resolution?: boolean; outcomes?: OptionOutcome[]; notes?: string; userId: number | null; overwrite?: boolean;
  }): Promise<ServerActionResult<void>>
  ```
  Existing callers pass `resolution: boolean` and keep working.

- [ ] **Step 1: Unit tests** (mocked) — add to the existing `describe("resolveProp")`

- binary prop with `outcomes` → VALIDATION_ERROR; binary prop with neither → VALIDATION_ERROR.
- `one_of` prop with `resolution: true` → VALIDATION_ERROR.
- `one_of` with two `true` outcomes → VALIDATION_ERROR containing "exactly one".
- `any_of` with all `false` → success; the fake trx sees an insert into `resolutions` with `resolution: null` and an insert into `resolution_options` with one row per option.
- existing resolution + `overwrite: true` on a choice prop → header updated (notes), `deleteFrom("resolution_options")` then reinsert.

- [ ] **Step 2: Implement**

Inside `withRLSAction`, first read the prop's kind and options:

```ts
const prop = await trx.selectFrom("v_props").select("prop_kind").where("prop_id", "=", propId).executeTakeFirst();
if (!prop) return error("Proposition not found", ERROR_CODES.NOT_FOUND);
const choice = isChoiceKind(prop.prop_kind);
if (!choice && (resolution === undefined || outcomes !== undefined)) {
  return error("Yes/no propositions resolve with a single true/false", ERROR_CODES.VALIDATION_ERROR);
}
if (choice && (outcomes === undefined || resolution !== undefined)) {
  return error("Choice propositions resolve with an outcome per option", ERROR_CODES.VALIDATION_ERROR);
}
if (choice) {
  const options = await trx.selectFrom("prop_options").select("id").where("prop_id", "=", propId).execute();
  const errors = validateChoiceOutcomes(prop.prop_kind, options.map((o) => o.id), outcomes!);
  if (errors.length > 0) return error(errors.join("; "), ERROR_CODES.VALIDATION_ERROR);
}
```

Keep the existing "already resolved and not overwrite" check. Then:

```ts
const headerValue = choice ? null : resolution!;
let resolutionId: number;
if (existingResolution) {
  const updated = await trx.updateTable("resolutions").set({ resolution: headerValue, notes }).where("prop_id", "=", propId).returning("id").executeTakeFirstOrThrow();
  resolutionId = updated.id;
} else {
  const inserted = await trx.insertInto("resolutions").values({ prop_id: propId, resolution: headerValue, user_id: userId, notes }).returning("id").executeTakeFirstOrThrow();
  resolutionId = inserted.id;
}
if (choice) {
  await trx.deleteFrom("resolution_options").where("resolution_id", "=", resolutionId).execute();
  await trx.insertInto("resolution_options").values(outcomes!.map((o) => ({ resolution_id: resolutionId, prop_id: propId, option_id: o.optionId, outcome: o.outcome }))).execute();
}
```

(`existingResolution` select must include `id`.) Keep logging; the `resolution` log field may now be undefined — log `kind` too.

- [ ] **Step 3: Verify and commit**

Run: `npx tsc --noEmit && npm run lint && npm run test`

```bash
git add lib/db_actions/props.ts lib/db_actions/props.test.ts
git commit -m "feat(props): resolve choice props with per-option outcomes"
```

---

### Task 9: Score, stats, recently-resolved actions and the `resolution_id` sweep

**Files:**
- Modify: `lib/db_actions/competition-scores.ts` (`getCompetitionScores` ~78-99, `getUserScoreBreakdown` ~223-270), `lib/db_actions/competition-stats.ts` (`UpcomingDeadline` ~125, `getUpcomingDeadlines` ~137), `lib/db_actions/forecasts.ts` (`getRecentlyResolvedForecasts` ~412), `components/competition-dashboard/competition-dashboard.tsx:96-107`, `components/landing/recently-resolved.tsx`
- Test: `lib/db_actions/competition-scores.test.ts` (container, extend), `lib/db_actions/forecasts.test.ts` (container, extend)

**Interfaces:**
- Produces:
  ```ts
  // competition-scores.ts
  export interface UserForecastScore { ...existing; kind: PropKind; options: { text: string; userForecast: number; outcome: boolean }[] }
  // competition-stats.ts
  export interface UpcomingDeadline { ...existing; kind: PropKind; hasUserForecast: boolean }
  // forecasts.ts
  getRecentlyResolvedForecasts(...): Promise<ServerActionResult<(VForecast & { options: PropOptionSummary[] })[]>>
  ```

- [ ] **Step 1: Container test in `competition-scores.test.ts`**

A competition with one binary prop (forecast 0.6, resolved false → 0.36) and one `one_of` prop with four options (uniform, resolved to the first → 0.375) for one user: `getCompetitionScores` returns `overallScores[0].score ≈ 0.3575`, `incompleteUserIds` empty; `getUserScoreBreakdown` returns two `forecastScores`, the choice one with `kind: "one_of"`, `forecast: null`, `resolution: null`, `score ≈ 0.375`, and `options` of length 4 with exactly one `outcome: true` and `userForecast: 0.25` each.

- [ ] **Step 2: Implement**

- Both score queries: `.where("resolution", "is not", null)` → `.where("score", "is not", null)` (all four occurrences; the per-forecast rows query too).
- Breakdown per-forecast query: add `"prop_kind"` to the select. After the query, still inside the transaction: `const optionsByProp = await attachOptions(trx, forecastResults, userId);` then map each row to `UserForecastScore` with `kind: row.prop_kind` and `options: (optionsByProp.get(row.prop_id) ?? []).map((o) => ({ text: o.text, userForecast: o.user_forecast ?? 0, outcome: o.outcome ?? false }))`. Note the existing mapping code lives after the transaction; move the `attachOptions` call inside and carry the map out.
- `getUpcomingDeadlines`: select `"v_props.prop_kind"`; return `kind: row.prop_kind, hasUserForecast: row.user_forecast_id !== null`. Update `components/competition-dashboard/upcoming-deadlines.stories.tsx` fixtures with the two new fields (`kind: "binary"`, `hasUserForecast: prop.userForecast !== null`).
- `getRecentlyResolvedForecasts`: `.where("resolution_id", "is not", null)`; inside the transaction attach options for the current user (`userId`) and return rows with `options`. Remove the binary filter added in Task 3 from `components/landing/recently-resolved.tsx`? **No** — keep it (the card is redone in stage two); just make sure it still compiles with the new return type.
- `competition-dashboard.tsx`: `prop.resolution !== null` → `prop.resolution_id !== null` in both `unresolvedProps` and `resolvedProps`.
- Search for any other `resolution !== null` / `resolution === null` / `"resolution", "is not", null` / `"resolution", "is", null` across `app/`, `components/`, `lib/` and convert each to the `resolution_id` form **unless** the code genuinely needs the boolean (e.g. rendering Yes/No, `prop-status.ts`). List the files you changed in the commit body.

- [ ] **Step 3: Verify and commit**

Run: `npx tsc --noEmit && npm run lint && npm run test && npm run build-storybook`

```bash
git add -A lib/db_actions components/competition-dashboard components/landing
git commit -m "feat(scores): score choice props once per prop; resolved checks use resolution_id"
```

---

### Task 10: Final verification and PR

- [ ] **Step 1: Full local verification**

Run: `npx tsc --noEmit && npm run lint && npm run test && npm run build-storybook`
Expected: all green; container tests skipped locally.

- [ ] **Step 2: Review the diff against the spec**

`git diff main...HEAD --stat` and read through: no UI behaviour change for binary props; no new UI; every new action logs and returns `ServerActionResult`.

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin choice-props
gh pr create --base main --title "Choice props: schema, scoring and server actions (stage one)" --body-file - <<'EOF'
## Summary

Stage one of choice props (`one_of` / `any_of`): database schema, per-prop scoring in `v_forecasts.score`, and server actions. **No UI changes** — binary props behave exactly as before and choice props cannot yet be created through the interface.

Design: `docs/superpowers/specs/2026-09-01-choice-props-design.md`.

## Schema

- `props.kind` (`binary` default), `prop_options`, `forecast_options`, `resolution_options`
- `forecasts.forecast` and `resolutions.resolution` become nullable (null for choice props; triggers enforce the pairing with `kind`)
- `resolutions` gains `UNIQUE (prop_id)`; drops the vestigial `resolved_at` if present (already gone in prod)
- `v_props` / `v_forecasts` gain `prop_kind`; `v_forecasts.score` is now the per-prop score for every kind; new `v_prop_options`

## Before applying the migration

Run on staging, then prod — expected zero rows:

```sql
SELECT prop_id, count(*) FROM resolutions GROUP BY prop_id HAVING count(*) > 1;
```

Then `DATABASE_URL='…' npm exec kysely migrate up`. The startup schema check means the new image will not boot until the migration is applied, and the old image will not boot once it is — apply and deploy together.

## Testing

Unit tests for the pure modules and every action validation path; container tests (run in CI) pin the SQL score to the TypeScript reference for all three kinds, exercise the kind triggers, uniques, composite FKs, RLS presence and the options view.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01BqHhYaxchKxPy6gJahfQbg
EOF
```

- [ ] **Step 4: Watch CI**

`gh pr checks --watch`. If the container tests fail in CI, fix forward on the same branch.
