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
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Dot,
  DotProps,
  Label,
  LabelList,
  Line,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Zain } from "next/font/google";

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
    </Select>
  );
}

const chartConfig = {} satisfies ChartConfig;

function AllPropsConsensusChart(
  { props }: { props: Map<number, PropStatistics> },
) {
  const data = Array.from(props.values());
  return (
    <ChartContainer config={chartConfig} className="min-h-56 w-full p-4">
      <ComposedChart
        layout="vertical"
        data={data}
      >
        <CartesianGrid />
        <XAxis type="number" axisLine={false} domain={[0, 1]} />
        <YAxis dataKey="prop_id" type="category" hide={true} />
        <ZAxis type="category" dataKey="prop_text" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Scatter
          dataKey="mean"
          shape={<RenderDot radius={5} fill="hsl(var(--foreground))" />}
        />
        <Scatter
          dataKey="p25"
          shape={<RenderDot radius={3} fill="hsl(var(--muted-foreground))" />}
        />
        <Scatter
          dataKey="p75"
          shape={<RenderDot radius={3} fill="hsl(var(--muted-foreground))" />}
        />
        <Scatter
          dataKey="min"
          shape={<RenderDot radius={2} fill="hsl(var(--muted-foreground))" />}
        />
        <Scatter
          dataKey="max"
          shape={<RenderDot radius={2} fill="hsl(var(--muted-foreground))" />}
        />
      </ComposedChart>
    </ChartContainer>
  );
}

const RenderDot: FC<DotProps> = (
  { cx, cy, radius, fill }: {
    cx: number;
    cy: number;
    radius: number;
    fill: string;
  },
) => {
  return <Dot cx={cx} cy={cy} r={radius} fill={fill} />;
};
