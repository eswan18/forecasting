"use client";

import { useMemo } from "react";
import { VForecast } from "@/types/db_types";
import {
  computeKDE,
  calculateBandwidth,
} from "@/lib/kernel-density-estimation";

// Helper to get color based on probability
const getProbColor = (prob: number) => {
  if (prob <= 0.2) return "bg-red-500";
  if (prob <= 0.4) return "bg-orange-500";
  if (prob <= 0.6) return "bg-yellow-500";
  if (prob <= 0.8) return "bg-lime-500";
  return "bg-green-500";
};

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
  const maxDensity = kdeData
    ? Math.max(...kdeData.map((d) => d.density))
    : 1;

  if (forecasts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-medium text-foreground mb-4">
          Forecast Distribution
        </h3>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          No forecasts available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h3 className="font-medium text-foreground mb-4">Forecast Distribution</h3>

      {/* Histogram with optional KDE overlay */}
      <div className="relative">
        {/* Bars */}
        <div className="flex items-end gap-1 h-32 mb-2 relative">
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
                className="flex-1 flex flex-col items-center justify-end h-full"
              >
                <div
                  className={`w-full rounded-t transition-all ${
                    isUserBucket ? "bg-blue-500" : "bg-muted-foreground/30"
                  }`}
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
              className="absolute inset-0 w-full h-full pointer-events-none"
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
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
        </div>

        {/* X-axis */}
        <div className="flex justify-between text-xs text-muted-foreground mb-4">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>

        {/* Marker bar showing you vs avg */}
        {(userForecast !== null || average !== null) && (
          <div className="relative h-8 bg-muted rounded-lg">
            {/* Your position */}
            {userForecast !== null && (
              <div
                className="absolute top-0 bottom-0 flex flex-col items-center justify-center"
                style={{
                  left: `${userForecast * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div
                  className={`w-4 h-4 rounded-full ${getProbColor(userForecast)} border-2 border-background shadow`}
                />
                <div className="absolute -bottom-5 text-xs font-medium text-foreground whitespace-nowrap">
                  you
                </div>
              </div>
            )}

            {/* Average position */}
            {average !== null && (
              <div
                className="absolute top-0 bottom-0 flex flex-col items-center justify-center"
                style={{
                  left: `${average * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div
                  className="w-0 h-0 border-l-4 border-r-4 border-transparent"
                  style={{
                    borderTopWidth: "8px",
                    borderTopColor: "hsl(var(--muted-foreground))",
                  }}
                />
                <div className="absolute -bottom-5 text-xs text-muted-foreground whitespace-nowrap">
                  avg
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
