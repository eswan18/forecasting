import { Check, X } from "lucide-react";
import Link from "next/link";
import { LocalDate } from "@/components/local-date";
import type { PropKind } from "@/lib/prop-kind";
import { cn, focusRing } from "@/lib/utils";

/** An option that resolved true, with the probability the user gave it. */
export interface RealizedOption {
  text: string;
  userForecast: number;
}

interface ResolvedPropCardProps {
  propId: number;
  propText: string;
  propNotes: string | null;
  kind: PropKind;
  /** The user's probability on a binary prop; null on a choice prop. */
  forecast: number | null;
  /** The yes/no outcome of a binary prop; null on a choice prop. */
  resolution: boolean | null;
  /** The options that resolved true; empty for a binary prop. */
  realized: RealizedOption[];
  /** How many options the prop has; 0 for a binary prop. */
  optionCount: number;
  resolutionDate: Date;
}

const pillClass =
  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium";

/** How many realized labels fit before the rest collapse into "+n more". */
const MAX_REALIZED_PILLS = 2;

/** The yes/no pill of a binary prop. */
function BinaryOutcome({ resolution }: { resolution: boolean | null }) {
  // A resolved binary prop always carries a yes/no; the dash is a defensive
  // fallback so a half-written resolution can't blank the card.
  if (resolution === null) {
    return (
      <span className={cn(pillClass, "bg-secondary text-secondary-foreground")}>
        —
      </span>
    );
  }
  return (
    <span
      className={cn(
        pillClass,
        resolution
          ? "bg-success-muted text-success-muted-foreground"
          : "bg-destructive-muted text-destructive-muted-foreground",
      )}
    >
      {resolution ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {resolution ? "Yes" : "No"}
    </span>
  );
}

/** The realized options of a choice prop, capped so the card stays compact. */
function ChoiceOutcome({ realized }: { realized: RealizedOption[] }) {
  if (realized.length === 0) {
    return (
      <span className={cn(pillClass, "bg-secondary text-secondary-foreground")}>
        None
      </span>
    );
  }
  const shown = realized.slice(0, MAX_REALIZED_PILLS);
  const hidden = realized.length - shown.length;
  return (
    <>
      {shown.map((option) => (
        <span
          key={option.text}
          title={option.text}
          className={cn(
            pillClass,
            "max-w-[8rem] bg-success-muted text-success-muted-foreground",
          )}
        >
          <Check className="h-3 w-3 shrink-0" />
          <span className="truncate">{option.text}</span>
        </span>
      ))}
      {hidden > 0 && (
        <span className="shrink-0 text-xs text-muted-foreground">
          +{hidden} more
        </span>
      )}
    </>
  );
}

/**
 * What the card reminds the user they said: their probability on a binary prop,
 * the probability they gave the winner on a `one_of` prop, and — since no single
 * number stands in for a whole `any_of` ballot — how many options landed.
 */
function youSaid({
  kind,
  forecast,
  realized,
  optionCount,
}: Pick<
  ResolvedPropCardProps,
  "kind" | "forecast" | "realized" | "optionCount"
>): string {
  switch (kind) {
    case "binary":
      return forecast === null ? "—" : forecast.toFixed(2);
    case "one_of":
      return realized.length === 0
        ? "—"
        : `${Math.round(realized[0].userForecast * 100)}%`;
    case "any_of":
      return `${realized.length} of ${optionCount}`;
  }
}

export default function ResolvedPropCard({
  propId,
  propText,
  propNotes,
  kind,
  forecast,
  resolution,
  realized,
  optionCount,
  resolutionDate,
}: ResolvedPropCardProps) {
  return (
    <Link
      href={`/props/${propId}`}
      className={cn(
        "block rounded-lg border bg-card p-4 transition-colors hover:border-foreground/20",
        focusRing,
      )}
    >
      <p
        className="text-sm font-medium leading-snug text-foreground line-clamp-2"
        title={propText}
      >
        {propText}
      </p>
      {propNotes && (
        <p
          className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2"
          title={propNotes}
        >
          {propNotes}
        </p>
      )}

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Resolved
          </div>
          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
            {kind === "binary" ? (
              <BinaryOutcome resolution={resolution} />
            ) : (
              <ChoiceOutcome realized={realized} />
            )}
            <span className="truncate text-xs text-muted-foreground">
              <LocalDate date={resolutionDate} />
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            You said
          </div>
          <div className="mt-1.5 font-mono text-sm font-medium tabular-nums text-foreground">
            {youSaid({ kind, forecast, realized, optionCount })}
          </div>
        </div>
      </div>
    </Link>
  );
}
