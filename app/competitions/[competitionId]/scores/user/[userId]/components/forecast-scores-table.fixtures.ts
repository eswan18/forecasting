import type { Category } from "@/types/db_types";
import type { UserForecastScore, UserCategoryScore } from "@/lib/db_actions";

// Shared mock data for the forecast-scores-table story. Built from a flat list
// of forecasts, then grouped/sorted the same way the page does (worst penalty
// first) so the story mirrors real output.

const D = new Date("2026-01-01T00:00:00Z");

export const categories: Category[] = [
  { id: 1, name: "Politics", updated_at: D, created_at: D },
  { id: 2, name: "Sports", updated_at: D, created_at: D },
  { id: 3, name: "Economics", updated_at: D, created_at: D },
];

const forecasts: UserForecastScore[] = [
  {
    forecastId: 1,
    propId: 101,
    propText: "Will the incumbent win re-election?",
    categoryId: 1,
    categoryName: "Politics",
    forecast: 0.72,
    resolution: true,
    score: 0.078,
  },
  {
    forecastId: 2,
    propId: 102,
    propText: "Will a third-party candidate exceed 5% of the vote?",
    categoryId: 1,
    categoryName: "Politics",
    forecast: 0.15,
    resolution: false,
    score: 0.022,
  },
  {
    forecastId: 3,
    propId: 201,
    propText: "Will the home team make the playoffs?",
    categoryId: 2,
    categoryName: "Sports",
    forecast: 0.6,
    resolution: true,
    score: 0.16,
  },
  {
    forecastId: 4,
    propId: 202,
    propText: "Will the league MVP come from the conference leader?",
    categoryId: 2,
    categoryName: "Sports",
    forecast: 0.45,
    resolution: false,
    score: 0.203,
  },
  {
    forecastId: 5,
    propId: 301,
    propText: "Will headline inflation fall below 3% by year-end?",
    categoryId: 3,
    categoryName: "Economics",
    forecast: 0.82,
    resolution: false,
    score: 0.672,
  },
  {
    forecastId: 6,
    propId: 302,
    propText: "Will unemployment stay under 5% all year?",
    categoryId: 3,
    categoryName: "Economics",
    forecast: 0.9,
    resolution: true,
    score: 0.01,
  },
  {
    forecastId: 7,
    propId: 401,
    propText: "Will the central bank cut rates at its next meeting?",
    categoryId: null,
    categoryName: null,
    forecast: 0.35,
    resolution: null,
    score: null,
  },
];

export const sortedForecasts: UserForecastScore[] = [...forecasts].sort(
  (a, b) => (b.score ?? 0) - (a.score ?? 0),
);

export const sortedCategoryScores: UserCategoryScore[] = [
  { userId: 1, userName: "Avery Chen", categoryId: 3, score: 0.341 },
  { userId: 1, userName: "Avery Chen", categoryId: 2, score: 0.182 },
  { userId: 1, userName: "Avery Chen", categoryId: 1, score: 0.05 },
];

export const sortedCategoryEntries: Array<
  [number | "uncategorized", UserForecastScore[]]
> = [
  ...sortedCategoryScores.map(
    (cs): [number | "uncategorized", UserForecastScore[]] => [
      cs.categoryId,
      forecasts
        .filter((f) => f.categoryId === cs.categoryId)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    ],
  ),
  [
    "uncategorized",
    forecasts.filter((f) => f.categoryId === null),
  ] as [number | "uncategorized", UserForecastScore[]],
];
