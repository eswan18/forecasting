import type { ResolvedItem, Standing } from "./dashboard-view";

/** A member of four seasons: two still open, two closed. */
export const standingsFixture: Standing[] = [
  {
    id: 6,
    name: "2026 Season",
    open: true,
    leaders: [
      { userId: 1, userName: "M. Calder", score: 0.112 },
      { userId: 2, userName: "R. Okonkwo", score: 0.126 },
      { userId: 3, userName: "J. Vance", score: 0.131 },
    ],
    you: { rank: 4, score: 0.148 },
    fieldSize: 12,
  },
  {
    id: 7,
    name: "Office Sweepstake",
    open: true,
    leaders: [
      { userId: 9, userName: "You", score: 0.104 },
      { userId: 4, userName: "A. Lindqvist", score: 0.119 },
      { userId: 5, userName: "T. Mbeki", score: 0.121 },
    ],
    you: { rank: 1, score: 0.104 },
    fieldSize: 6,
  },
  {
    id: 5,
    name: "2025 Season",
    open: false,
    leaders: [
      { userId: 4, userName: "A. Lindqvist", score: 0.098 },
      { userId: 9, userName: "You", score: 0.104 },
      { userId: 5, userName: "T. Mbeki", score: 0.121 },
    ],
    you: { rank: 2, score: 0.104 },
    fieldSize: 9,
  },
  {
    id: 4,
    name: "2024 Season",
    open: false,
    leaders: [],
    you: null,
    fieldSize: 0,
  },
];

export const resolvedFixture: ResolvedItem[] = [
  {
    forecastId: 1,
    propId: 101,
    propText: "A US government shutdown before April",
    forecast: 0.3,
    resolution: false,
  },
  {
    forecastId: 2,
    propId: 102,
    propText: "Anyone in the group changes jobs",
    forecast: 0.8,
    resolution: true,
  },
  {
    forecastId: 3,
    propId: 103,
    propText: "England win the Ashes",
    forecast: 0.65,
    resolution: false,
  },
];
