"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { cn, focusRing } from "@/lib/utils";
import type { UpcomingDeadline } from "@/lib/db_actions/competition-stats";
import { getBrowserTimezone } from "@/hooks/getBrowserTimezone";
import { formatDate } from "@/lib/time-utils";
import { getProbabilityColors } from "@/lib/forecast-colors";

interface DeadlineDisplay {
  text: string;
  relative: string | null;
  urgent: boolean;
}

function formatDeadline(date: Date, timezone: string): DeadlineDisplay {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formatted = formatDate(date, timezone);

  if (diffDays <= 0) {
    return { text: formatted, relative: "Overdue", urgent: true };
  }
  if (diffDays === 1) {
    return { text: formatted, relative: "Tomorrow", urgent: false };
  }
  if (diffDays <= 7) {
    return { text: formatted, relative: `${diffDays} days`, urgent: false };
  }
  return { text: formatted, relative: null, urgent: false };
}

interface UpcomingPropRowProps {
  prop: UpcomingDeadline;
  competitionId: number;
  timezone: string;
}

const chipClass =
  "flex h-10 w-12 shrink-0 items-center justify-center rounded font-mono text-sm font-semibold tabular-nums";

/** The forecast-status chip: a heatmap cell for a binary prop, a check for a
 * choice prop, whose ballot of probabilities has no single number to show. */
function ForecastChip({ prop }: { prop: UpcomingDeadline }) {
  if (prop.kind !== "binary") {
    // Unforecasted choice props share the binary "no forecast" colours.
    const colors = getProbabilityColors(null);
    return (
      <div
        className={cn(
          chipClass,
          prop.hasUserForecast
            ? "bg-success-muted text-success-muted-foreground"
            : [colors.bg, colors.text],
        )}
      >
        {prop.hasUserForecast ? (
          <Check role="img" aria-label="Forecasted" className="h-4 w-4" />
        ) : (
          "—"
        )}
      </div>
    );
  }

  const colors = getProbabilityColors(prop.userForecast);
  return (
    <div className={cn(chipClass, colors.bg, colors.text)}>
      {prop.userForecast !== null
        ? `${Math.round(prop.userForecast * 100)}%`
        : "—"}
    </div>
  );
}

function UpcomingPropRow({ prop, competitionId, timezone }: UpcomingPropRowProps) {
  const deadline = formatDeadline(prop.deadline, timezone);

  return (
    <Link
      href={`/competitions/${competitionId}/props/${prop.propId}`}
      className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
    >
      {/* Forecast status indicator */}
      <ForecastChip prop={prop} />

      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {prop.propText}
        </div>
        <div className="text-xs text-muted-foreground">
          Due {deadline.text}
          {deadline.relative && (
            <span
              className={cn(
                "ml-1",
                deadline.urgent ? "text-destructive" : "text-muted-foreground",
              )}
            >
              · {deadline.relative}
            </span>
          )}
        </div>
      </div>

      {/* Action hint */}
      <div className="shrink-0">
        {!prop.hasUserForecast ? (
          <span className="text-xs text-primary font-medium">Forecast →</span>
        ) : (
          <span className="text-xs text-muted-foreground">Edit →</span>
        )}
      </div>
    </Link>
  );
}

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
  competitionId: number;
  onViewAll?: () => void;
}

export function UpcomingDeadlines({
  deadlines,
  competitionId,
  onViewAll,
}: UpcomingDeadlinesProps) {
  const timezone = getBrowserTimezone();

  if (deadlines.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Upcoming Deadlines
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          No upcoming deadlines. All props are either past their deadline or
          fully forecasted.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-2">
      <div className="flex items-center justify-between px-3 pb-2 pt-1.5">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Upcoming Deadlines
        </span>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className={cn(
              "rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
              focusRing,
            )}
          >
            View all →
          </button>
        )}
      </div>
      <div className="flex flex-col">
        {deadlines.map((prop) => (
          <UpcomingPropRow
            key={prop.propId}
            prop={prop}
            competitionId={competitionId}
            timezone={timezone}
          />
        ))}
      </div>
    </div>
  );
}
