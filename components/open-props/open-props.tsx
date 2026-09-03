"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PropEditDialog } from "@/components/dialogs/prop-edit-dialog";
import { entryTotalPercent } from "@/components/forecast-card/choice-entry";
import { useChoiceForecastEntry } from "@/components/forecast-card/use-choice-forecast-entry";
import { MarkdownRenderer } from "@/components/markdown";
import { axisCss } from "@/components/prop-list/layout-axis";
import { sheetCss } from "@/components/prop-list/sheet";
import { KIND_LABEL, pct } from "@/components/prop-list/types";
import {
  Gauge,
  PercentField,
  Ticks,
  at,
  entryCss,
} from "@/components/prop-sheet/entry";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServerAction } from "@/hooks/use-server-action";
import { createForecast, updateForecast } from "@/lib/db_actions";
import { isChoiceKind } from "@/lib/prop-kind";
import { getPropStatusFromProp } from "@/lib/prop-status";
import type { PropWithUserForecast } from "@/types/db_types";

const ownCss = `
/* The filter row: a search rule and two switches, no boxes. */
.hxp .filters {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 1rem 2rem;
  padding-top: 1.5rem;
}
.hxp .filters .find {
  flex: 1 1 12rem;
  font-family: var(--font-archivo), ui-sans-serif, system-ui, sans-serif;
  font-size: 0.9375rem;
  color: var(--ink);
  background: none;
  border: 0;
  border-bottom: 1px solid var(--rule);
  padding: 0 0 0.375rem;
  outline: none;
}
.hxp .filters .find:focus { border-bottom-color: var(--ink); }
.hxp .filters .find::placeholder { color: var(--ink-faint); }

.hxp .switch {
  display: inline-flex;
  align-items: baseline;
  gap: 1rem;
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.hxp .switch button {
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: var(--ink-faint);
  background: none;
  border: 0;
  border-bottom: 1px solid transparent;
  padding: 0 0 0.25rem;
  cursor: pointer;
  white-space: nowrap;
}
.hxp .switch button:hover { color: var(--ink-muted); }
.hxp .switch button[aria-pressed="true"] {
  color: var(--ink);
  border-bottom-color: var(--ink);
}
/* the category filter is styled in globals.css as .riso-pick */

/* One prop per block: the claim, then the rule it is set on. */
.hxp .entryrow { padding: 1.5rem 0 1rem; border-bottom: 1px solid var(--rule); }
.hxp .entryrow .top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem 1.5rem;
  align-items: baseline;
}
.hxp .entryrow .claim { font-size: 1rem; }
.hxp .entryrow .claim a { color: inherit; text-decoration: none; }
.hxp .entryrow .claim a:hover { color: var(--red-text); }
.hxp .entryrow .notes {
  color: var(--ink-muted);
  font-size: 0.875rem;
  padding-top: 0.25rem;
  max-width: 34rem;
}
.hxp .entryrow .tags {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.625rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-faint);
  white-space: nowrap;
}
.hxp .entryrow .tags .todo { color: var(--red-text); }

.hxp .rule {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 5rem;
  gap: 0 1.5rem;
  align-items: center;
  padding-top: 0.5rem;
}
.hxp .rule .fig { text-align: right; }

/* A choice prop sets one probability per option, and an option's row is built
   exactly like a binary prop's: the name on its own line, then the rule in the
   same column at the same width. A mark's position has to mean the same thing
   in both, and it cannot if one rule starts further right than the other. */
.hxp .optrow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 5rem;
  gap: 0 1.5rem;
  align-items: center;
  padding-top: 0.5rem;
}
.hxp .optrow .opt {
  grid-column: 1 / -1;
  font-size: 0.9375rem;
  color: var(--ink-muted);
}
.hxp .optrow .fig { text-align: right; }
.hxp .optrow .plot { height: 1.25rem; }
.hxp .optrow .plot .axisline { top: 50%; }
.hxp .optrow .plot .grid { top: 25%; bottom: 25%; }
.hxp .optrow .plot .mark {
  position: absolute;
  top: 50%;
  width: 9px;
  height: 9px;
  background: var(--red);
  transform: translate(-50%, -50%);
}
.hxp .total {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  padding-top: 0.75rem;
}
.hxp .total.short .v { color: var(--red-text); }
.hxp .total .v { color: var(--ink); font-weight: 700; }

.hxp .acts { display: flex; gap: 1.25rem; padding-top: 0.875rem; }
.hxp .act {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  background: none;
  border: 0;
  border-bottom: 1px solid color-mix(in oklab, var(--ink) 40%, transparent);
  padding: 0 0 0.25rem;
  cursor: pointer;
  white-space: nowrap;
}
.hxp .act:hover:not(:disabled) { color: var(--red-text); border-bottom-color: var(--red-text); }
.hxp .act:disabled { color: var(--ink-faint); border-bottom-color: transparent; cursor: default; }
.hxp .act.primary { color: var(--ink); font-weight: 700; border-bottom-width: 2px; border-bottom-color: var(--ink); }
.hxp .act.primary:hover:not(:disabled) { color: var(--red-text); border-bottom-color: var(--red-text); }

@media (max-width: 46rem) {
  .hxp .entryrow .top { grid-template-columns: minmax(0, 1fr); }
  .hxp .rule, .hxp .optrow { grid-template-columns: minmax(0, 1fr) 4rem; }
}
`;

