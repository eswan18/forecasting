"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category, VForecast, VProp } from "@/types/db_types";
import { useState } from "react";
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
  Label,
  LabelList,
  Line,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

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
      <PropConsensusChart
        props={propStatisticsForForecasts(forecastsInScope)}
      />
    </Select>
  );
}

const chartConfig = {} satisfies ChartConfig;

function PropConsensusChart({ props }: { props: Map<number, PropStatistics> }) {
  const data = Array.from(props.values());
  return (
    <ChartContainer config={chartConfig} className="min-h-48 w-full">
      <ComposedChart
        layout="vertical"
        data={data}
        margin={{
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        }}
      >
        <CartesianGrid />
        <XAxis type="number"></XAxis>
        <YAxis dataKey="prop_id" type="category"/>
        <ZAxis type="number" dataKey="min" name="score" />
        <ZAxis type="number" dataKey="max" name="score" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend />
        <Scatter dataKey="mean" fill="hsl(var(--foreground))">
        </Scatter>
        <Scatter dataKey="p25" fill="hsl(var(--muted-foreground))" />
        <Scatter dataKey="p75" fill="hsl(var(--muted-foreground))" />
      </ComposedChart>
    </ChartContainer>
  );
}
