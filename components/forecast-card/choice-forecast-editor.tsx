"use client";

import type { ChoiceKind } from "@/lib/prop-kind";
import { cn } from "@/lib/utils";
import type { PropOptionSummary } from "@/types/db_types";

import { type ChoiceEntryValues, entryTotalPercent } from "./choice-entry";
import { PercentInput } from "./percent-input";

interface ChoiceForecastEditorProps {
  kind: ChoiceKind;
  options: PropOptionSummary[];
  /** option_id → probability 0..1, or null when unset. */
  values: ChoiceEntryValues;
  onChange: (optionId: number, value: number) => void;
  disabled?: boolean;
}

function percent(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

/**
 * The values for the options actually on screen, so the running total agrees
 * with the `isEntryComplete` check the parent gates its save button on.
 */
function shownValues(
  options: PropOptionSummary[],
  values: ChoiceEntryValues,
): ChoiceEntryValues {
  const shown: ChoiceEntryValues = {};
  for (const option of options) {
    shown[option.option_id] = values[option.option_id] ?? null;
  }
  return shown;
}

/**
 * Controlled entry for a choice prop: one row per option, plus a running
 * total for `one_of`. Deliberately says nothing about saving — the parent
 * owns the values, the save button and the server action.
 */
export function ChoiceForecastEditor({
  kind,
  options,
  values,
  onChange,
  disabled = false,
}: ChoiceForecastEditorProps) {
  const total = entryTotalPercent(shownValues(options, values));
  const addsUp = total === 100;

  return (
    <div className="divide-y divide-border">
      {options.map((option) => {
        const value = values[option.option_id] ?? null;
        return (
          <div key={option.option_id} className="flex items-center gap-3 py-2">
            <span className="min-w-0 flex-1 text-sm text-foreground">
              {option.text}
            </span>
            {option.community_average != null && (
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                avg {percent(option.community_average)}
              </span>
            )}
            {disabled ? (
              <span className="shrink-0 font-mono text-sm tabular-nums text-foreground">
                {value == null ? "—" : percent(value)}
              </span>
            ) : (
              <PercentInput
                value={value}
                onChange={(v) => onChange(option.option_id, v)}
                ariaLabel={`${option.text} percentage`}
              />
            )}
          </div>
        );
      })}

      {kind === "one_of" && (
        <div className="flex items-center justify-between gap-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Total
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm tabular-nums text-foreground">
              {total}%
            </span>
            <span
              className={cn(
                "font-mono text-xs tabular-nums",
                addsUp ? "text-success-muted-foreground" : "text-destructive",
              )}
            >
              {addsUp
                ? "Adds up"
                : total < 100
                  ? `${100 - total}% remaining`
                  : `${total - 100}% over`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
