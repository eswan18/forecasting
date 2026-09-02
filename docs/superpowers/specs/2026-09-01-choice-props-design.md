# Choice Props — Design

**Date:** 2026-09-01
**Status:** approved (data model, backend, frontend scope agreed in conversation)

## 1. What we are building

Today every prop is a yes/no statement and a forecast is a single probability.
This adds **choice props**: a prop with a list of options where the forecaster
assigns a probability to every option.

Two kinds of choice prop:

- **`one_of`** — mutually exclusive outcomes; exactly one option resolves true
  and the probabilities must sum to 100%. Example: "Who will win the NBA
  championship?" with Knicks / Spurs / Thunder / Other.
- **`any_of`** — independent outcomes; any number of options (including zero)
  may resolve true and the probabilities are unconstrained. Example: "Which of
  these people will announce a primary candidacy this year?" with one option
  per person.

Existing yes/no props are kind **`binary`** and are unchanged in behaviour.

Ordinal choice props (bucketed ranges where a near miss deserves partial
credit) are **explicitly out of scope** but the model must make them a cheap
later addition: options already carry a `position`, so ordinal becomes a flag
on the prop plus a different aggregation in the same score expression (the
ranked probability score, which for two options reduces to the binary Brier).

### Scoring (decided)

- Scores stay on the existing **0 to 1 Brier scale**, lower is better.
- **binary:** `(outcome − p)²` — exactly today's formula.
- **one_of:** the multi-category Brier score divided by 2 so that a two-option
  prop scores identically to a binary one: `½ · Σᵢ (oᵢ − pᵢ)²` where `o` is the
  one-hot outcome vector.
- **any_of:** each option is an independent binary event; the prop score is
  the mean of the per-option binary Briers: `(1/k) · Σᵢ (oᵢ − pᵢ)²`.
- A prop of any kind contributes **one** number to a user's competition
  average. Per-category averages work the same way.

We consciously rejected GJP's 0 to 2 scale (would rescale every existing
number and relearn the "0.25 = coin flip" anchor) and the log score (unbounded,
inconsistent with existing scores).

### Assumptions (decided)

- `kind` is fixed at creation.
- Options are label-editable but the **set** of options cannot change after
  creation in this version (no add/remove; delete and recreate the prop).
- `one_of` forecasts are entered as integer percents that must sum to exactly
  100; stored as decimals in `[0, 1]`.
- "Other" is an ordinary option the author adds; nothing special.
- 2 to 20 options per choice prop.
- Suggested props stay free text. Personal props (no live page) are out of
  scope. Analytics *graphics* stay binary-only for now (see §5).

## 2. Data model

**Principle:** keep one `forecasts` row per (user, prop) and one `resolutions`
row per prop. Per-option values live in child tables hanging off those header
rows. This preserves the invariant that every counting site, the completeness
check, the unique constraints and the main read query already depend on, so
the migration is purely additive.

### 2.1 Tables

