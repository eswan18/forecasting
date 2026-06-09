"use client";

// EXPERIMENTAL — throwaway mockups for folding the ForecastNeedle into the
// *editable* forecast card. The slider stays the editor; these explore where
// the needle (live preview + community-average ghost) sits relative to it.
// Local state only — saving is faked. Deleted once a direction is chosen.

import { useState } from "react";
import { PropWithUserForecast } from "@/types/db_types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PropStatusBadge } from "@/components/ui/prop-status-badge";
import { getPropStatusFromProp } from "@/lib/prop-status";
import { MarkdownRenderer } from "@/components/markdown";
import { ForecastNeedle } from "@/components/ui/forecast-needle";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

interface VariantProps {
  prop: PropWithUserForecast;
  showCommunityAvg: boolean;
}

const cardBase = "rounded-lg border bg-card p-5 transition-all";

function baselineOf(prop: PropWithUserForecast, showCommunityAvg: boolean) {
  return showCommunityAvg && prop.community_average != null
    ? prop.community_average
    : undefined;
}

function MetaRow({ prop }: { prop: PropWithUserForecast }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <Badge variant="secondary" className="text-xs font-medium">
        {prop.category_name}
      </Badge>
      <PropStatusBadge status={getPropStatusFromProp(prop)} />
    </div>
  );
}

function PropText({ prop }: { prop: PropWithUserForecast }) {
  return (
    <div className="flex w-fit items-center gap-5">
      <div className="min-w-0">
        <h3 className="font-medium leading-snug text-foreground">
          <MarkdownRenderer>{prop.prop_text}</MarkdownRenderer>
        </h3>
        <p className="text-sm text-muted-foreground">
          {prop.prop_notes || " "}
        </p>
      </div>
      <button
        type="button"
        title="Edit prop (mock)"
        aria-label="Edit prop"
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <Pencil className="h-5 w-5" />
      </button>
    </div>
  );
}

function SaveCancel({ show, onCancel }: { show: boolean; onCancel: () => void }) {
  if (!show) return null;
  return (
    <div className="mt-3 flex items-center gap-2">
      <Button size="sm" className="px-3" title="(mock — does not save)">
        Save forecast
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

// Raw number entry: type a percentage (0–100). Commits on Enter/blur, Escape
// reverts. While unfocused it mirrors the slider; while focused it holds a draft.
function PercentInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const formatted = value == null ? "" : String(Math.round(value * 100));
  const display = editing ? draft : formatted;

  const commit = () => {
    setEditing(false);
    const n = Number(draft);
    if (draft.trim() === "" || Number.isNaN(n)) return;
    onChange(Math.max(0, Math.min(100, Math.round(n))) / 100);
  };

  return (
    <label className="inline-flex items-center rounded-md border border-input bg-background px-2 py-1 focus-within:ring-2 focus-within:ring-ring/40">
      <input
        value={display}
        inputMode="numeric"
        placeholder="––"
        aria-label="Forecast percentage"
        onFocus={() => {
          setDraft(formatted);
          setEditing(true);
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            setEditing(false);
            e.currentTarget.blur();
          }
        }}
        className="w-10 bg-transparent text-right text-lg font-bold leading-none text-foreground outline-none"
      />
      <span className="text-lg font-bold leading-none text-foreground">%</span>
    </label>
  );
}

function NeedleColumn({
  value,
  baseline,
  onChange,
  className,
}: {
  value: number | null;
  baseline: number | undefined;
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center gap-1.5",
        className,
      )}
    >
      {value != null ? (
        <>
          <ForecastNeedle
            forecast={value}
            baseline={baseline}
            size="sm"
            showAxisLabels={false}
          />
          <PercentInput value={value} onChange={onChange} />
          {baseline != null && (
            <div className="text-xs text-muted-foreground">
              Average: {Math.round(baseline * 100)}%
            </div>
          )}
        </>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">No forecast yet</div>
          <PercentInput value={null} onChange={onChange} />
        </>
      )}
    </div>
  );
}

function useLocalForecast(prop: PropWithUserForecast) {
  const [value, setValue] = useState<number | null>(prop.user_forecast);
  const hasChanges = value !== prop.user_forecast;
  const reset = () => setValue(prop.user_forecast);
  return { value, setValue, hasChanges, reset };
}

function changeRing(hasChanges: boolean) {
  return hasChanges
    ? "border-blue-300 ring-2 ring-blue-100"
    : "border-border hover:border-muted-foreground/30";
}

// Needle on the right (matching the display ForecastCard); the number box under
// it is the input. Viewing and editing keep the needle in the same place.
export function EditableNeedleRight({ prop, showCommunityAvg }: VariantProps) {
  const { value, setValue, hasChanges, reset } = useLocalForecast(prop);
  const baseline = baselineOf(prop, showCommunityAvg);
  return (
    <div className={cn(cardBase, changeRing(hasChanges))}>
      <div className="flex items-stretch gap-4">
        <div className="min-w-0 flex-1">
          <MetaRow prop={prop} />
          <PropText prop={prop} />
          <SaveCancel show={hasChanges} onCancel={reset} />
        </div>
        <NeedleColumn
          value={value}
          baseline={baseline}
          onChange={setValue}
          className="w-[150px]"
        />
      </div>
    </div>
  );
}
