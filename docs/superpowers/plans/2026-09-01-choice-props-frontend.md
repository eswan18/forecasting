# Choice Props — Stage Two (Frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins create and resolve choice props and let forecasters enter and read per-option forecasts on every surface, while the analytics graphics stay binary-only.

**Architecture:** Every surface branches on `prop_kind`. Binary paths are untouched. Choice paths use three new presentational leaves (`ChoiceForecastEditor`, `ChoiceForecastSummary`, `PropOptionsTable`), one shared entry hook (`useChoiceForecastEntry`) that both entry surfaces use, one shared form-schema module for both prop-creation forms, and a `resolved` prop status for choice props. Server actions and types come from stage one and are not changed here.

**Tech Stack:** Next.js 15 app router, React 19, TypeScript, Tailwind + shadcn/ui, react-hook-form + Zod, Storybook (react-vite), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-01-choice-props-design.md` — §4 is this plan's authority; §3.2 and §3.4 define the types and actions you consume.

## Global Constraints

- Design language (CLAUDE.md "Design Language"): flat surfaces with hairline borders, no always-on `shadow-*`; numerics `font-mono tabular-nums`; kicker labels `font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground`; semantic tokens only (`success-muted`, `destructive-muted`, `primary`), never hardcoded Tailwind colors.
- Every new presentational leaf gets a Storybook story beside it (`*.stories.tsx`, `@storybook/react-vite`, `tags: ["autodocs"]`, `title: "<Group>/…"`). Leaf components import db types with `import type` only. `npm run build-storybook` must exit clean.
- Storybook aliases `@/lib/db_actions` → `.storybook/mocks/db_actions.ts` and `@/lib/db_actions/props` → `.storybook/mocks/db_actions-props.ts`. **Any client component reachable from a story must import server actions from one of those two paths**, and the mock file must export the action (returning `success(...)`). A new import path like `@/lib/db_actions/prop-options` is NOT aliased and will break the Storybook build.
- Kind values `"binary" | "one_of" | "any_of"`; labels from `PROP_KIND_LABELS` in `lib/prop-kind.ts` ("Yes / No", "Pick one", "Any that apply").
- Forecast entry is integer percents 0–100 in the UI, probabilities 0–1 in state and on the wire (the existing `PercentInput` already does this).
- `one_of` Save is enabled only when every option has a value and the percents sum to exactly 100. `any_of` Save is enabled when every option has a value.
- "Is resolved" is `resolution_id !== null`; "has forecasted" is `user_forecast_id !== null`.
- Stage-one interfaces you consume (do not change them):
  ```ts
  // types/db_types.ts
  interface PropOptionSummary { option_id: number; text: string; position: number; outcome: boolean | null; user_forecast: number | null; community_average: number | null }
  type PropWithUserForecast = VProp & { user_forecast: number | null; user_forecast_id: number | null; community_average: number | null; options: PropOptionSummary[] }
  // VProp / VForecast carry prop_kind: PropKind; VForecast.forecast is number | null
  // lib/db_actions (barrel)
  createProp({ prop: NewProp; options?: string[] })
  updatePropOptions({ propId: number; options: { id: number; text: string }[] })
  saveChoiceForecast({ propId: number; probabilities: { optionId: number; probability: number }[] }) → ServerActionResult<number>
  resolveProp({ propId; resolution?: boolean; outcomes?: { optionId: number; outcome: boolean }[]; notes?; userId; overwrite? })
  getPropById(id) → ServerActionResult<(VProp & { options: PropOptionSummary[] }) | null>
  // lib/db_actions/competition-scores.ts
  interface UserForecastScore { …; forecast: number | null; resolution: boolean | null; kind: PropKind; options: { text: string; userForecast: number; outcome: boolean }[] }
  // lib/db_actions/competition-stats.ts
  interface UpcomingDeadline { …; userForecast: number | null; kind: PropKind; hasUserForecast: boolean }
  // lib/db_actions/forecasts.ts
  getRecentlyResolvedForecasts(...) → (VForecast & { options: PropOptionSummary[] })[]
  // lib/prop-kind.ts: PropKind, ChoiceKind, PROP_KIND_LABELS, isChoiceKind, MIN_OPTIONS, MAX_OPTIONS
  // lib/choice-forecast.ts: validateOptionLabels
  // lib/binary-forecast.ts: BinaryForecast, isBinaryForecast
  ```
- Verification before every commit: `npx tsc --noEmit && npm run lint && npm run test`; before the final commit also `npm run build-storybook`.
- Commit trailer on every commit:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01BqHhYaxchKxPy6gJahfQbg
  ```

---

## File map

