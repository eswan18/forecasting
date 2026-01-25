"use client";

import { PropWithUserForecast } from "@/types/db_types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MarkdownRenderer } from "@/components/markdown";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface ForecastCardProps {
  prop: PropWithUserForecast;
  showCommunityAvg: boolean;
}

// Helper to get color based on probability
const getProbColor = (prob: number) => {
  if (prob <= 0.2)
    return { bg: "bg-red-100", text: "text-red-700", bar: "bg-red-400" };
  if (prob <= 0.4)
    return {
      bg: "bg-orange-100",
      text: "text-orange-700",
      bar: "bg-orange-400",
    };
  if (prob <= 0.6)
    return {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      bar: "bg-yellow-500",
    };
  if (prob <= 0.8)
    return { bg: "bg-lime-100", text: "text-lime-700", bar: "bg-lime-500" };
  return { bg: "bg-green-100", text: "text-green-700", bar: "bg-green-500" };
};

export function ForecastCard({ prop, showCommunityAvg }: ForecastCardProps) {
  const userForecast = prop.user_forecast;
  const communityAvg = showCommunityAvg ? prop.community_average : null;

  // If user hasn't forecasted, show a placeholder
  if (userForecast === null) {
    return (
      <div className="bg-card rounded-lg border border-border p-5 hover:shadow-md transition-shadow">
        <div className="flex items-stretch gap-4">
          <div className="bg-muted text-muted-foreground rounded-lg w-20 flex items-center justify-center shrink-0">
            <div className="text-sm font-medium">--</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-medium">
                  {prop.category_name}
                </Badge>
                {prop.resolution !== null && (
                  <Badge
                    variant={prop.resolution ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {prop.resolution ? "Yes" : "No"}
                  </Badge>
                )}
              </div>
              <Link href={`/props/${prop.prop_id}`}>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <h3 className="font-medium text-foreground leading-snug">
                      <MarkdownRenderer>{prop.prop_text}</MarkdownRenderer>
                    </h3>
                    <p className="text-sm text-muted-foreground truncate h-5 mb-3">
                      {prop.prop_notes || "\u00A0"}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm bg-popover text-popover-foreground border">
                  <div className="space-y-2">
                    <p className="font-medium">{prop.prop_text}</p>
                    {prop.prop_notes && (
                      <p className="text-sm text-muted-foreground">
                        {prop.prop_notes}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    );
  }

  const colors = getProbColor(userForecast);
  const percent = Math.round(userForecast * 100);
  const hasCommunityAvg = communityAvg !== null;
  const communityPercent = hasCommunityAvg
    ? Math.round(communityAvg * 100)
    : null;

  // Check if labels would collide (within ~12% of each other)
  const tooClose =
    hasCommunityAvg &&
    communityPercent !== null &&
    Math.abs(percent - communityPercent) < 12;
  const identical = hasCommunityAvg && percent === communityPercent;
  const youOnLeft =
    hasCommunityAvg && communityPercent !== null && percent < communityPercent;

  return (
    <div className="bg-card rounded-lg border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-stretch gap-4">
        {/* Fixed-width probability box - stretches to match content height */}
        <div
          className={`${colors.bg} ${colors.text} rounded-lg w-20 flex items-center justify-center shrink-0`}
        >
          <div className="text-2xl font-bold">{percent}%</div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">
                {prop.category_name}
              </Badge>
              {prop.resolution !== null && (
                <Badge
                  variant={prop.resolution ? "default" : "destructive"}
                  className="text-xs"
                >
                  {prop.resolution ? "Yes" : "No"}
                </Badge>
              )}
            </div>
            <Link href={`/props/${prop.prop_id}`}>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <h3 className="font-medium text-foreground leading-snug">
                    <MarkdownRenderer>{prop.prop_text}</MarkdownRenderer>
                  </h3>
                  <p className="text-sm text-muted-foreground truncate h-5 mb-3">
                    {prop.prop_notes || "\u00A0"}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm bg-popover text-popover-foreground border">
                <div className="space-y-2">
                  <p className="font-medium">{prop.prop_text}</p>
                  {prop.prop_notes && (
                    <p className="text-sm text-muted-foreground">
                      {prop.prop_notes}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Comparison bar with labels below - only show if community avg exists */}
          {hasCommunityAvg && communityPercent !== null && (
            <div className="relative">
              {/* The bar */}
              <div className="h-2 bg-muted rounded-full relative">
                <div
                  className={`absolute h-2 rounded-full ${colors.bar} opacity-60`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Labels and ticks below the bar */}
              <div className="relative h-6 mt-1">
                {identical ? (
                  /* When identical, show combined label */
                  <div
                    className="absolute flex flex-col items-center"
                    style={{
                      left: `${percent}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="w-px h-2 bg-foreground" />
                    <span className="text-xs text-foreground font-medium">
                      you / avg
                    </span>
                  </div>
                ) : (
                  <>
                    {/* "you" marker */}
                    <div
                      className="absolute flex flex-col items-center"
                      style={{
                        left: `${percent}%`,
                        transform: tooClose
                          ? youOnLeft
                            ? "translateX(-100%)"
                            : "translateX(0%)"
                          : "translateX(-50%)",
                      }}
                    >
                      <div className="w-px h-2 bg-foreground" />
                      <span className="text-xs text-foreground font-medium">
                        you
                      </span>
                    </div>

                    {/* "avg" marker */}
                    <div
                      className="absolute flex flex-col items-center"
                      style={{
                        left: `${communityPercent}%`,
                        transform: tooClose
                          ? youOnLeft
                            ? "translateX(0%)"
                            : "translateX(-100%)"
                          : "translateX(-50%)",
                      }}
                    >
                      <div className="w-px h-2 bg-muted-foreground" />
                      <span className="text-xs text-muted-foreground">avg</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
