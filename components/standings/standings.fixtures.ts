import type { Category } from "@/types/db_types";
import type { CompetitionScore } from "@/lib/db_actions";

export const categoriesFixture: Category[] = [
  { id: 1, name: "US politics" },
  { id: 2, name: "World politics" },
  { id: 3, name: "Economics" },
  { id: 4, name: "Sports" },
  { id: 5, name: "Technology" },
] as Category[];

const overall = [
  { userId: 1, userName: "Akshay Rangesh", score: 0.101 },
  { userId: 2, userName: "Carly Fiorina", score: 0.187 },
  { userId: 3, userName: "Greg Moore", score: 0.22 },
  { userId: 4, userName: "A. Lindqvist", score: 0.231 },
  { userId: 9, userName: "Ethan Swan", score: 0.24 },
  { userId: 5, userName: "T. Mbeki", score: 0.251 },
  { userId: 6, userName: "M. Calder", score: 0.263 },
  { userId: 7, userName: "R. Okonkwo", score: 0.279 },
  { userId: 8, userName: "J. Vance", score: 0.301 },
  // Deliberately the best raw score on the board, and hidden by default: a
  // partial set isn't comparable, and the page has to make that legible.
  { userId: 10, userName: "P. Nakamura", score: 0.061 },
];

/** A few categories each, so the opened detail has something to say. */
const categoryScores = overall.flatMap((u) =>
  categoriesFixture.slice(0, 4).map((c, i) => ({
    userId: u.userId,
    userName: u.userName,
    categoryId: c.id,
    score: Math.round((u.score + (i - 1.5) * 0.045) * 1000) / 1000,
  })),
);

export const CURRENT_USER_ID = 9;

export const scoresFixture: CompetitionScore = {
  overallScores: overall,
  categoryScores,
  incompleteUserIds: [10],
};

/** Nobody scored yet — the competition has resolved nothing. */
export const emptyScoresFixture: CompetitionScore = {
  overallScores: [],
  categoryScores: [],
  incompleteUserIds: [],
};

/** A two-person private group: the smallest field the axis has to hold. */
export const smallScoresFixture: CompetitionScore = {
  overallScores: [
    { userId: 11, userName: "Annaluisa Kambas", score: 0.043 },
    { userId: 9, userName: "Ethan Swan", score: 0.171 },
  ],
  categoryScores: [],
  incompleteUserIds: [],
};
