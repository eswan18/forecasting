"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { UpcomingDeadline } from "@/lib/db_actions/competition-stats";

interface DeadlineDisplay {
  text: string;
  relative: string | null;
  urgent: boolean;
}

function formatDeadline(date: Date): DeadlineDisplay {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });

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

function getProbColor(prob: number | null): { bg: string; text: string } {
  if (prob === null) {
    return {
      bg: "bg-muted",
      text: "text-muted-foreground",
    };
  }
  if (prob <= 0.2) {
    return {
      bg: "bg-red-100 dark:bg-red-950",
      text: "text-red-700 dark:text-red-400",
    };
  }
  if (prob <= 0.4) {
    return {
      bg: "bg-orange-100 dark:bg-orange-950",
      text: "text-orange-700 dark:text-orange-400",
    };
  }
  if (prob <= 0.6) {
    return {
      bg: "bg-yellow-100 dark:bg-yellow-950",
      text: "text-yellow-700 dark:text-yellow-400",
    };
  }
  if (prob <= 0.8) {
    return {
      bg: "bg-lime-100 dark:bg-lime-950",
      text: "text-lime-700 dark:text-lime-400",
    };
  }
  return {
    bg: "bg-green-100 dark:bg-green-950",
    text: "text-green-700 dark:text-green-400",
  };
}

interface UpcomingPropRowProps {
  prop: UpcomingDeadline;
  competitionId: number;
}

function UpcomingPropRow({ prop, competitionId }: UpcomingPropRowProps) {
  const deadline = formatDeadline(prop.deadline);
  const colors = getProbColor(prop.userForecast);
  const percent =
    prop.userForecast !== null ? Math.round(prop.userForecast * 100) : null;

  return (
    <Link
      href={`/competitions/${competitionId}/props/${prop.propId}`}
      className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
    >
      {/* Forecast status indicator */}
      <div
        className={cn(
          "w-12 h-10 rounded flex items-center justify-center text-sm font-bold shrink-0",
          colors.bg,
          colors.text,
        )}
      >
        {percent !== null ? `${percent}%` : "—"}
      </div>

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
        {percent === null ? (
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
  if (deadlines.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-semibold text-foreground mb-4">
          Upcoming Deadlines
        </h2>
        <p className="text-sm text-muted-foreground">
          No upcoming deadlines. All props are either closed or fully
          forecasted.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground">Upcoming Deadlines</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary hover:text-primary/80"
          >
            View all →
          </button>
        )}
      </div>
      <div className="space-y-1">
        {deadlines.map((prop) => (
          <UpcomingPropRow
            key={prop.propId}
            prop={prop}
            competitionId={competitionId}
          />
        ))}
      </div>
    </div>
  );
}