| Table | Change |
|---|---|
| `props` | New `kind text NOT NULL DEFAULT 'binary' CHECK (kind IN ('binary','one_of','any_of'))`. A text column with a CHECK (not a PG enum) so a future `ordinal` value is a one-line change. |
| `prop_options` (new) | `id serial PK`, `prop_id int NOT NULL REFERENCES props(id) ON DELETE CASCADE`, `text text NOT NULL`, `position int NOT NULL` (0-based display order), `created_at`/`updated_at timestamptz NOT NULL DEFAULT now()` + the existing `set_updated_at` trigger. `UNIQUE (prop_id, position)`, `UNIQUE (prop_id, text) DEFERRABLE INITIALLY DEFERRED` (deferred so a label permutation within one transaction — swapping two options' labels, rewritten one row at a time — commits instead of colliding mid-statement), `UNIQUE (id, prop_id)` (target of the composite FKs below). |
| `forecasts` | `forecast` becomes **nullable** (filled for binary, `NULL` for choice props). Add `UNIQUE (id, prop_id)`. The existing `prop_user_unique (prop_id, user_id)` stays. |
| `forecast_options` (new) | `forecast_id int NOT NULL`, `prop_id int NOT NULL`, `option_id int NOT NULL`, `probability double precision NOT NULL CHECK (probability >= 0 AND probability <= 1)`, `created_at`/`updated_at` + trigger. `PRIMARY KEY (forecast_id, option_id)`. `FOREIGN KEY (forecast_id, prop_id) REFERENCES forecasts(id, prop_id) ON DELETE CASCADE`. `FOREIGN KEY (option_id, prop_id) REFERENCES prop_options(id, prop_id)`. |
| `resolutions` | `resolution` becomes **nullable** (`NULL` for choice props). Add `UNIQUE (prop_id)` (the app already assumes one resolution per prop; the schema never enforced it) and `UNIQUE (id, prop_id)`. Also `DROP COLUMN IF EXISTS resolved_at` — production no longer has this column (it is absent from `docs/schema.png` and from `types/db_types.ts`) but the test bootstrap still creates it `NOT NULL`, which makes any app-path resolution insert fail in the container tests. Dropping it in this migration is a no-op in prod and aligns the test schema. |
| `resolution_options` (new) | `resolution_id int NOT NULL`, `prop_id int NOT NULL`, `option_id int NOT NULL`, `outcome boolean NOT NULL`, `created_at`/`updated_at` + trigger. `PRIMARY KEY (resolution_id, option_id)`. `FOREIGN KEY (resolution_id, prop_id) REFERENCES resolutions(id, prop_id) ON DELETE CASCADE`. `FOREIGN KEY (option_id, prop_id) REFERENCES prop_options(id, prop_id)`. |

The denormalised `prop_id` on the child tables exists purely so the composite
foreign keys can guarantee an option belongs to the same prop as its parent
forecast/resolution.

Use `double precision` (not `numeric`) for `probability`: production's
`forecasts.forecast` is `float8`, and `pg` returns `numeric` columns as
strings, which the test bootstrap's `decimal` column already demonstrates.

### 2.2 Integrity split

Row-level rules live in the database; set-level rules live in the server
action's transaction.

**Database (triggers, all `SECURITY DEFINER` plpgsql like the existing helper
functions):**

- `forecasts` BEFORE INSERT OR UPDATE: `forecast IS NULL` must hold exactly when
  the prop's kind is not `binary`. Raise otherwise.
- `resolutions` BEFORE INSERT OR UPDATE: same rule for `resolution`.
- `props` BEFORE UPDATE: raise if `NEW.kind <> OLD.kind`.

These are the corruptions that would silently mis-score, so they belong in the
schema.

**Server action (inside `withRLSAction`):**

- A choice forecast covers every option of the prop exactly once, every
  probability is in `[0, 1]`, and for `one_of` the probabilities sum to 1
  within `1e-6`.
- A choice resolution covers every option exactly once; `one_of` has exactly
  one `true`; `any_of` may have any number of `true` including zero.
- Option labels: 2 to 20, trimmed, non-empty, ≤ 200 chars, unique within the
  prop.

### 2.3 Row-level security

Enable RLS on all three new tables and mirror the parent tables' policies in
inlined form: the codebase inlines the prop-visibility conditions inside
`EXISTS (SELECT 1 FROM props p …)` rather than relying on nested RLS.

The private-competition test inside those inlined predicates **must use the
fail-closed positive form**:

```sql
p.competition_id IS NULL
OR EXISTS (SELECT 1 FROM competitions c
            WHERE c.id = p.competition_id AND c.is_private = FALSE)
```

not the negation the parents originally shipped (`NOT EXISTS (… c.is_private =
TRUE)`). Postgres RLS-filters the relations referenced inside a policy
expression as the querying role, and `view_competitions` hides private
competitions from non-members — so under the negation that sub-select found
nothing, `NOT EXISTS` was TRUE, and every private competition's rows fell
through the "public" branch to any caller, anonymous ones included. The
positive form fails closed under the same filtering while still admitting
genuinely public props, because public competitions are visible to everyone;
membership and system-admin branches are unaffected either way, since
`is_competition_member()` / `is_current_user_admin()` are SECURITY DEFINER.
Migration `1788307200000_fail-closed-private-competition-rls` applies this form
to the three policies below **and** to their parents (`view_props`,
`create_props`, `view_resolutions`, `view_forecasts`, `create_forecasts`)
together — closing only the children would leave the prop text and the binary
forecasts exposed. Behaviour is covered by
`tests/integration/choice-props-rls.integration.test.ts`, which runs through a
non-owner database role; policies are unenforced against a table owner.

- `prop_options`
  - `view_prop_options` FOR SELECT: `EXISTS (SELECT 1 FROM props p WHERE p.id = prop_options.prop_id AND (<the four `view_props` branches applied to p>))`.
  - `manage_prop_options` FOR ALL (USING = WITH CHECK): `EXISTS (SELECT 1 FROM props p WHERE p.id = prop_options.prop_id AND ((p.user_id IS NOT NULL AND p.user_id = current_user_id()) OR (p.competition_id IS NOT NULL AND is_competition_admin(p.competition_id)))) OR is_current_user_admin()` — i.e. the `update_props` predicate.
- `forecast_options`
  - `view_forecast_options` FOR SELECT: `EXISTS (SELECT 1 FROM forecasts f WHERE f.id = forecast_options.forecast_id AND (f.user_id = current_user_id() OR EXISTS (<the `view_forecasts` visible-prop block on f.prop_id>))) OR is_current_user_admin()`.
  - `manage_forecast_options` FOR ALL (USING = WITH CHECK): `EXISTS (SELECT 1 FROM forecasts f WHERE f.id = forecast_options.forecast_id AND f.user_id = current_user_id()) OR is_current_user_admin()`.
- `resolution_options`
  - `view_resolution_options` FOR SELECT: `EXISTS (SELECT 1 FROM resolutions r WHERE r.id = resolution_options.resolution_id AND (<the `view_resolutions` predicate on r>))`.
  - `manage_resolution_options` FOR ALL (USING = WITH CHECK): `EXISTS (SELECT 1 FROM resolutions r WHERE r.id = resolution_options.resolution_id AND (<the `manage_resolutions` predicate on r>))`.

### 2.4 Views

Both existing views are dropped and recreated (as every prior view migration
does) with one added column, **`prop_kind`**, and `v_forecasts.score` becomes
the **per-prop** score for every kind so `AVG(score)` keeps meaning "average
over props":

```sql
CASE props.kind
  WHEN 'binary' THEN power(resolutions.resolution::integer::double precision - forecasts.forecast, 2::double precision)
  ELSE (
    SELECT SUM(power(ro.outcome::integer::double precision - fo.probability, 2::double precision))
           * CASE props.kind WHEN 'one_of' THEN 0.5 ELSE 1.0 / NULLIF(COUNT(*), 0) END
    FROM forecast_options fo
    JOIN resolution_options ro
      ON ro.option_id = fo.option_id AND ro.resolution_id = resolutions.id
    WHERE fo.forecast_id = forecasts.id
  )
END AS score
```

The `NULLIF` guards the `any_of` divisor: the subquery matches no rows while
the prop is unresolved, and `1.0 / 0` is a hard error in postgres (not `NULL`),
so without it every read of the view would raise a division-by-zero as soon as
an unresolved `any_of` prop had a forecast.

It is `NULL` while unresolved, exactly as today. `v_props` is otherwise
unchanged: the new `UNIQUE (prop_id)` on resolutions guarantees its LEFT JOIN
still yields one row per prop.

New view for display:

```sql
CREATE VIEW v_prop_options WITH (security_barrier, security_invoker) AS
SELECT po.id AS option_id, po.prop_id, po.text AS option_text, po.position,
       ro.outcome
FROM prop_options po
LEFT JOIN resolutions r ON r.prop_id = po.prop_id
LEFT JOIN resolution_options ro ON ro.resolution_id = r.id AND ro.option_id = po.id;
```

A per-option analytics view (for calibration etc.) is deliberately **not**
added now; it is the natural home when the graphics are revisited.

### 2.5 Consequence for consumers

"Is this prop resolved" can no longer be read from the `resolution` boolean
(it is `NULL` for resolved choice props). Every such check moves to
`resolution_id IS NOT NULL` (views) / `resolution_id !== null` (TS), or to
`score IS NOT NULL` where a score is what is wanted. The `resolved-yes` /
`resolved-no` statuses stay binary-only; a plain `resolved` status is added for
choice props in stage two (§4.3).

### 2.6 Pre-flight before applying the migration

Run against staging then prod before `kysely migrate up`; the new unique
refuses to apply if duplicates exist:

```sql
SELECT prop_id, count(*) FROM resolutions GROUP BY prop_id HAVING count(*) > 1;
```

Expected: zero rows. (The app code has always prevented duplicates; this is a
guard.)

## 3. Backend (stage one)

### 3.1 Pure modules (no `lib/database.ts` import; unit-testable)

`lib/prop-kind.ts`

```ts
export const PROP_KINDS = ["binary", "one_of", "any_of"] as const;
export type PropKind = (typeof PROP_KINDS)[number];
export type ChoiceKind = Exclude<PropKind, "binary">;
export const PROP_KIND_LABELS: Record<PropKind, string> = {
  binary: "Yes / No", one_of: "Pick one", any_of: "Any that apply",
};
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 20;
export const MAX_OPTION_LENGTH = 200;
export function isChoiceKind(kind: PropKind): kind is ChoiceKind;
export function scoreWeight(kind: PropKind, optionCount: number): number; // 1, 0.5, 1/optionCount
```

`lib/choice-forecast.ts`

```ts
export interface OptionProbability { optionId: number; probability: number }
export interface OptionOutcome { optionId: number; outcome: boolean }
export const PROBABILITY_SUM_TOLERANCE = 1e-6;
export function validateOptionLabels(labels: string[]): string[];            // [] when valid
export function validateChoiceForecast(kind: ChoiceKind, optionIds: number[], probabilities: OptionProbability[]): string[];
export function validateChoiceOutcomes(kind: ChoiceKind, optionIds: number[], outcomes: OptionOutcome[]): string[];
export function scoreBinaryForecast(forecast: number, resolution: boolean): number;
export function scoreChoiceForecast(kind: ChoiceKind, probabilities: OptionProbability[], outcomes: OptionOutcome[]): number;
```

`scoreChoiceForecast` is the TypeScript reference implementation of the SQL
score expression; container tests pin the two together.

### 3.2 Types (`types/db_types.ts`)

- `PropsTable.kind: Generated<PropKind>`; `VPropsView.prop_kind: PropKind`; `VForecastsView.prop_kind: PropKind`.
- `ForecastsTable.forecast: number | null`; `VForecastsView.forecast: number | null`.
- `ResolutionsTable.resolution: boolean | null` (view already nullable).
- New tables `PropOptionsTable`, `ForecastOptionsTable`, `ResolutionOptionsTable`; new view `VPropOptionsView { option_id; prop_id; option_text; position; outcome: boolean | null }`; all registered in `Database`.
- One option summary shape used everywhere an option appears:

```ts
export interface PropOptionSummary {
  option_id: number;
  text: string;
  position: number;
  outcome: boolean | null;          // resolved outcome, null while open
  user_forecast: number | null;     // the requesting user's probability
  community_average: number | null;
}
export type PropWithUserForecast = VProp & {
  user_forecast: number | null;      // binary only; null for choice props
  user_forecast_id: number | null;   // set for both kinds
  community_average: number | null;  // binary only
  options: PropOptionSummary[];      // [] for binary
};
```

"Has this user forecasted" is `user_forecast_id !== null`, never
`user_forecast !== null`.

### 3.3 Read path

A shared helper `attachOptions(trx, props, userId)` in `lib/attach-options.ts`
— a `server-only` module, deliberately **not** a `"use server"` file, because
every export of a `"use server"` file becomes a client-callable server action
and this helper takes a Kysely `Transaction` — takes rows carrying `prop_id` and
`prop_kind`, queries `v_prop_options` for the choice props among them, joins
the user's `forecast_options` (via the user's `forecasts` header) and
`AVG(probability)` across all forecasts, and returns `Map<propId,
PropOptionSummary[]>` ordered by `position`. It is used by:

