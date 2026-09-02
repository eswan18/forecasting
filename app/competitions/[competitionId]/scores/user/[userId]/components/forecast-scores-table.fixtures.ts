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
    kind: "binary",
    forecast: 0.72,
    resolution: true,
    score: 0.078,
    options: [],
  },
  {
    forecastId: 2,
    propId: 102,
    propText: "Will a third-party candidate exceed 5% of the vote?",
    categoryId: 1,
    categoryName: "Politics",
    kind: "binary",
    forecast: 0.15,
    resolution: false,
    score: 0.022,
    options: [],
  },
  {
    forecastId: 3,
    propId: 201,
    propText: "Will the home team make the playoffs?",
    categoryId: 2,
    categoryName: "Sports",
    kind: "binary",
    forecast: 0.6,
    resolution: true,
    score: 0.16,
    options: [],
  },
  {
    forecastId: 4,
    propId: 202,
    propText: "Will the league MVP come from the conference leader?",
    categoryId: 2,
    categoryName: "Sports",
    kind: "binary",
    forecast: 0.45,
    resolution: false,
    score: 0.203,
    options: [],
  },
  {
    forecastId: 5,
    propId: 301,
    propText: "Will headline inflation fall below 3% by year-end?",
    categoryId: 3,
    categoryName: "Economics",
    kind: "binary",
    forecast: 0.82,
    resolution: false,
    score: 0.672,
    options: [],
  },
  {
    forecastId: 6,
    propId: 302,
    propText: "Will unemployment stay under 5% all year?",
    categoryId: 3,
    categoryName: "Economics",
    kind: "binary",
    forecast: 0.9,
    resolution: true,
    score: 0.01,
    options: [],
  },
  {
    forecastId: 7,
    propId: 401,
    propText: "Will the central bank cut rates at its next meeting?",
    categoryId: null,
    categoryName: null,
    kind: "binary",
    forecast: 0.35,
    resolution: null,
    score: null,
    options: [],
  },
  // A `one_of` prop: the scalar forecast/resolution are null and the row reads
  // off the options instead — the Forecast column shows the 30% the user gave
  // the winner, the Resolution column that one winner's label.
  {
    forecastId: 8,
    propId: 203,
    propText: "Which team wins the championship?",
    categoryId: 2,
    categoryName: "Sports",
    kind: "one_of",
    forecast: null,
    resolution: null,
    score: 0.343,
    options: [
      { text: "Boston Celtics", userForecast: 0.35, outcome: false },
      { text: "Denver Nuggets", userForecast: 0.25, outcome: false },
      { text: "Oklahoma City Thunder", userForecast: 0.3, outcome: true },
      { text: "Any other team", userForecast: 0.1, outcome: false },
    ],
  },
  // An `any_of` prop: two options landed, so the Forecast column is a dash and
  // the Resolution column lists both labels.
  {
    forecastId: 9,
    propId: 303,
    propText: "Which of these firms announce layoffs this quarter?",
    categoryId: 3,
    categoryName: "Economics",
    kind: "any_of",
    forecast: null,
    resolution: null,
    score: 0.199,
    options: [
      { text: "Northwind Logistics", userForecast: 0.62, outcome: true },
      { text: "Vantage Semiconductor", userForecast: 0.28, outcome: false },
      { text: "Harbor Foods", userForecast: 0.44, outcome: true },
      { text: "Copperline Energy", userForecast: 0.51, outcome: false },
    ],
  },
];

export const sortedForecasts: UserForecastScore[] = [...forecasts].sort(
  (a, b) => (b.score ?? 0) - (a.score ?? 0),
);

// Category averages over the rows above, worst first.
export const sortedCategoryScores: UserCategoryScore[] = [
  { userId: 1, userName: "Avery Chen", categoryId: 3, score: 0.294 },
  { userId: 1, userName: "Avery Chen", categoryId: 2, score: 0.235 },
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
