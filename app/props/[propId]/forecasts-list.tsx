"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { VForecast } from "@/types/db_types";

type SortOrder = "asc" | "desc";

// Helper to get color based on probability
const getProbColor = (prob: number) => {
  if (prob <= 0.2) return { dot: "bg-red-500", bar: "bg-red-400" };
  if (prob <= 0.4) return { dot: "bg-orange-500", bar: "bg-orange-400" };
  if (prob <= 0.6) return { dot: "bg-yellow-500", bar: "bg-yellow-500" };
  if (prob <= 0.8) return { dot: "bg-lime-500", bar: "bg-lime-500" };
  return { dot: "bg-green-500", bar: "bg-green-500" };
};

interface ForecastRowProps {
  forecast: VForecast;
  rank: number;
  isCurrentUser: boolean;
}

function ForecastRow({ forecast, rank, isCurrentUser }: ForecastRowProps) {
  const colors = getProbColor(forecast.forecast);
  const percent = Math.round(forecast.forecast * 100);

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg ${
        isCurrentUser
          ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
          : "hover:bg-muted/50"
      }`}
    >
      {/* Rank */}
      <div className="w-8 text-sm text-muted-foreground text-center shrink-0">
        {rank}
      </div>

      {/* Color dot + name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-3 h-3 rounded-full ${colors.dot} shrink-0`} />
        <span
          className={`truncate ${
            isCurrentUser ? "font-medium text-blue-900 dark:text-blue-100" : "text-foreground"
          }`}
        >
          {forecast.user_name}
          {isCurrentUser && (
            <span className="text-blue-600 dark:text-blue-400 ml-1">(you)</span>
          )}
        </span>
      </div>

      {/* Mini bar */}
      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden shrink-0 hidden sm:block">
        <div
          className={`h-full rounded-full ${colors.bar} opacity-60`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Percentage */}
      <div
        className={`w-16 text-right font-mono text-sm shrink-0 ${
          isCurrentUser ? "text-blue-900 dark:text-blue-100 font-medium" : "text-foreground"
        }`}
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
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground">
          All Forecasts ({forecasts.length})
        </h3>
        <button
          onClick={() => setSortOrder((s) => (s === "desc" ? "asc" : "desc"))}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              sortOrder === "asc" ? "rotate-180" : ""
            }`}
          />
          {sortOrder === "desc" ? "High to Low" : "Low to High"}
        </button>
      </div>

      {forecasts.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No forecasts have been made for this prop yet.
        </p>
      ) : (
        <div className="space-y-1">
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
    </div>
  );
}