| File | Responsibility |
|---|---|
| `lib/prop-status.ts`, `components/ui/prop-status-badge.tsx` | `resolved` status for choice props. |
| `components/forms/prop-form-schema.ts` (new) | Shared Zod pieces for both prop forms. |
| `components/forms/options-editor.tsx` (new, leaf + story) | Controlled list editor for option labels. |
| `components/forms/create-edit-prop-form.tsx`, `prop-form-fields.tsx`, `app/competitions/[competitionId]/props/new/new-prop-form.tsx` | Type select + options editor wired into both creation forms. |
| `components/dialogs/prop-edit-dialog.tsx` | Option label editing. |
| `components/forecast-card/percent-input.tsx` (extracted) | Existing integer-percent input. |
| `components/forecast-card/choice-entry.ts` (new, pure) | Entry-state helpers (total, completeness). |
| `components/forecast-card/use-choice-forecast-entry.ts` (new hook) | Shared entry state + save for both entry surfaces. |
| `components/forecast-card/choice-forecast-editor.tsx` (new, leaf + story) | Per-option percent inputs with running total. |
| `components/forecast-card/choice-forecast-summary.tsx` (new, leaf + story) | Read-only per-option list. |
| `components/forecast-card/editable-forecast-card.tsx`, `forecast-card.tsx`, `app/competitions/[competitionId]/props/[propId]/competition-prop-view.tsx` | Kind branches. |
| `components/dialogs/resolution-dialog.tsx` | Per-option outcomes. |
| `components/landing/resolved-prop-card.tsx`, `recently-resolved.tsx` | Choice-aware resolved card. |
| `app/competitions/[competitionId]/scores/user/[userId]/components/score-table-parts.tsx` (+ fixtures/story) | Choice rows. |
| `components/competition-dashboard/upcoming-deadlines.tsx` (+ story) | Choice chip. |
| `app/props/[propId]/prop-options-table.tsx` (new, leaf + story), `app/props/[propId]/page.tsx` | Choice single-prop page. |
| `.storybook/mocks/db_actions.ts`, `.storybook/mocks/db_actions-props.ts` | New action stubs. |

---

### Task 1: `resolved` prop status

**Files:**
- Modify: `lib/prop-status.ts`, `components/ui/prop-status-badge.tsx`
- Test: `lib/prop-status.test.ts` (extend)

**Interfaces:**
- Produces:
  ```ts
  export type PropStatus = "open" | "unresolved" | "resolved-yes" | "resolved-no" | "resolved";
  export interface PropStatusOptions { currentDate?: Date; isResolved?: boolean }
  export function getPropStatus(closeDate: Date | null, resolution: boolean | null, options?: PropStatusOptions): PropStatus;
  export function getPropStatusFromProp(prop: { …existing; resolution: boolean | null; resolution_id?: number | null }, options?): PropStatus;
  ```

- [ ] **Step 1: Failing tests** — add to `lib/prop-status.test.ts`

```ts
describe("choice props", () => {
  it("returns resolved when isResolved is set and there is no boolean resolution", () => {
    expect(getPropStatus(null, null, { isResolved: true })).toBe("resolved");
    expect(getPropStatus(new Date(0), null, { isResolved: true })).toBe("resolved");
  });
  it("a boolean resolution still wins", () => {
    expect(getPropStatus(null, true, { isResolved: true })).toBe("resolved-yes");
  });
  it("getPropStatusFromProp reads resolution_id", () => {
    expect(getPropStatusFromProp({ resolution: null, resolution_id: 7 })).toBe("resolved");
    expect(getPropStatusFromProp({ resolution: null, resolution_id: null })).toBe("open");
  });
  it("labels resolved as Resolved", () => {
    expect(getPropStatusLabel("resolved")).toBe("Resolved");
  });
});
```

- [ ] **Step 2: Run** `npx vitest run lib/prop-status.test.ts` — FAIL.

- [ ] **Step 3: Implement**

In `getPropStatus`, after the boolean check: `if (options?.isResolved) return "resolved";`. In `getPropStatusFromProp`, pass `{ ...options, isResolved: prop.resolution_id != null }`. Add `case "resolved": return "Resolved";` to the label switch. In `prop-status-badge.tsx` add the variant `resolved: "border-transparent bg-primary text-primary-foreground"` (same look as `resolved-yes`, minus the shadow).

- [ ] **Step 4: Run** the test file, then `npx tsc --noEmit && npm run lint && npm run test`.

- [ ] **Step 5: Commit** — `git commit -m "feat(props): add resolved status for choice props"`

---

### Task 2: Shared prop-form schema and the options editor leaf

**Files:**
- Create: `components/forms/prop-form-schema.ts`, `components/forms/prop-form-schema.test.ts`, `components/forms/options-editor.tsx`, `components/forms/options-editor.stories.tsx`

