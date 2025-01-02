"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category, VForecast, VProp } from "@/types/db_types";
import { FC, useState } from "react";
import { PropStatistics, propStatisticsForForecasts } from "./stats";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import {
  CartesianGrid,
  ComposedChart,
  Dot,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";
import { Tooltip } from "recharts";

export default function PropConsensusContent(
  { categories, forecasts, props }: {
    categories: Category[];
    forecasts: VForecast[];
    props: VProp[];
  },
) {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const forecastsInScope = forecasts.filter((forecast) =>
    forecast.category_id === selectedCategory.id
  );

  return (
    <Select
      value={selectedCategory.id.toString()}
      onValueChange={(value) => {
        setSelectedCategory(
          categories.find((category) => category.id.toString() === value) ||
            categories[0],
        );
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id.toString()}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
      <AllPropsConsensusChart
        props={propStatisticsForForecasts(forecastsInScope)}
      />
      <div className="w-full flex justify-center">
        <p className="text-muted-foreground text-sm">
          Hover over a point in the chart to see which prop it corresponds to.
        </p>
      </div>
    </Select>
  );
}

const chartConfig = {} satisfies ChartConfig;

function AllPropsConsensusChart(
  { props }: { props: Map<number, PropStatistics> },
) {
  const data = Array.from(props.values());
  // Order by average.
  data.sort((a, b) => a.mean - b.mean);
  return (
    <ChartContainer config={chartConfig} className="min-h-28 w-full">
      <ComposedChart
        layout="vertical"
        data={data}
        accessibilityLayer
        className="p-4"
      >
        <CartesianGrid />
        <XAxis type="number" axisLine={false} domain={[0, 1]} />
        <YAxis dataKey="prop_id" type="category" hide={true} />
        <Tooltip content={<CustomTooltip />} />
        <Scatter
          dataKey="mean"
          shape={<RenderDot radius={5} fill="hsl(var(--primary))" />}
        />
        <Scatter
          dataKey="p25"
          shape={<RenderDot radius={3} fill="hsl(var(--foreground))" />}
        />
        <Scatter
          dataKey="p75"
          shape={<RenderDot radius={3} fill="hsl(var(--foreground))" />}
        />
        <Scatter
          dataKey="min"
          shape={<RenderDot radius={2} fill="hsl(var(--secondary))" />}
        />
        <Scatter
          dataKey="max"
          shape={<RenderDot radius={2} fill="hsl(var(--secondary))" />}
        />
      </ComposedChart>
    </ChartContainer>
  );
}

interface TooltipPayload {
  chartType?: string;
  color?: string;
  dataKey: string;
  formatter?: any;
  hide: boolean;
  name: string;
  payload: PropStatistics;
  type?: string;
  unit?: string;
  value: number;
}

const CustomTooltip = (
  { active, payload, label }: {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
  },
) => {
  if (active && payload && payload.length) {
    const stats = payload[0].payload;
    return (
      <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
        <span className="font-semibold">{payload[0].payload.prop_text}</span>
        <div className="grid grid-cols-2 w-full">
          <p className="text-muted-foreground">Mean</p>
          <p>{stats.mean.toFixed(2)}</p>
          <p className="text-muted-foreground">P25</p>
          <p>{stats.p25.toFixed(2)}</p>
          <p className="text-muted-foreground">P75</p>
          <p>{stats.p75.toFixed(2)}</p>
          <p className="text-muted-foreground">Min</p>
          <p>{stats.min.toFixed(2)}</p>
          <p className="text-muted-foreground">Max</p>
          <p>{stats.max.toFixed(2)}</p>
        </div>
      </div>
    );
  }

  return null;
};

const RenderDot: FC<
  { cx?: number; cy?: number; radius: number; fill: string }
> = (
  { cx, cy, radius, fill }: {
    cx?: number;
    cy?: number;
    radius: number;
    fill: string;
  },
) => {
  return <Dot cx={cx} cy={cy} r={radius} fill={fill} />;
};