- `getPropsWithUserForecasts` → adds `options`.
- `getPropById` → returns `VProp & { options: PropOptionSummary[] }` (user values for the current user).
- `getUserScoreBreakdown` → each `UserForecastScore` gains `kind: PropKind` and `options: { text: string; userForecast: number; outcome: boolean }[]` (empty for binary).
- `getRecentlyResolvedForecasts` → returns `(VForecast & { options: PropOptionSummary[] })[]`.

`lib/db_actions/prop-options.ts` holds only the `updatePropOptions` action.

`getCompetitionStats` and `getUpcomingDeadlines` already work off header rows,
so their counts are correct; `UpcomingDeadline` gains `kind: PropKind` and
`hasUserForecast: boolean`.

### 3.4 Write actions

| Action | Behaviour |
|---|---|
| `createProp({ prop, options? })` | `options: string[]` required iff `prop.kind` is a choice kind, forbidden otherwise. Validated with `validateOptionLabels`; inserted into `prop_options` (position = index) in the same transaction after the prop. |
| `updateProp` | Rejects a `kind` in the update — the guard is `prop.kind !== undefined`, so an update object that merely carries an undefined `kind` passes (same whitelist pattern as `updateForecast`). |
| `updatePropOptions({ propId, options: { id, text }[] })` (new) | Label edits only; the set of ids must equal the prop's existing option ids. Validated with `validateOptionLabels`. |
| `saveChoiceForecast({ propId, probabilities })` (new) | Requires login; forecasts as the current user. Rejects binary props and past-close-date props (same check as `createForecast`). Validates with `validateChoiceForecast` against the prop's options. Upserts the header row (`forecast: null`), deletes existing `forecast_options` for it, inserts the new ones, touches the header's `updated_at`. Returns the forecast id. |
| `createForecast` / `updateForecast` | Unchanged, plus a `VALIDATION_ERROR` when the prop is a choice prop. |
| `resolveProp({ propId, resolution?, outcomes?, notes?, userId, overwrite })` | Binary props require `resolution` and forbid `outcomes`; choice props the reverse. Choice: validate with `validateChoiceOutcomes`; upsert the header (`resolution: null`), delete + reinsert `resolution_options`. |
| `unresolveProp`, `deleteResolution`, `deleteProp` | Unchanged; cascades handle children. |

