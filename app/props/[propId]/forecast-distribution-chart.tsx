"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { VForecast } from "@/types/db_types";
import {
  computeKDE,
  calculateBandwidth,
} from "@/lib/kernel-density-estimation";

interface ForecastDistributionChartProps {
  forecasts: VForecast[];
  userForecast: number | null;
  average: number | null;
}

// Generate histogram data (10 buckets: 0-10%, 10-20%, etc.)
const generateHistogram = (forecasts: VForecast[]) => {
  const buckets = Array(10).fill(0);
  forecasts.forEach((f) => {
    const bucketIndex = Math.min(Math.floor(f.forecast * 10), 9);
    buckets[bucketIndex]++;
  });
  return buckets;
};

function ChartShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <h3 className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Forecast Distribution
      </h3>
      {children}
    </div>
  );
}

export default function ForecastDistributionChart({
  forecasts,
  userForecast,
  average,
}: ForecastDistributionChartProps) {
  const histogram = useMemo(() => generateHistogram(forecasts), [forecasts]);
  const maxCount = Math.max(...histogram);

  // Compute KDE for overlay if we have enough forecasts
  const kdeData = useMemo(() => {
    if (forecasts.length < 2) return null;
    const forecastValues = forecasts.map((f) => f.forecast);
    const bandwidth = calculateBandwidth(forecastValues);
    return computeKDE(forecastValues, bandwidth);
  }, [forecasts]);

  // Find max KDE density for scaling
  const maxDensity = kdeData ? Math.max(...kdeData.map((d) => d.density)) : 1;

  if (forecasts.length === 0) {
    return (
      <ChartShell>
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No forecasts available
        </div>
      </ChartShell>
    );
  }

  return (
    <ChartShell>
      {/* Histogram with optional KDE overlay */}
      <div className="relative">
        {/* Bars */}
        <div className="relative mb-2 flex h-32 items-end gap-1">
          {histogram.map((count, i) => {
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const bucketStart = i * 10;
            const bucketEnd = (i + 1) * 10;
            const isUserBucket =
              userForecast !== null &&
              userForecast * 100 >= bucketStart &&
              userForecast * 100 < bucketEnd;

            return (
              <div
                key={i}
                className="flex h-full flex-1 flex-col items-center justify-end"
              >
                <div
                  className={cn(
                    "w-full rounded-t transition-all",
                    isUserBucket ? "bg-primary" : "bg-muted-foreground/25",
                  )}
                  style={{
                    height: `${height}%`,
                    minHeight: count > 0 ? "4px" : "0",
                  }}
                />
              </div>
            );
          })}

          {/* KDE curve overlay */}
          {kdeData && kdeData.length > 0 && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d={`M ${kdeData
                  .map((d, i) => {
                    const x = d.probability * 100;
                    const y = 100 - (d.density / maxDensity) * 100;
                    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  })
                  .join(" ")}`}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
        </div>

        {/* X-axis */}
        <div className="mb-4 flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>

        {/* Marker bar showing you vs avg */}
        {(userForecast !== null || average !== null) && (
          <div className="relative h-8 rounded-lg bg-muted">
            {/* Your position */}
            {userForecast !== null && (
              <div
                className="absolute bottom-0 top-0 flex flex-col items-center justify-center"
                style={{
                  left: `${userForecast * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div className="h-4 w-4 rounded-full border-2 border-background bg-primary shadow" />
                <div className="absolute -bottom-5 whitespace-nowrap text-xs font-medium text-foreground">
                  you
                </div>
              </div>
            )}

            {/* Average position */}
            {average !== null && (
              <div
                className="absolute bottom-0 top-0 flex flex-col items-center justify-center"
                style={{
                  left: `${average * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div
                  className="h-0 w-0 border-l-4 border-r-4 border-transparent"
                  style={{
                    borderTopWidth: "8px",
                    borderTopColor: "var(--muted-foreground)",
                  }}
                />
                <div className="absolute -bottom-5 whitespace-nowrap text-xs text-muted-foreground">
                  avg
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ChartShell>
  );
}
