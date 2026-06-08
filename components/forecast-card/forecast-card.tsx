"use client";

import { PropWithUserForecast } from "@/types/db_types";
import { Badge } from "@/components/ui/badge";
import { PropStatusBadge } from "@/components/ui/prop-status-badge";
import { getPropStatusFromProp } from "@/lib/prop-status";
import { MarkdownRenderer } from "@/components/markdown";
import { ForecastNeedle } from "@/components/ui/forecast-needle";
import Link from "next/link";

interface ForecastCardProps {
  prop: PropWithUserForecast;
  showCommunityAvg: boolean;
}

export function ForecastCard({ prop, showCommunityAvg }: ForecastCardProps) {
  const forecast = prop.user_forecast;
  const baseline =
    showCommunityAvg && prop.community_average != null
      ? prop.community_average
      : undefined;

  return (
    <Link
      href={`/props/${prop.prop_id}`}
      className="block bg-card rounded-lg border border-border p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-stretch gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2.5 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-medium">
              {prop.category_name}
            </Badge>
            <PropStatusBadge status={getPropStatusFromProp(prop)} />
          </div>
          <h3 className="font-medium text-foreground leading-snug">
            <MarkdownRenderer>{prop.prop_text}</MarkdownRenderer>
          </h3>
          <p className="text-sm text-muted-foreground truncate h-5">
            {prop.prop_notes || " "}
          </p>
        </div>

        {/* Forecast needle: the user's forecast, with the community average as
            a muted "ghost" needle and a small readout below. */}
        <div className="flex w-[150px] shrink-0 flex-col items-center justify-center">
          {forecast != null ? (
            <>
              <ForecastNeedle
                forecast={forecast}
                baseline={baseline}
                size="sm"
                showAxisLabels={false}
              />
              <div className="-mt-1 text-lg font-bold tabular-nums text-foreground">
                {Math.round(forecast * 100)}%
              </div>
              {baseline != null && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Average: {Math.round(baseline * 100)}%
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No forecast yet</div>
          )}
        </div>
      </div>
    </Link>
  );
}
