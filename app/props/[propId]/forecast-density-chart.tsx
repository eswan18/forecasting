"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { VForecast } from "@/types/db_types";

interface ForecastDensityChartProps {
  forecasts: VForecast[];
}

// Gaussian kernel function
function gaussianKernel(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Kernel density estimator
function kernelDensityEstimator(
  kernel: (x: number) => number,
  bandwidth: number,
  data: number[],
) {
  return function (x: number): number {
    return (
      data.reduce((sum, xi) => sum + kernel((x - xi) / bandwidth), 0) /
      (data.length * bandwidth)
    );
  };
}

// Compute KDE values
function computeKDE(data: number[], bandwidth: number, numPoints = 100) {
  if (data.length === 0) return [];

  // Always use full 0-1 range for consistent visualization
  const step = 1 / (numPoints - 1);
  const kde = kernelDensityEstimator(gaussianKernel, bandwidth, data);

  const density: Array<{
    probability: number;
    density: number;
    percentage: string;
  }> = [];
  for (let i = 0; i < numPoints; i++) {
    const x = i * step;
    density.push({
      probability: x,
      density: kde(x),
      percentage: (x * 100).toFixed(1),
    });
  }

  // Ensure we have exact data points at our desired tick locations
  const tickValues = [0, 0.25, 0.5, 0.75, 1];
  tickValues.forEach((tick) => {
    if (!density.some((d) => Math.abs(d.probability - tick) < 0.001)) {
      density.push({
        probability: tick,
        density: kde(tick),
        percentage: (tick * 100).toFixed(1),
      });
    }
  });

  // Sort by probability to maintain order
  return density.sort((a, b) => a.probability - b.probability);
}

// Calculate optimal bandwidth using Silverman's rule of thumb
function calculateBandwidth(data: number[]): number {
  if (data.length <= 1) return 0.1;

  const n = data.length;
  const mean = data.reduce((sum, x) => sum + x, 0) / n;

  // Use sample variance (n-1) instead of population variance (n)
  const variance =
    data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  // Handle edge case where all values are identical (stdDev = 0)
  if (stdDev === 0) {
    return 0.05; // Use a small fixed bandwidth for identical values
  }

  // Silverman's rule of thumb
  const bandwidth = 1.06 * stdDev * Math.pow(n, -0.2);

  // Ensure bandwidth is not too small or too large for probability data
  return Math.max(0.01, Math.min(0.2, bandwidth));
}

export default function ForecastDensityChart({
  forecasts,
}: ForecastDensityChartProps) {
  const { chartData } = useMemo(() => {
    if (forecasts.length === 0) return { chartData: [], domain: [0, 1] };

    const forecastValues = forecasts.map((f) => f.forecast);

    // Special case for single forecast - create a narrow peak
    if (forecasts.length === 1) {
      const value = forecastValues[0];

      // Create a simple peak around the single value across full range
      const numPoints = 100;
      const step = 1 / (numPoints - 1);
      const data: Array<{
        probability: number;
        density: number;
        percentage: string;
      }> = [];

      for (let i = 0; i < numPoints; i++) {
        const x = i * step;
        const distance = Math.abs(x - value);
        const density = Math.exp(-Math.pow(distance / 0.05, 2)); // Gaussian-like peak
        data.push({
          probability: x,
          density: density,
          percentage: (x * 100).toFixed(1),
        });
      }

      // Ensure we have exact data points at our desired tick locations
      const tickValues = [0, 0.25, 0.5, 0.75, 1];
      tickValues.forEach((tick) => {
        if (!data.some((d) => Math.abs(d.probability - tick) < 0.001)) {
          const distance = Math.abs(tick - value);
          const density = Math.exp(-Math.pow(distance / 0.05, 2));
          data.push({
            probability: tick,
            density: density,
            percentage: (tick * 100).toFixed(1),
          });
        }
      });

      // Sort by probability to maintain order
      data.sort((a, b) => a.probability - b.probability);

      return {
        chartData: data,
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