**Interfaces:**
- Produces:
  ```ts
  // prop-form-schema.ts
  export const propKindSchema: z.ZodEnum<["binary", "one_of", "any_of"]>;
  export const propOptionsSchema: z.ZodArray<z.ZodObject<{ text: z.ZodString }>>; // no length limits here
  export type PropOptionField = { text: string };
  /** superRefine callback: options required+valid (validateOptionLabels) for choice kinds, must be empty for binary; issues go on path ["options"]. */
  export function refineKindOptions(data: { kind: PropKind; options: PropOptionField[] }, ctx: z.RefinementCtx): void;
  export const DEFAULT_OPTION_FIELDS: PropOptionField[]; // [{ text: "" }, { text: "" }]
  // options-editor.tsx
  export function OptionsEditor(props: { value: string[]; onChange: (value: string[]) => void; disabled?: boolean; errors?: string[] }): JSX.Element;
  ```

- [ ] **Step 1: Failing schema tests** — `components/forms/prop-form-schema.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { propKindSchema, propOptionsSchema, refineKindOptions } from "./prop-form-schema";

const schema = z.object({ kind: propKindSchema, options: propOptionsSchema }).superRefine(refineKindOptions);

describe("prop form schema", () => {
  it("accepts binary with no options", () => {
    expect(schema.safeParse({ kind: "binary", options: [] }).success).toBe(true);
  });
  it("rejects binary with options", () => {
    const r = schema.safeParse({ kind: "binary", options: [{ text: "A" }, { text: "B" }] });
    expect(r.success).toBe(false);
  });
  it("accepts one_of with two distinct labels", () => {
    expect(schema.safeParse({ kind: "one_of", options: [{ text: "A" }, { text: "B" }] }).success).toBe(true);
  });
  it("rejects one_of with one label, blank labels, or duplicates, on the options path", () => {
    for (const options of [[{ text: "A" }], [{ text: "A" }, { text: " " }], [{ text: "A" }, { text: "A " }]]) {
      const r = schema.safeParse({ kind: "one_of", options });
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0].path).toEqual(["options"]);
    }
  });
  it("rejects an unknown kind", () => {
    expect(propKindSchema.safeParse("multi").success).toBe(false);
  });
});
```

- [ ] **Step 2: Run** — FAIL (module missing).

- [ ] **Step 3: Implement `prop-form-schema.ts`**

```ts
import { z } from "zod";
import { PROP_KINDS, isChoiceKind, type PropKind } from "@/lib/prop-kind";
import { validateOptionLabels } from "@/lib/choice-forecast";

export const propKindSchema = z.enum(PROP_KINDS);
export const propOptionsSchema = z.array(z.object({ text: z.string() }));
export type PropOptionField = z.infer<typeof propOptionsSchema>[number];
export const DEFAULT_OPTION_FIELDS: PropOptionField[] = [{ text: "" }, { text: "" }];

export function refineKindOptions(
  data: { kind: PropKind; options: PropOptionField[] },
  ctx: z.RefinementCtx,
): void {
  if (isChoiceKind(data.kind)) {
    for (const message of validateOptionLabels(data.options.map((o) => o.text))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["options"], message });
    }
  } else if (data.options.length > 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["options"], message: "Yes/no propositions do not have options" });
  }
}
```

- [ ] **Step 4: Implement `OptionsEditor`** (client component)

A vertical list; each row = mono index kicker (`01`, `02`…), an `Input` (from `components/ui/input`) with placeholder `Option ${i + 1}`, and a ghost icon button (lucide `X`) to remove the row (hidden/disabled when only `MIN_OPTIONS` rows remain). Below: a ghost `Button` "Add option" (lucide `Plus`) disabled at `MAX_OPTIONS`, and a `text-xs text-muted-foreground` counter `${value.length} / ${MAX_OPTIONS}`. Render `errors` as `text-xs text-destructive` lines. Hairline borders, no shadows. Story `Forms/OptionsEditor` with a stateful wrapper: `Empty` (two blank rows), `Filled` (NBA teams), `WithErrors`, `Disabled`.

- [ ] **Step 5: Verify** `npx tsc --noEmit && npm run lint && npm run test && npm run build-storybook`

- [ ] **Step 6: Commit** — `git commit -m "feat(forms): shared prop-form schema and options editor"`

---

### Task 3: Type select + options editor in both creation forms

**Files:**
- Modify: `components/forms/create-edit-prop-form.tsx`, `components/forms/prop-form-fields.tsx`, `app/competitions/[competitionId]/props/new/new-prop-form.tsx`

**Interfaces:**
- Consumes: Task 2; `createProp({ prop, options })`.
- `PropFormValues` gains `kind: PropKind; options: PropOptionField[]`.

- [ ] **Step 1: `create-edit-prop-form.tsx`**

Extend `propFormSchema` with `kind: propKindSchema` and `options: propOptionsSchema`, and chain `.superRefine(refineKindOptions)` after the existing refines. Default values: `kind: initialProp?.prop_kind ?? "binary"`, `options: []` (the editor seeds `DEFAULT_OPTION_FIELDS` when the kind switches to a choice kind). On submit: `createPropAction.execute({ prop: { text, notes, category_id, competition_id, user_id, kind }, options: kind === "binary" ? undefined : options.map((o) => o.text) })`. Edit mode (`initialProp` set): submit sends no `kind` and no options (the action rejects `kind` changes).

