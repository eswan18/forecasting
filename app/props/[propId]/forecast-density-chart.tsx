"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { VForecast } from "@/types/db_types";
import {
  computeKDE,
  calculateBandwidth,
  createSinglePointPeak,
} from "@/lib/kernel-density-estimation";

interface ForecastDensityChartProps {
  forecasts: VForecast[];
}

export default function ForecastDensityChart({
  forecasts,
}: ForecastDensityChartProps) {
  const { chartData } = useMemo(() => {
    if (forecasts.length === 0) return { chartData: [], domain: [0, 1] };

    const forecastValues = forecasts.map((f) => f.forecast);

    // Special case for single forecast - create a narrow peak
    if (forecasts.length === 1) {
      return {
        chartData: createSinglePointPeak(forecastValues[0]),
        domain: [0, 1],
      };
    }

    const bandwidth = calculateBandwidth(forecastValues);
    const data = computeKDE(forecastValues, bandwidth);

    return {
      chartData: data,
      domain: [0, 1],
    };
  }, [forecasts]);

  if (forecasts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No forecasts available for density chart
      </div>
    );
  }

  return (
    <ChartContainer
      config={{
        probability: {
          label: "Probability",
        },
        density: {
          label: "Density",
        },
      }}
      className="w-full h-[24rem]"
    >
      <LineChart data={chartData} accessibilityLayer>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="probability"
          domain={[0, 1]}
          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          ticks={[0, 0.25, 0.5, 0.75, 1]}
          type="number"
        />
        <YAxis dataKey="density" tickFormatter={(value) => value.toFixed(2)} />
        <Line
          type="monotone"
          dataKey="density"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={false}
          name="Density"
        />
      </LineChart>
    </ChartContainer>
  );
}
