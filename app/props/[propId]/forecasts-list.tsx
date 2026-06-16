"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn, focusRing } from "@/lib/utils";
import { getProbabilityColors } from "@/lib/forecast-colors";
import type { VForecast } from "@/types/db_types";

type SortOrder = "asc" | "desc";

interface ForecastRowProps {
  forecast: VForecast;
  rank: number;
  isCurrentUser: boolean;
}

function ForecastRow({ forecast, rank, isCurrentUser }: ForecastRowProps) {
  const colors = getProbabilityColors(forecast.forecast);
  const percent = Math.round(forecast.forecast * 100);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        isCurrentUser
          ? "border-l-2 border-l-primary bg-primary/[0.04]"
          : "hover:bg-muted/40",
      )}
    >
      {/* Rank */}
      <div className="w-7 shrink-0 text-center font-mono text-sm tabular-nums text-muted-foreground">
        {rank}
      </div>

      {/* Name */}
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "truncate text-foreground",
            isCurrentUser ? "font-semibold" : "font-medium",
          )}
        >
          {forecast.user_name}
          {isCurrentUser && (
            <span className="ml-1 text-sm font-normal text-primary">you</span>
          )}
        </span>
      </div>

      {/* Mini bar — the probability hue is a deliberate data encoding */}
      <div className="hidden w-24 items-center sm:flex">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", colors.bar)}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Percentage */}
      <div
        className={cn(
          "w-12 text-right font-mono text-sm tabular-nums",
          isCurrentUser ? "font-semibold text-foreground" : "text-foreground",
        )}
      >
        {percent}%
      </div>
    </div>
  );
}

interface ForecastsListProps {
  forecasts: VForecast[];
  currentUserId: number;
}

export default function ForecastsList({
  forecasts,
  currentUserId,
}: ForecastsListProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Sort forecasts based on current sort order
  const sortedForecasts = [...forecasts].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.forecast - b.forecast;
    } else {
      return b.forecast - a.forecast;
    }
  });

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          All Forecasts ({forecasts.length})
        </span>
        <button
          onClick={() => setSortOrder((s) => (s === "desc" ? "asc" : "desc"))}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            focusRing,
          )}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              sortOrder === "asc" && "rotate-180",
            )}
          />
          {sortOrder === "desc" ? "High to Low" : "Low to High"}
        </button>
      </div>

      {forecasts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No forecasts have been made for this prop yet.
        </p>
      ) : (
        <div className="p-2 sm:p-3">
          {sortedForecasts.map((forecast, i) => (
            <ForecastRow
              key={forecast.forecast_id}
              forecast={forecast}
              rank={i + 1}
              isCurrentUser={forecast.user_id === currentUserId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