Score actions (`getCompetitionScores`, `getUserScoreBreakdown`) switch their
resolved filter from `resolution IS NOT NULL` to `score IS NOT NULL`;
`getRecentlyResolvedForecasts` and the stats actions use `resolution_id`.

### 3.5 Stage-one deliverable

No new UI. Existing screens get only the type narrowing the nullable
`forecast` column forces. Choice props cannot be created through the
interface, so the migration can go to prod with no user-visible change.

## 4. Frontend (stage two)

Follow the design language in `CLAUDE.md` (flat surfaces, mono tabular
numerics, uppercase mono kickers, semantic tokens). Story every new leaf.

### 4.1 Creating props

- **Shared schema file** `components/forms/prop-form-schema.ts` (extracted
  from the two inline schemas, per the CLAUDE.md testability rule) exporting
  `propKindSchema`, `propOptionsSchema` (array of `{ text }`), and a
  `refineKindOptions` helper that both forms apply: options required and valid
  (via `validateOptionLabels`) when kind is a choice kind, must be empty when
  binary. Unit tests.
- `CreateEditPropForm` / `PropFormFields` and the private-competition
  `NewPropForm` both gain a **Type** select (labels from `PROP_KIND_LABELS`)
  and, when a choice kind is selected, an **options editor**: a list of text
  inputs with add/remove buttons, min 2 / max 20, order = position. Submit
  passes `options: string[]`. In `CreateEditPropForm` edit mode the type is
  shown read-only and the options editor is hidden.
