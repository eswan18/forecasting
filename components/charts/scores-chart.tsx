"use client";

import { Bar, BarChart, Legend, XAxis, YAxis } from "recharts";
import { CartesianGrid } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { VForecast } from "@/types/db_types";

// A scored forecast is a forecast but where resolution and score are non-null
type ScoredForecast = VForecast & { resolution: boolean; score: number };

// A user's total scores for each category.
interface UserScore {
  name: string;
  scores: {
    [propId: number]: number;
  };
  totalScore?: number;
}

// A chart that shows the total scores of each user for all the given forecasts, or the
// scores broken down by prop.
export default function ScoresChart(
  { forecasts, byProp }: { forecasts: VForecast[]; byProp: boolean },
) {
  // Keep only the forecasts that have a score.
  const scoredForecasts = forecasts.filter(
    (forecast): forecast is ScoredForecast =>
      forecast.resolution !== null && forecast.score !== null,
  );
  // Group by user.
  const userScores: UserScore[] = [];
  const propIdToText = new Map<number, string>();
  for (const forecast of scoredForecasts) {
    const userScore = userScores.find((user) =>
      user.name === forecast.user_name
    );
    if (userScore) {
      if (forecast.prop_id in userScore.scores) {
        userScore.scores[forecast.prop_id] += forecast.score;
      } else {
        userScore.scores[forecast.prop_id] = forecast.score;
      }
    } else {
      userScores.push({
        name: forecast.user_name,
        scores: { [forecast.prop_id]: forecast.score },
      });
    }
    propIdToText.set(forecast.prop_id, forecast.prop_text);
  }
  // Compute the total score for each user, and sort.
  for (const userScore of userScores) {
    const scores = Object.values(userScore.scores);
    userScore.totalScore = scores.reduce((acc, score) => acc + score, 0) /
      scores.length;
  }
  userScores.sort((a, b) => (a.totalScore || 0) - (b.totalScore || 0));

  let maximumScore = 0;
  if (byProp) {
    maximumScore = Math.max(
      ...userScores.map((userScore) =>
        Math.max(...Object.values(userScore.scores))
      ),
    );
  } else {
    maximumScore = userScores[userScores.length - 1].totalScore || 0;
  }
  const axisMaximum = Math.round(maximumScore * 1.1 * 10) / 10;

  const chartData = byProp
    ? userScores.map((userScore) => ({
      name: userScore.name,
      ...userScore.scores, // This spreads all the prop score values as separate properties.
    }))
    : userScores.map((userScore) => ({
      name: userScore.name,
      totalScore: userScore.totalScore,
    }));
  const propIds = Array.from(
    new Set(scoredForecasts.map((forecast) => forecast.prop_id)),
  );
  const propIdsAndColors = propIds.map((propId, index) => ({
    propId,
    color: `hsl(var(--chart-${index + 1}))`,
  }));
  return (
    <ChartContainer
      config={{}}
      className={`w-full ${byProp ? "h-[48rem]" : "h-[32rem]"}`}
    >
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
      >
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tick={{ fill: "red" }}
        />
        <CartesianGrid strokeDasharray="3 3" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <XAxis
          type="number"
          domain={[0, axisMaximum]}
          tick={{ fill: "red" }}
        />
        {byProp
          ? propIdsAndColors.map(({ propId, color }) => (
            <Bar
              key={propId}
              dataKey={propId}
              name={propIdToText.get(propId)}
              fill={color}
              radius={2}
            />
          ))
          : (
            <Bar
              dataKey="totalScore"
              fill="hsl(var(--chart-1))"
              name="Score"
              radius={2}
            />
          )}
      </BarChart>
    </ChartContainer>
  );
}
