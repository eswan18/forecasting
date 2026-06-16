"use client";

import {
  CartesianGrid,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { CalibrationBucket } from "@/lib/calibration";

const chartConfig = {} satisfies ChartConfig;

interface CalibrationPoint {
  /** Mean predicted probability, 0–100. */
  predicted: number;
  /** Observed YES frequency, 0–100. */
  observed: number;
  count: number;
  binStart: number;
  binEnd: number;
}

/**
 * Reliability diagram: each point is a probability bucket, plotted as mean
 * predicted probability (x) vs. observed YES frequency (y), sized by how many
 * forecasts fell in the bucket. The dashed diagonal is perfect calibration —
 * points above it mean the events happened more often than predicted, below
 * means less often.
 */
export function CalibrationChart({ buckets }: { buckets: CalibrationBucket[] }) {
  const data: CalibrationPoint[] = buckets.map((b) => ({
    predicted: b.meanPredicted * 100,
    observed: b.observedFrequency * 100,
    count: b.count,
    binStart: b.binStart,
    binEnd: b.binEnd,
  }));

  if (data.length === 0) {
    return (
      <div className="flex aspect-square w-full max-w-md items-center justify-center text-sm text-muted-foreground">
        No resolved forecasts to plot.
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square w-full max-w-md"
    >
      <ScatterChart margin={{ top: 12, right: 16, bottom: 28, left: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          type="number"
          dataKey="predicted"
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${v}%`}
          label={{
            value: "Predicted probability",
            position: "bottom",
            offset: 10,
            fontSize: 11,
          }}
        />
        <YAxis
          type="number"
          dataKey="observed"
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${v}%`}
          label={{
            value: "Observed frequency",
            angle: -90,
            position: "left",
            offset: 0,
            fontSize: 11,
          }}
        />
        <ZAxis type="number" dataKey="count" range={[60, 500]} />
        {/* Perfect-calibration diagonal */}
        <ReferenceLine
          segment={[
            { x: 0, y: 0 },
            { x: 100, y: 100 },
          ]}
          stroke="var(--muted-foreground)"
          strokeDasharray="4 4"
          ifOverflow="hidden"
        />
        <Tooltip cursor={false} content={<CalibrationTooltip />} />
        <Scatter
          data={data}
          fill="var(--primary)"
          fillOpacity={0.75}
          stroke="var(--primary)"
        />
      </ScatterChart>
    </ChartContainer>
  );
}

function CalibrationTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: CalibrationPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="grid min-w-40 gap-1.5 rounded-lg border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-xl">
      <span className="font-medium">
        {Math.round(p.binStart * 100)}–{Math.round(p.binEnd * 100)}% bucket
      </span>
      <div className="grid grid-cols-2 gap-x-3">
        <span className="text-muted-foreground">Forecasts</span>
        <span className="text-right font-mono tabular-nums">{p.count}</span>
        <span className="text-muted-foreground">Avg predicted</span>
        <span className="text-right font-mono tabular-nums">
          {p.predicted.toFixed(0)}%
        </span>
        <span className="text-muted-foreground">Resolved yes</span>
        <span className="text-right font-mono tabular-nums">
          {p.observed.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