- `PropEditDialog` gains, for choice props, an editable label per option
  (calls `updatePropOptions` after `updateProp`). No add/remove.
- The "Tips" copy in the new-prop form changes from "Frame as a clear yes/no
  question" to "Frame as a clear yes/no question, or list the options".

### 4.2 Entering forecasts

- Extract the existing `PercentInput` from `editable-forecast-card.tsx` into
  `components/forecast-card/percent-input.tsx`.
- New leaf `components/forecast-card/choice-forecast-editor.tsx`:
  props `{ kind: ChoiceKind; options: PropOptionSummary[]; values: Record<number, number | null>; onChange(optionId, value); disabled? }`.
  One row per option: label, community average (muted mono), `PercentInput`.
  For `one_of` a footer shows the running total in mono ("Total 87% · 13%
  remaining", destructive token when ≠ 100). It exposes nothing about saving;
  the parent decides. Story with both kinds.
- `EditableForecastCard` branches on `prop.prop_kind`: binary is untouched;
  choice renders the editor full-width under the text and a Save button that
  is enabled only when every option has a value and (for `one_of`) the total is
  exactly 100. Save calls `saveChoiceForecast`.
- `CompetitionPropView` branches the same way: choice replaces the slider card
  with the editor; header, deadline and admin edit are shared.

### 4.3 Displaying forecasts

- New leaf `components/forecast-card/choice-forecast-summary.tsx`:
  `{ kind; options: PropOptionSummary[]; showCommunityAvg: boolean }`. A
  hairline-separated list: label, the user's % (mono, bold), community average
  (muted), and when resolved a success check on realized options / muted
  cross on the rest. "No forecast yet" when the user has none. Story.
- `ForecastCard`: choice renders the summary full-width below the text instead
  of the needle column.
- `lib/prop-status.ts`: add status `"resolved"`. `getPropStatus(closeDate,
  resolution, options?)` gains `options.isResolved?: boolean`; a non-null
  `resolution` still yields yes/no, otherwise `isResolved` yields `"resolved"`.
  `getPropStatusFromProp` reads `resolution_id` when present. Label
  "Resolved"; badge variant styled like `resolved-yes`.
- `ResolutionDialog` takes `options?: PropOptionSummary[]`. Choice props show
  radios (`one_of`) or checkboxes (`any_of`) per option plus the existing
  Unresolved radio; submit calls `resolveProp` with `outcomes`.
- `ResolvedPropCard` (landing): props become `{ kind; forecast: number | null;
  resolution: boolean | null; realized: { text: string; userForecast: number }[] }`.
  Choice shows the realized labels (up to two, then "+n more"; "None" when
  empty) and, for `one_of`, "You said" = the user's % on the winner.
- Score breakdown `ForecastScoreRow`: choice rows show realized labels in the
  Resolution column ("None" when empty); Forecast column shows the user's % on
  the winner for `one_of` and "—" for `any_of`. Fixtures/story updated.
- `UpcomingDeadlines` chip: choice shows a check in `success-muted` tokens when
  forecasted, "—" otherwise.
- `CompetitionDashboard` tab filters use `resolution_id`.
- Single-prop page `/props/[propId]`: for choice props render a new leaf
  `PropOptionsTable` (label, community average, your forecast, outcome) in
  place of the stats row, distribution chart and forecasts list, plus a
  "Forecasters: N" line from the header-row count. Binary page unchanged.

### 4.4 Analytics: binary-only for now

Bold takes, certainty, prop consensus, the distribution chart and the
calibration page all filter to `prop_kind === "binary"` (one line each, with
a comment pointing at this spec). They are revisited when a per-option
analytics view exists.

## 5. Testing

- **Pure:** `lib/prop-kind.test.ts`, `lib/choice-forecast.test.ts` (labels,
  probabilities incl. the sum tolerance, outcomes, and the score against
  hand-computed values: uniform `one_of` over 2/4/10 options scores
  0.25 / 0.375 / 0.45; uniform 50% `any_of` scores 0.25 regardless of count;
  a perfect forecast scores 0; all mass on the wrong option scores 1).
- **Unit (mocked):** every validation path of the new/changed actions,
  following `lib/db_actions/props.test.ts`.
- **Container** (`ifRunningContainerTestsIt`; run in CI by
  `.github/workflows/pr-checks.yml`, Docker is not available on the dev
  machine): the migration applies on the bootstrap schema; `v_forecasts.score`
  equals `scoreBinaryForecast` / `scoreChoiceForecast` for all three kinds and
  is null while unresolved; a competition with one binary and one choice prop
  averages to the mean of two prop scores; the kind triggers reject a scalar
  forecast on a choice prop and a null forecast on a binary prop; the kind
  trigger on props rejects a kind change; `resolutions (prop_id)` is unique;
  RLS is enabled and the named policies exist on all three new tables (`pg_class.relrowsecurity`, `pg_policies`).
  Remember `numeric` columns come back as strings from `pg`; wrap in `Number()`.
- **Manifest:** `npx tsx scripts/generate-migration-manifest.ts` after adding
  the migration; `lib/migrations/manifest.test.ts` enforces it.
- **Storybook:** `npm run build-storybook` must exit clean after stage two.

## 6. Rollout

1. **PR 1 — stage one** (branch `choice-props` → `main`): migration + manifest,
   types, pure modules, actions, tests, minimal type narrowing.
   Before merge: run §2.6 on staging; after merge apply the migration to
   staging (`DATABASE_URL='…' npm exec kysely migrate up`), verify, then prod.
   The startup schema check means the new image will not boot until the
   migration is applied, and the old image will not boot once it is; apply and
   deploy together. Previews handle it automatically via the initContainer.
2. **PR 2 — stage two** (branch `choice-props-ui`, based on `choice-props`):
   the frontend. Retarget to `main` once PR 1 merges.

## 7. Known adjacent issue (not in scope)

`v_props.competition_forecasts_open_date` coalesces `props.forecasts_due_date`
into the *open* date (migration `1769364811701`, line 375) — almost certainly a
copy-paste of the close-date line. Left untouched here; worth its own fix.