- [ ] **Step 2: `prop-form-fields.tsx`**

Add a **Type** `FormField` (`name="kind"`, lucide `ListChecks` icon) as a `Select` over `PROP_KINDS` with `PROP_KIND_LABELS`; `disabled` in edit mode (add an `isEditing: boolean` prop). When `form.watch("kind")` is a choice kind and not editing, render a **Options** `FormField` (`name="options"`) whose control is `<OptionsEditor value={field.value.map(o => o.text)} onChange={(labels) => field.onChange(labels.map(text => ({ text })))} errors={…from form.formState.errors.options} />`; when the kind changes to a choice kind and options are empty, set `DEFAULT_OPTION_FIELDS`; when it changes to binary, set `[]`. Put the Type field directly under the text field.

- [ ] **Step 3: `new-prop-form.tsx`**

Same additions to its own inline schema (`kind`, `options`, `.superRefine(refineKindOptions)`), the same two fields (reuse `OptionsEditor`; the Type select is small enough to inline), submit passes `kind` inside `prop` and `options` as labels. Preview card: when a choice kind is selected list the non-blank option labels under the text. Change the first tip to "Frame as a clear yes/no question, or list the options".

- [ ] **Step 4: Manual check + verify**

`npx tsc --noEmit && npm run lint && npm run test && npm run build-storybook`. There is no Storybook for these forms (router/action coupled); rely on types and the schema tests.

- [ ] **Step 5: Commit** — `git commit -m "feat(forms): create one_of / any_of props with options"`

---

### Task 4: Option label editing in `PropEditDialog`

**Files:**
- Modify: `components/dialogs/prop-edit-dialog.tsx`, `.storybook/mocks/db_actions.ts`

**Interfaces:**
- `PropEditDialog` prop type becomes `prop: VProp & { options?: PropOptionSummary[] }` (both callers already pass objects carrying `options`).
- Consumes `updatePropOptions` **from the `@/lib/db_actions` barrel** (aliased in Storybook). Add `export const updatePropOptions = async () => success(undefined);` to `.storybook/mocks/db_actions.ts`.

- [ ] **Step 1: Implement**

When `prop.prop_kind !== "binary"` and `prop.options?.length`, render under Notes a block with kicker "Options" and one `Input` per option (state `labels: Record<number, string>` keyed by `option_id`, initialised from `prop.options`). Helper text `text-xs text-muted-foreground`: "Labels only — options can't be added or removed after creation." On submit: run `updateProp` as today, then if any label changed run `updatePropOptions({ propId, options: prop.options.map(o => ({ id: o.option_id, text: labels[o.option_id] })) })` via a second `useServerAction`; close on success of the last call. Disable Update when any label is blank.

- [ ] **Step 2: Verify** `npx tsc --noEmit && npm run lint && npm run test && npm run build-storybook`

- [ ] **Step 3: Commit** — `git commit -m "feat(props): edit option labels in the prop edit dialog"`

---

### Task 5: Entry primitives — `PercentInput` extraction, `choice-entry.ts`, `ChoiceForecastEditor`

**Files:**
- Create: `components/forecast-card/percent-input.tsx` (moved from `editable-forecast-card.tsx` lines 22-69, exported), `components/forecast-card/choice-entry.ts`, `components/forecast-card/choice-entry.test.ts`, `components/forecast-card/choice-forecast-editor.tsx`, `components/forecast-card/choice-forecast-editor.stories.tsx`
- Modify: `components/forecast-card/editable-forecast-card.tsx` (import `PercentInput`)

**Interfaces:**
- Produces:
  ```ts
  // choice-entry.ts (pure)
  export type ChoiceEntryValues = Record<number, number | null>; // option_id → probability 0..1 or null
  export function valuesFromOptions(options: PropOptionSummary[]): ChoiceEntryValues; // user_forecast per option
  export function entryTotalPercent(values: ChoiceEntryValues): number; // Math.round(sum of non-null × 100)
  export function isEntryComplete(kind: ChoiceKind, optionIds: number[], values: ChoiceEntryValues): boolean; // all non-null; one_of also total === 100
  export function entriesEqual(a: ChoiceEntryValues, b: ChoiceEntryValues, optionIds: number[]): boolean;
  export function toProbabilities(values: ChoiceEntryValues, optionIds: number[]): { optionId: number; probability: number }[]; // throws if any null
  // choice-forecast-editor.tsx (leaf)
  export function ChoiceForecastEditor(props: { kind: ChoiceKind; options: PropOptionSummary[]; values: ChoiceEntryValues; onChange: (optionId: number, value: number) => void; disabled?: boolean }): JSX.Element;
  ```

