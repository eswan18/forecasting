'use client';

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { UserScore } from "@/lib/db_actions";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const chartConfig = {
  user_name: {
    label: "Name",
    color: "hsl(var(--chart-1))",
  },
  score: {
    label: "Score",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function UserScoresChart({ userScores }: { userScores: UserScore[] }) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[600px] w-full">
      <BarChart accessibilityLayer data={userScores} layout="vertical" barCategoryGap={30}>
        <YAxis
          type="category"
          dataKey="user_name"
          tickLine={false}
          axisLine={false}
        />
        <XAxis dataKey="score" type="number" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="score" fill="var(--color-mobile)" radius={2} barSize={10}/>
      </BarChart>
    </ChartContainer>
  )
}