'use client';

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { UserScore } from "@/lib/db_actions";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--foreground))",
  },
} satisfies ChartConfig;

export default function UserScoresChart({ userScores }: { userScores: UserScore[] }) {
  userScores.sort((a, b) => a.score - b.score);
  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <BarChart
        accessibilityLayer
        data={userScores}
        layout="vertical"
        margin={{ left: 1.5, right: 1.5 }}
        barCategoryGap={13}
      >
        <YAxis
          type="category"
          dataKey="user_name"
          tickLine={false}
          axisLine={false}
        />
        <XAxis dataKey="score" type="number" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="score" fill="hsl(var(--foreground))" radius={2} />
      </BarChart>
    </ChartContainer>
  )
}