- [ ] **Step 1: Failing tests** — `choice-entry.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { entryTotalPercent, isEntryComplete, entriesEqual, toProbabilities, valuesFromOptions } from "./choice-entry";

const ids = [1, 2, 3];
describe("choice-entry", () => {
  it("valuesFromOptions maps user_forecast per option", () => {
    const opts = [
      { option_id: 1, text: "A", position: 0, outcome: null, user_forecast: 0.5, community_average: null },
      { option_id: 2, text: "B", position: 1, outcome: null, user_forecast: null, community_average: null },
    ];
    expect(valuesFromOptions(opts)).toEqual({ 1: 0.5, 2: null });
  });
  it("entryTotalPercent rounds to whole percents and ignores nulls", () => {
    expect(entryTotalPercent({ 1: 0.23, 2: 0.18, 3: 0.15, 4: 0.44 })).toBe(100);
    expect(entryTotalPercent({ 1: 0.5, 2: null })).toBe(50);
  });
  it("isEntryComplete: any_of needs every value; one_of also needs total 100", () => {
    expect(isEntryComplete("any_of", ids, { 1: 0.1, 2: 0.2, 3: 0.3 })).toBe(true);
    expect(isEntryComplete("any_of", ids, { 1: 0.1, 2: null, 3: 0.3 })).toBe(false);
    expect(isEntryComplete("one_of", ids, { 1: 0.5, 2: 0.3, 3: 0.2 })).toBe(true);
    expect(isEntryComplete("one_of", ids, { 1: 0.5, 2: 0.3, 3: 0.3 })).toBe(false);
  });
  it("entriesEqual compares only the given option ids", () => {
    expect(entriesEqual({ 1: 0.5, 2: 0.5 }, { 1: 0.5, 2: 0.5, 9: 1 }, [1, 2])).toBe(true);
    expect(entriesEqual({ 1: 0.5, 2: 0.5 }, { 1: 0.5, 2: 0.4 }, [1, 2])).toBe(false);
  });
  it("toProbabilities emits one entry per option id and throws on null", () => {
    expect(toProbabilities({ 1: 0.5, 2: 0.5 }, [1, 2])).toEqual([{ optionId: 1, probability: 0.5 }, { optionId: 2, probability: 0.5 }]);
    expect(() => toProbabilities({ 1: 0.5, 2: null }, [1, 2])).toThrow();
  });
});
```

- [ ] **Step 2: Run** — FAIL. **Step 3: Implement `choice-entry.ts`** to the interface above (`import type { PropOptionSummary } from "@/types/db_types"`).

- [ ] **Step 4: Extract `PercentInput`** into `percent-input.tsx` unchanged (export it); update the import in `editable-forecast-card.tsx`.

- [ ] **Step 5: Implement `ChoiceForecastEditor`**

Layout: a `divide-y divide-border` list; each row `flex items-center gap-3 py-2`: label (`text-sm text-foreground`, `MarkdownRenderer` not needed — plain text), a spacer, community average when present (`font-mono text-xs tabular-nums text-muted-foreground`, e.g. `avg 32%`), then `<PercentInput value={values[o.option_id] ?? null} onChange={(v) => onChange(o.option_id, v)} />` (respect `disabled` by not rendering the input and showing the value in mono instead). Footer for `one_of` only: `flex justify-between` with kicker "Total" and `font-mono text-sm tabular-nums` value `${total}%`, plus `${100 - total}% remaining` / `${total - 100}% over` in `text-destructive` when total ≠ 100 and `text-success-muted-foreground` "Adds up" when it does. Story `Forecast Card/ChoiceForecastEditor` with a stateful wrapper: `PickOne` (four NBA options, partially filled), `AnyThatApply`, `Disabled`.

- [ ] **Step 6: Verify** `npx tsc --noEmit && npm run lint && npm run test && npm run build-storybook`

- [ ] **Step 7: Commit** — `git commit -m "feat(forecasts): choice forecast editor and entry helpers"`

---

### Task 6: Entry surfaces — hook, `EditableForecastCard`, `CompetitionPropView`

**Files:**
- Create: `components/forecast-card/use-choice-forecast-entry.ts`
- Modify: `components/forecast-card/editable-forecast-card.tsx`, `app/competitions/[competitionId]/props/[propId]/competition-prop-view.tsx`, `.storybook/mocks/db_actions.ts`, `components/forecast-card/editable-forecast-card.stories.tsx`

**Interfaces:**
- Produces:
  ```ts
  export function useChoiceForecastEntry(prop: PropWithUserForecast, opts: { onSaved?: () => void }): {
    kind: ChoiceKind; optionIds: number[]; values: ChoiceEntryValues;
    setValue: (optionId: number, value: number) => void;
    hasChanges: boolean; canSave: boolean; isSaving: boolean;
    save: () => Promise<void>; cancel: () => void;
  };
  ```
  Uses `useServerAction(saveChoiceForecast, { successMessage: "Forecast saved!", onSuccess: opts.onSaved })` with `saveChoiceForecast` imported from `@/lib/db_actions`; add `export const saveChoiceForecast = async () => success(1);` to the Storybook mock.

