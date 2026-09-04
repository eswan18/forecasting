import type { UserForecastScore, UserCategoryScore } from "@/lib/db_actions";

const binary = (
  propId: number,
  propText: string,
  categoryId: number,
  categoryName: string,
  forecast: number,
  resolution: boolean,
): UserForecastScore => ({
  forecastId: propId * 10,
  propId,
  propText,
  categoryId,
  categoryName,
  kind: "binary",
  forecast,
  resolution,
  score: Math.round((Number(resolution) - forecast) ** 2 * 1000) / 1000,
  options: [],
});

const forecastScores: UserForecastScore[] = [
  binary(
    12,
    "Cursor raises a round at, or IPOs at, a $30B valuation or above.",
    5,
    "Technology",
    0.9,
    false,
  ),
  binary(
    18,
    "OpenAI files with regulators for an initial public offering.",
    5,
    "Technology",
    0.35,
    true,
  ),
  binary(13, "England win the Ashes.", 4, "Sports", 0.65, false),
  binary(
    17,
    "The U.S. Men's National Team reaches the World Cup quarterfinals.",
    4,
    "Sports",
    0.25,
    false,
  ),
  binary(
    11,
    "A US government shutdown before April.",
    1,
    "US politics",
    0.3,
    false,
  ),
  {
    forecastId: 150,
    propId: 15,
    propText: "Which model tops LMArena at the end of the year?",
    categoryId: 5,
    categoryName: "Technology",
    kind: "one_of",
    forecast: null,
    resolution: null,
    // one_of: half the multi-category Brier, matching v_forecasts.score
    score: 0.198,
    options: [
      { text: "Claude", userForecast: 0.5, outcome: true },
      { text: "GPT", userForecast: 0.35, outcome: false },
      { text: "Gemini", userForecast: 0.15, outcome: false },
    ],
  },
];

const categoryScores: UserCategoryScore[] = [
  { userId: 9, userName: "Ethan Swan", categoryId: 5, score: 0.469 },
  { userId: 9, userName: "Ethan Swan", categoryId: 4, score: 0.243 },
  { userId: 9, userName: "Ethan Swan", categoryId: 1, score: 0.09 },
];

export const breakdownFixture = {
  userId: 9,
  userName: "Ethan Swan",
  overallScore: 0.267,
  categoryScores,
  forecastScores,
};

export const emptyBreakdownFixture = {
  userId: 9,
  userName: "Ethan Swan",
  overallScore: 0,
  categoryScores: [],
  forecastScores: [],
};