type Status = "todo" | "done" | "all";

/** What a settled prop says about itself in the row's tag line. */
const STATUS_WORD: Record<string, string> = {
  unresolved: "Awaiting result",
  "resolved-yes": "Resolved · Yes",
  "resolved-no": "Resolved · No",
  resolved: "Resolved",
  open: "",
};

const STATUSES: { id: Status; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "done", label: "Done" },
  { id: "all", label: "All" },
];

/** One prop, set in place. */
function EntryRow({
  prop,
  currentUserId,
  isAdmin,
  onSaved,
}: {
  prop: PropWithUserForecast;
  currentUserId: number;
  isAdmin: boolean;
  onSaved: () => void;
}) {
  const router = useRouter();
  const isChoice = isChoiceKind(prop.prop_kind);
  const [local, setLocal] = useState<number | null>(prop.user_forecast);
  const [editing, setEditing] = useState(false);
  // A row is only settable while its own deadline holds. The list is filtered
  // to open props on a competition page, but a personal list holds every prop
  // a reader has ever written, and a deadline can pass while the page is open.
  const status = getPropStatusFromProp(prop);
  const open = status === "open";

  const create = useServerAction(createForecast, {
    successMessage: "Forecast recorded",
    onSuccess: onSaved,
  });
  const update = useServerAction(updateForecast, {
    successMessage: "Forecast updated",
    onSuccess: onSaved,
  });
  const choice = useChoiceForecastEntry(prop, { onSaved });
  const choiceTotal = entryTotalPercent(choice.values);

  const saving = create.isLoading || update.isLoading;
  const changed = local !== prop.user_forecast;
  const dirty = isChoice ? choice.hasChanges : changed;
  const busy = isChoice ? choice.isSaving : saving;

  const save = async () => {
    if (local === null) return;
    if (prop.user_forecast_id !== null) {
      await update.execute({
        id: prop.user_forecast_id,
        forecast: { forecast: local },
      });
    } else {
      await create.execute({
        forecast: {
          prop_id: prop.prop_id,
          user_id: currentUserId,
          forecast: local,
        },
      });
    }
  };

  return (
    <div className="entryrow">
      <div className="top">
        <div>
          <span className="claim">
            <Link href={`/props/${prop.prop_id}`}>
              <MarkdownRenderer>{prop.prop_text}</MarkdownRenderer>
            </Link>
          </span>
          {prop.prop_notes && (
            <p className="notes">
              <MarkdownRenderer>{prop.prop_notes}</MarkdownRenderer>
            </p>
          )}
        </div>
        <span className="tags">
          {prop.category_name}
          {isChoice && ` · ${KIND_LABEL[prop.prop_kind]}`}
          {!open && ` · ${STATUS_WORD[status]}`}
          {open && prop.user_forecast_id === null && (
            <span className="todo"> · To do</span>
          )}
        </span>
      </div>

      {isChoice ? (
        <>
          {prop.options.map((option) => {
            const yours = choice.values[option.option_id] ?? null;
            return (
              <div className="optrow" key={option.option_id}>
                <span className="opt">{option.text}</span>
                <span className="plot">
                  <Ticks />
                  {yours !== null && (
                    <span className="mark" style={{ left: at(yours) }} />
                  )}
                </span>
                <span className="fig">
                  <PercentField
                    value={yours}
                    disabled={!open}
                    label={`Your forecast for ${option.text}, percent`}
                    onChange={(v: number) =>
                      choice.setValue(option.option_id, v)
                    }
                  />
                </span>
              </div>
            );
          })}
          {prop.prop_kind === "one_of" && (
            <p className={choiceTotal === 100 ? "total" : "total short"}>
              Must total 100% · <span className="v">{choiceTotal}%</span>
            </p>
          )}
        </>
      ) : (
        <div className="rule">
          <Gauge
            value={local}
            onChange={setLocal}
            disabled={!open}
            crowd={prop.community_average}
            hint="Click the rule to set your forecast"
            label={`Your forecast for: ${prop.prop_text}`}
          />
          <span className="fig">
            <PercentField
              value={local}
              onChange={setLocal}
              disabled={!open}
              label="Your forecast, percent"
            />
          </span>
        </div>
      )}

      {(dirty || isAdmin) && (
        <div className="acts">
          {dirty && (
            <>
              <button
                type="button"
                className="act primary"
                disabled={
                  isChoice
                    ? !choice.canSave || choice.isSaving
                    : saving || local === null
                }
                onClick={isChoice ? choice.save : save}
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="act"
                disabled={busy}
                onClick={
                  isChoice ? choice.cancel : () => setLocal(prop.user_forecast)
                }
              >
                Cancel
              </button>
            </>
          )}
          {isAdmin && (
            <button
              type="button"
              className="act"
              onClick={() => setEditing(true)}
            >
              Edit prop
            </button>
          )}
        </div>
      )}

      {isAdmin && editing && (
        <PropEditDialog
          prop={prop}
          isOpen
          onClose={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/**
 * Every prop still open for forecasting, set in place.
 *
 * The page is the same sheet as the settled lists, except the mark on each
 * rule is yours to move: you forecast straight down the page rather than
 * opening a card per prop. The rule carries the field's average as a hash, so
 * you can see the crowd at the moment you disagree with it.
 */
export function OpenProps({
  props,
  title,
  kicker = "Open props",
  backHref,
  newHref,
  currentUserId,
  isAdmin = false,
  onSaved,
}: {
  props: PropWithUserForecast[];
  /** The masthead: a competition's name, or whose props these are. */
  title: string;
  kicker?: string;
  /** Omit on a list that belongs to no competition — there is nowhere back to. */
  backHref?: string;
  /** Where to write another prop, for the readers allowed to. */
  newHref?: string;
  currentUserId: number;
  isAdmin?: boolean;
  /** Called after any save, so the route can re-fetch. */
  onSaved: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<Status>("todo");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          props
            .map((p) => p.category_name)
            .filter((n): n is string => Boolean(n)),
        ),
      ).sort(),
    [props],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return props.filter((p) => {
      const matchesQuery =
        q === "" ||
        p.prop_text.toLowerCase().includes(q) ||
        (p.prop_notes ?? "").toLowerCase().includes(q);
      const matchesCategory =
        category === "all" || p.category_name === category;
      // `user_forecast_id`, not `user_forecast`: the latter is null for a
      // choice prop even once every option has been answered.
      const matchesStatus =
        status === "all" ||
        (status === "done" && p.user_forecast_id !== null) ||
        (status === "todo" && p.user_forecast_id === null);
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [props, query, category, status]);

  const done = props.filter((p) => p.user_forecast_id !== null).length;
  const left = props.length - done;

  return (
    <div className="hxp">
      <style
        dangerouslySetInnerHTML={{
          __html: sheetCss + axisCss + entryCss + ownCss,
        }}
      />
      <div className="col">
        <header className="masthead">
          <h1>{backHref ? <Link href={backHref}>{title}</Link> : title}</h1>
        </header>

        <h2 className="kicker">
          <span>
            {kicker}
            <span className="aside num">
              {" "}
              ·{" "}
              {left > 0
                ? `${done} of ${props.length} forecast`
                : `all ${props.length} forecast`}
            </span>
          </span>
          <span className="asides">
            {newHref && (
              <Link className="aside" href={newHref}>
                Write a prop →
              </Link>
            )}
            {backHref && (
              <Link className="aside" href={backHref}>
                ← Overview
              </Link>
            )}
          </span>
        </h2>

        <div className="filters">
          <input
            className="find"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search props…"
            aria-label="Search props"
          />
          {categories.length > 1 && (
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="riso-pick" aria-label="Category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="riso-pick-list">
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <span className="switch">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={status === s.id}
                onClick={() => setStatus(s.id)}
              >
                {s.label}
              </button>
            ))}
          </span>
        </div>

        {shown.length === 0 ? (
          <p className="lede">
            {props.length === 0
              ? "There is nothing open to forecast in this competition."
              : "No props match those filters."}
          </p>
        ) : (
          shown.map((prop) => (
            <EntryRow
              key={prop.prop_id}
              prop={prop}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onSaved={onSaved}
            />
          ))
        )}
      </div>
    </div>
  );
}

export { pct };