- [ ] **Step 1: Implement the hook** (state initialised with `valuesFromOptions(prop.options)`; `hasChanges = !entriesEqual(values, valuesFromOptions(prop.options), optionIds)`; `canSave = isEntryComplete(kind, optionIds, values)`; `save` calls the action with `toProbabilities(values, optionIds)`).

- [ ] **Step 2: `EditableForecastCard`** — at the top: `if (isChoiceKind(prop.prop_kind)) return <EditableChoiceForecastCard … />` where the new inner component (same file, or `editable-choice-forecast-card.tsx` beside it if the file grows past ~250 lines) keeps the header (category badge, text, notes, admin pencil + `PropEditDialog`) and renders `<ChoiceForecastEditor kind options values onChange={setValue} />` full-width under the text, then the Save / Cancel row (`Save forecast` disabled unless `canSave && hasChanges`), with the same `hasChanges` ring styling as the binary card. Add stories `PickOneChoice` / `AnyThatApplyChoice` to `editable-forecast-card.stories.tsx` using fixtures with `prop_kind` and `options` (add them to `forecast-card.fixtures.ts`).

- [ ] **Step 3: `CompetitionPropView`** — when `isChoiceKind(prop.prop_kind)`, replace the "Your Forecast" card body (the percent box + slider + scale labels) with the editor and the same Save/Cancel logic from the hook; keep the header, deadline row, closed-state messages (use `prop.user_forecast_id !== null` for the "you submitted" / "you did not submit" messages in **both** branches), and the admin edit dialog. Do not touch the binary branch's slider code.

- [ ] **Step 4: Verify** `npx tsc --noEmit && npm run lint && npm run test && npm run build-storybook`

- [ ] **Step 5: Commit** — `git commit -m "feat(forecasts): enter per-option forecasts on the card and prop page"`

---

### Task 7: Read-only display — `ChoiceForecastSummary` and `ForecastCard`

**Files:**
- Create: `components/forecast-card/choice-forecast-summary.tsx`, `components/forecast-card/choice-forecast-summary.stories.tsx`
- Modify: `components/forecast-card/forecast-card.tsx`, `components/forecast-card/forecast-card.stories.tsx`, `components/forecast-card/forecast-card.fixtures.ts`

**Interfaces:**
- Produces: `ChoiceForecastSummary(props: { kind: ChoiceKind; options: PropOptionSummary[]; showCommunityAvg: boolean }): JSX.Element`

- [ ] **Step 1: Implement the leaf**

If every `user_forecast` is null render `text-sm text-muted-foreground` "No forecast yet". Otherwise a `divide-y divide-border` list, each row: label (`text-sm`), then when resolved (`outcome !== null`) a `Check` in `text-success-muted-foreground` for true / `X` in `text-muted-foreground/60` for false, a spacer, community average when `showCommunityAvg` (`font-mono text-xs tabular-nums text-muted-foreground`), and the user's value `font-mono text-sm font-semibold tabular-nums` (`Math.round(p*100)%`). Under the label a 2px bar `bg-primary/70` sized to the user's %, `bg-muted` track. Story `Forecast Card/ChoiceForecastSummary`: `PickOne`, `AnyThatApplyResolved`, `NoForecast`.

- [ ] **Step 2: `ForecastCard`** — when `isChoiceKind(prop.prop_kind)`: render the same card shell (badge row + text + notes) with the summary full-width below instead of the 150px needle column. Add `ChoicePickOne` / `ChoiceResolved` stories with fixtures.

- [ ] **Step 3: Verify + commit** — `git commit -m "feat(forecasts): read-only choice forecast summary on cards"`

---

### Task 8: `ResolutionDialog` with per-option outcomes

**Files:**
- Modify: `components/dialogs/resolution-dialog.tsx`

**Interfaces:**
- Prop type becomes `prop: VProp & { options?: PropOptionSummary[] }` (the caller `app/props/[propId]/prop-page-header.tsx` receives `getPropById` output, which carries `options`; update its prop type to match).

- [ ] **Step 1: Implement**

Derive `choice = isChoiceKind(prop.prop_kind) && prop.options?.length`. Mode state stays `"resolved" | "unresolved"`-like: keep the existing three radios for binary. For choice props render two radios "Resolved" / "Unresolved"; when Resolved, render the options: `one_of` → one radio per option (state `winnerId: number | null`, initialised from the option with `outcome === true`); `any_of` → one checkbox per option (state `checked: Set<number>` from outcomes). Submit: unresolved → `unresolveProp`; resolved → `resolveProp({ propId, outcomes: prop.options.map(o => ({ optionId: o.option_id, outcome: one_of ? o.option_id === winnerId : checked.has(o.option_id) })), notes, userId: null, overwrite: true })`. Disable Update for `one_of` until a winner is chosen. Keep the notes textarea behaviour.

