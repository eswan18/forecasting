"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { CartesianGrid } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { VForecast } from "@/types/db_types";

const chartConfig = {
  /*score: {
    label: "Score",
    color: "hsl(var(--foreground))",
  },*/
} satisfies ChartConfig;

// A scored forecast is a forecast but where resolution and score are non-null
type ScoredForecast = VForecast & { resolution: boolean; score: number };

// A user has a number of scores, one for each forecast they made.
// thus a UserScore is a map from prop names to scores.

interface UserScore {
  name: string;
  scores: {
    [propText: string]: number;
  };
}

export default function UserScoresChart(
  { forecasts }: { forecasts: VForecast[] },
) {
  // Keep only the forecasts that have a score.
  const scoredForecasts = forecasts.filter(
    (forecast): forecast is ScoredForecast =>
      forecast.resolution !== null && forecast.score !== null,
  );
  // Sort so that the lowest scores are at the top.
  scoredForecasts.sort((a, b) => a.score - b.score);
  // Group by user.
  const userScores: UserScore[] = [];
  for (const forecast of scoredForecasts) {
    const userScore = userScores.find((user) =>
      user.name === forecast.user_name
    );
    if (userScore) {
      userScore.scores[forecast.prop_text] = forecast.score;
    } else {
      userScores.push({
        name: forecast.user_name,
        scores: { [forecast.prop_text]: forecast.score },
      });
    }
  }
  const chartData = userScores.map((userScore) => ({
    name: userScore.name,
    ...userScore.scores, // This spreads all the score values as separate properties. Thanks GPT!
  }));
  // Get every prop and assign it a color.
  const propTexts = scoredForecasts.map((forecast) => forecast.prop_text);
  const uniqPropTexts = [...new Set(propTexts)];
  const propsAndColors = uniqPropTexts.map((propText, index) => ({
    propText,
    color: `hsl(${(index * 360) / uniqPropTexts.length}, 50%, 50%)`,
  }));
  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
      >
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
        />
        <CartesianGrid strokeDasharray="3 3" />
        {uniqPropTexts.length < 30 && (
          <ChartTooltip content={<ChartTooltipContent />} />
        )}
        <XAxis type="number" />
        {propsAndColors.map(({ propText, color }) => (
          <Bar
            key={propText}
            dataKey={propText}
            fill={color}
            radius={2}
            stackId="a"
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
