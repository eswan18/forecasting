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
interface UserCategoryScore {
  name: string;
  scores: {
    [categoryId: number]: number;
  };
  totalScore?: number;
}

export default function OverallScoresChart(
  { forecasts, byCategory }: { forecasts: VForecast[]; byCategory: boolean },
) {
  // Keep only the forecasts that have a score.
  const scoredForecasts = forecasts.filter(
    (forecast): forecast is ScoredForecast =>
      forecast.resolution !== null && forecast.score !== null,
  );
  // Group by user.
  const userCategoryScores: UserCategoryScore[] = [];
  const categoryIdToName = new Map<number, string>();
  for (const forecast of scoredForecasts) {
    const userCategoryScore = userCategoryScores.find((user) =>
      user.name === forecast.user_name
    );
    if (userCategoryScore) {
      if (forecast.category_id in userCategoryScore.scores) {
        userCategoryScore.scores[forecast.category_id] += forecast.score;
      } else {
        userCategoryScore.scores[forecast.category_id] = forecast.score;
      }
    } else {
      userCategoryScores.push({
        name: forecast.user_name,
        scores: { [forecast.category_id]: forecast.score },
      });
    }
    categoryIdToName.set(forecast.category_id, forecast.category_name);
  }
  // Compute the total score for each user, and sort.
  for (const userCategoryScore of userCategoryScores) {
    const scores = Object.values(userCategoryScore.scores);
    userCategoryScore.totalScore = scores.reduce((acc, score) =>
      acc + score, 0) /
      scores.length;
  }
  userCategoryScores.sort((a, b) => (a.totalScore || 0) - (b.totalScore || 0));

  let maximumScore = 0;
  if (byCategory) {
    maximumScore = Math.max(
      ...userCategoryScores.map((userCategoryScore) =>
        Math.max(...Object.values(userCategoryScore.scores))
      ),
    );
  } else {
    maximumScore =
      userCategoryScores[userCategoryScores.length - 1].totalScore || 0;
  }
  const axisMaximum = Math.round(maximumScore * 1.1 * 10) / 10;

  const chartData = byCategory
    ? userCategoryScores.map((userCategoryScore) => ({
      name: userCategoryScore.name,
      ...userCategoryScore.scores, // This spreads all the category score values as separate properties.
    }))
    : userCategoryScores.map((userCategoryScore) => ({
      name: userCategoryScore.name,
      totalScore: userCategoryScore.totalScore,
    }));
  const categoryIds = scoredForecasts.map((forecast) => forecast.category_id);
  const uniqCategoryIds = [...new Set(categoryIds)];
  const categoryIdsAndColors = uniqCategoryIds.map((categoryId, index) => ({
    categoryId,
    color: `hsl(var(--chart-${index + 1}))`,
  }));
  return (
    <ChartContainer config={{}} className="w-full h-[30rem]">
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
        <ChartTooltip content={<ChartTooltipContent />} />
        <XAxis
          type="number"
          domain={[0, axisMaximum]}
        />
        {byCategory && (
          <Legend
            verticalAlign="top"
            align="center"
          />
        )}
        {byCategory
          ? categoryIdsAndColors.map(({ categoryId, color }) => (
            <Bar
              key={categoryId}
              dataKey={categoryId}
              name={categoryIdToName.get(categoryId)}
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
