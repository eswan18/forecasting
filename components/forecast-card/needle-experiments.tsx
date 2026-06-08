"use client";

// EXPERIMENTAL — throwaway mockups exploring how to fold the ForecastNeedle
// into the forecast card. Once a direction is chosen, the winner gets merged
// into ForecastCard and this file is deleted.

import { PropWithUserForecast } from "@/types/db_types";
import { Badge } from "@/components/ui/badge";
import { PropStatusBadge } from "@/components/ui/prop-status-badge";
import { getPropStatusFromProp } from "@/lib/prop-status";
import { MarkdownRenderer } from "@/components/markdown";
import { ForecastNeedle } from "@/components/ui/forecast-needle";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface VariantProps {
  prop: PropWithUserForecast;
  showCommunityAvg: boolean;
}

const cardClass =
  "bg-card rounded-lg border border-border p-5 hover:shadow-md transition-shadow";

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

function PropText({
  prop,
  centered = false,
}: {
  prop: PropWithUserForecast;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "text-center" : undefined}>
      <h3 className="font-medium text-foreground leading-snug">
        <MarkdownRenderer>{prop.prop_text}</MarkdownRenderer>
      </h3>
      <p className="text-sm text-muted-foreground truncate h-5">
        {prop.prop_notes || " "}
      </p>
    </div>
  );
}

function PercentReadout({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  return (
    <div className={cn("font-bold tabular-nums text-foreground", className)}>
      {value != null ? `${Math.round(value * 100)}%` : "—"}
    </div>
  );
}

function EmptyState({ className }: { className?: string }) {
  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      No forecast yet
    </div>
  );
}

// 1. Needle on the right as a compact summary panel (text on the left).
export function ForecastCardNeedleRight({ prop, showCommunityAvg }: VariantProps) {
  const forecast = prop.user_forecast;
  const baseline = baselineOf(prop, showCommunityAvg);
  return (
    <Link href={`/props/${prop.prop_id}`} className={cn("block", cardClass)}>
      <div className="flex items-stretch gap-4">
        <div className="min-w-0 flex-1">
          <MetaRow prop={prop} />
          <PropText prop={prop} />
        </div>
        <div className="flex w-[150px] shrink-0 flex-col items-center justify-center">
          {forecast != null ? (
            <>
              <ForecastNeedle
                forecast={forecast}
                baseline={baseline}
                size="sm"
                showAxisLabels={false}
              />
              <PercentReadout value={forecast} className="-mt-1 text-lg" />
              {baseline != null && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Average: {Math.round(baseline * 100)}%
                </div>
              )}
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </Link>
  );
}

// 2. Needle as the prominent left "hero" panel, replacing the % box.
export function ForecastCardNeedleHero({ prop, showCommunityAvg }: VariantProps) {
  const forecast = prop.user_forecast;
  const baseline = baselineOf(prop, showCommunityAvg);
  return (
    <div className={cardClass}>
      <div className="flex items-stretch gap-5">
        <div className="flex w-[200px] shrink-0 flex-col items-center justify-center rounded-lg bg-muted/30 py-3">
          {forecast != null ? (
            <>
              <ForecastNeedle
                forecast={forecast}
                baseline={baseline}
                size="md"
              />
              <PercentReadout value={forecast} className="mt-1 text-2xl" />
            </>
          ) : (
            <EmptyState className="px-4 text-center" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <MetaRow prop={prop} />
          <PropText prop={prop} />
        </div>
      </div>
    </div>
  );
}

// 3. Centered tile: badges + prop text on top, needle below.
export function ForecastCardNeedleTile({ prop, showCommunityAvg }: VariantProps) {
  const forecast = prop.user_forecast;
  const baseline = baselineOf(prop, showCommunityAvg);
  return (
    <div className={cardClass}>
      <MetaRow prop={prop} />
      <div className="mt-1">
        <PropText prop={prop} centered />
      </div>
      <div className="mt-3 flex flex-col items-center">
        {forecast != null ? (
          <>
            <ForecastNeedle
              forecast={forecast}
              baseline={baseline}
              size="md"
            />
            <PercentReadout value={forecast} className="mt-1 text-2xl" />
          </>
        ) : (
          <EmptyState className="py-6" />
        )}
      </div>
    </div>
  );
}