- [ ] **Step 2: Verify + commit** — `git commit -m "feat(props): resolve choice props per option"`

---

### Task 9: Remaining read surfaces — resolved card, score rows, deadline chip, single-prop page

**Files:**
- Modify: `components/landing/resolved-prop-card.tsx`, `components/landing/recently-resolved.tsx`, `app/competitions/[competitionId]/scores/user/[userId]/components/score-table-parts.tsx` (+ `forecast-scores-table.fixtures.ts`, `.stories.tsx`), `components/competition-dashboard/upcoming-deadlines.tsx` (+ `.stories.tsx`), `app/props/[propId]/page.tsx`
- Create: `app/props/[propId]/prop-options-table.tsx`, `app/props/[propId]/prop-options-table.stories.tsx`

- [ ] **Step 1: `ResolvedPropCard`**

Props become `{ propId; propText; propNotes; kind: PropKind; forecast: number | null; resolution: boolean | null; realized: { text: string; userForecast: number }[]; resolutionDate: Date }`. Binary rendering unchanged. Choice: the "Resolved" block shows the realized labels as `success-muted` pills (max two, then `+n more`; "None" pill in `bg-secondary` when empty); the "You said" block shows, for `one_of`, `Math.round(realized[0].userForecast*100)%` and for `any_of` the count `${realized.length} of ${optionCount}`— pass `optionCount: number` too. In `recently-resolved.tsx` drop the stage-one binary filter and map `realized = f.options.filter(o => o.outcome).map(o => ({ text: o.text, userForecast: o.user_forecast ?? 0 }))`. Add a story if `resolved-prop-card` has none (it is a leaf).

- [ ] **Step 2: Score rows** — in `score-table-parts.tsx`: Forecast column → binary: existing; `one_of`: the `userForecast` of the option with `outcome === true` as `xx.x%`; `any_of`: `—`. Resolution column → binary: existing Yes/No; choice: realized labels joined with ", " (`None` when empty), `truncate` with `title`. Update fixtures with one `one_of` and one `any_of` row and add them to the story.

- [ ] **Step 3: Deadline chip** — in `UpcomingPropRow`: when `prop.kind !== "binary"`, render `hasUserForecast ? <Check className="h-4 w-4" /> : "—"` in the chip with `bg-success-muted text-success-muted-foreground` when forecasted and the existing null colours otherwise. Update the story fixtures.

- [ ] **Step 4: Single-prop page** — create `PropOptionsTable({ kind, options, resolved }: { kind: ChoiceKind; options: PropOptionSummary[]; resolved: boolean })`: a bordered card with kicker header "Options", rows = label, community average (`avg`), your forecast (`you`), and when `resolved` a Check/X outcome cell; mono tabular numerics; story `Props/PropOptionsTable`. In `page.tsx`, when `isChoiceKind(prop.prop_kind)`: render `PropPageHeader`, then `<PropOptionsTable kind options={prop.options} resolved={prop.resolution_id !== null} />`, then a `text-sm text-muted-foreground` line `${forecasts.length} forecasters`; skip `PropStatsRow`, the distribution chart and `ForecastsList` (binary-only graphics, see spec §4.4). Binary path unchanged.

- [ ] **Step 5: Verify** `npx tsc --noEmit && npm run lint && npm run test && npm run build-storybook`

- [ ] **Step 6: Commit** — `git commit -m "feat(props): choice-aware resolved card, score rows, deadlines, prop page"`

---

### Task 10: RLS behaviour tests through a non-owner role

Stage one's final review found that every container test runs as the container's superuser, which owns the tables, so the six new row-level-security policies on `prop_options`, `forecast_options` and `resolution_options` are bypassed in tests and only their *presence* is asserted. This task must land before this PR merges, because stage two is what lets choice data exist.

**Files:**
- Modify: `tests/globalSetup.ts` (after `migrateToLatest()` succeeds), `tests/helpers/testDatabase.ts`
- Create: `tests/integration/choice-props-rls.integration.test.ts`

**Interfaces:**
- Produces: `getRlsTestDb(): Promise<Kysely<Database>>` in `tests/helpers/testDatabase.ts` — a second singleton connected as the non-owner role `app_user`; and `asUser<T>(db, userId: number | null, fn: (trx) => Promise<T>)` in the same file, which opens a transaction and runs `SELECT set_config('app.current_user_id', <id or ''>, true)` exactly like `withRLS` in `lib/db-helpers.ts` before calling `fn`.

- [ ] **Step 1: Create the role in global setup**

After migrations succeed in `tests/globalSetup.ts`, run (via `sql\`…\`.execute(globalDb)`):

```sql
CREATE ROLE app_user LOGIN PASSWORD 'app_password';
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

Export `TEST_RLS_DATABASE_URL` alongside `TEST_DATABASE_URL`, built from the container's host/port/database with user `app_user` and password `app_password`. (The tables stay owned by `test_user`, so `app_user` is subject to RLS; the helper functions are `SECURITY DEFINER` and executable by PUBLIC by default.)

- [ ] **Step 2: `getRlsTestDb` and `asUser`** in `tests/helpers/testDatabase.ts`, mirroring `getTestDb`'s singleton pattern with `TEST_RLS_DATABASE_URL`.

- [ ] **Step 3: Write the tests** — `tests/integration/choice-props-rls.integration.test.ts`, using the superuser `factory` to seed and `getRlsTestDb()` + `asUser` to read/write:

```ts
ifRunningContainerTestsIt("a private-competition non-member sees no options", async () => {
  const admin = await factory.createUser();
  const member = await factory.createUser();
  const stranger = await factory.createUser();
  const competition = await factory.createCompetition({ is_private: true, forecasts_open_date: null, forecasts_close_date: null, end_date: null });
  // add admin (role admin) and member (role forecaster) via competition_members inserts, tracked
  const { prop } = await factory.createChoiceProp("one_of", ["A", "B"], { competition_id: competition.id, category_id: null });
  const rls = await getRlsTestDb();
  const seenByStranger = await asUser(rls, stranger.id, (trx) => trx.selectFrom("prop_options").selectAll().where("prop_id", "=", prop.id).execute());
  expect(seenByStranger).toHaveLength(0);
  const seenByMember = await asUser(rls, member.id, (trx) => trx.selectFrom("prop_options").selectAll().where("prop_id", "=", prop.id).execute());
  expect(seenByMember).toHaveLength(2);
});

ifRunningContainerTestsIt("a user cannot write forecast_options onto another user's forecast", async () => {
  // seed: public choice prop, user A's choice forecast via factory
  // as user B: INSERT INTO forecast_options (forecast_id = A's, prop_id, option_id, probability) → rejects with an RLS violation
  // as user B: UPDATE forecast_options SET probability = 1 WHERE forecast_id = A's → 0 rows updated, A's values unchanged
});

ifRunningContainerTestsIt("members of a private competition can read each other's forecast_options; strangers cannot", async () => { /* mirrors view_forecasts */ });

ifRunningContainerTestsIt("a non-admin member cannot write resolution_options; a competition admin can", async () => {
  // as member: INSERT INTO resolutions (prop_id, resolution NULL) → RLS violation
  // as competition admin: insert resolutions header + resolution_options → succeeds; read back
});
```

Fill each body fully (no placeholders left): seed with the superuser factory, act through `asUser`, assert both the RLS outcome and that the superuser-visible state is unchanged where relevant. Check `migrations/1769364781813_private_competitions_schema.ts` for the private-competition check constraints (private competitions must have null dates) and the `enforce_private_competition_members` trigger before writing the seeding code.

- [ ] **Step 4: Run** `TEST_USE_CONTAINERS=true npx vitest run tests/integration/choice-props-rls.integration.test.ts` — PASS; `npx vitest run` — skips; `npx tsc --noEmit && npm run lint && npm run test`.

- [ ] **Step 5: Commit** — `git commit -m "test(db): exercise choice-prop RLS policies through a non-owner role"`

---

### Task 11: Final verification and PR

- [ ] **Step 1:** `npx tsc --noEmit && npm run lint && npm run test && npm run build-storybook && npm run build` (build needs the dummy env from `.github/workflows/pr-checks.yml`: `DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy IDP_BASE_URL=http://dummy IDP_PUBLIC_URL=http://dummy NODE_ENV=production npm run build`).
- [ ] **Step 2:** `grep -rn "resolution !== null\|resolution === null" app components` — every remaining hit must be a genuine Yes/No render.
- [ ] **Step 3:** Push and open the PR against the stage-one branch:

```bash
git push -u origin choice-props-ui
gh pr create --base choice-props --title "Choice props: create, forecast, resolve and display (stage two)" --body-file - <<'EOF'
## Summary

Stage two of choice props: the UI. Admins pick a type (Yes / No, Pick one, Any that apply) and list options when creating a prop; forecasters enter a probability per option (pick-one must total 100%); resolution is per option; cards, the prop page, the recently-resolved panel, score tables and the deadline list all render choice props. Analytics graphics (bold takes, certainty, consensus, distribution chart, calibration) remain binary-only by design.

Design: `docs/superpowers/specs/2026-09-01-choice-props-design.md` §4. Stacked on #<stage-one PR>; retarget to `main` once that merges.

## Try it in a preview

1. Admin → create a competition prop, type "Pick one", four options.
2. Forecast it from the card (running total) and from the prop page.
3. Resolve it from the prop page; check the card, recently-resolved panel and the score breakdown.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01BqHhYaxchKxPy6gJahfQbg
EOF
```
