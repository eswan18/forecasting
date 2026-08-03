import { describe, it, expect } from "vitest";
import { rankForecasters, type ForecasterScore } from "./leaderboard";

const users: ForecasterScore[] = [
  { userId: 1, userName: "Avery", score: 0.12 },
  { userId: 2, userName: "Jordan", score: 0.31 },
  { userId: 3, userName: "Sam", score: 0.2 },
  { userId: 4, userName: "Taylor", score: 0.05 },
];

describe("rankForecasters", () => {
  it("sorts ascending by score, since lower Brier is better", () => {
    const ranked = rankForecasters({
      overallScores: users,
      incompleteUserIds: [],
      currentUserId: null,
      showIncomplete: true,
    });

    expect(ranked.map((u) => u.userName)).toEqual([
      "Taylor",
      "Avery",
      "Sam",
      "Jordan",
    ]);
    expect(ranked.map((u) => u.rank)).toEqual([1, 2, 3, 4]);
  });

  it("does not mutate the input array", () => {
    const input = [...users];
    rankForecasters({
      overallScores: input,
      incompleteUserIds: [],
      currentUserId: null,
      showIncomplete: true,
    });

    expect(input).toEqual(users);
  });

  it("drops incomplete forecasters when showIncomplete is false", () => {
    const ranked = rankForecasters({
      overallScores: users,
      incompleteUserIds: [4, 2],
      currentUserId: null,
      showIncomplete: false,
    });

    expect(ranked.map((u) => u.userName)).toEqual(["Avery", "Sam"]);
  });

  it("renumbers ranks over the visible set so there are no gaps", () => {
    // Taylor (rank 1 overall) is incomplete, so Avery becomes rank 1.
    const ranked = rankForecasters({
      overallScores: users,
      incompleteUserIds: [4],
      currentUserId: null,
      showIncomplete: false,
    });

    expect(ranked.map((u) => [u.userName, u.rank])).toEqual([
      ["Avery", 1],
      ["Sam", 2],
      ["Jordan", 3],
    ]);
  });

  it("keeps incomplete forecasters, flagged, when showIncomplete is true", () => {
    const ranked = rankForecasters({
      overallScores: users,
      incompleteUserIds: [4],
      currentUserId: null,
      showIncomplete: true,
    });

    expect(ranked).toHaveLength(4);
    expect(ranked.find((u) => u.userName === "Taylor")?.isIncomplete).toBe(true);
    expect(ranked.find((u) => u.userName === "Avery")?.isIncomplete).toBe(false);
  });

  it("marks the current user", () => {
    const ranked = rankForecasters({
      overallScores: users,
      incompleteUserIds: [],
      currentUserId: 3,
      showIncomplete: true,
    });

    expect(ranked.filter((u) => u.isCurrentUser).map((u) => u.userName)).toEqual(
      ["Sam"],
    );
  });

  it("hides the current user like anyone else when they are incomplete", () => {
    const ranked = rankForecasters({
      overallScores: users,
      incompleteUserIds: [3],
      currentUserId: 3,
      showIncomplete: false,
    });

    expect(ranked.some((u) => u.isCurrentUser)).toBe(false);
  });

  it("returns an empty list when every forecaster is incomplete", () => {
    const ranked = rankForecasters({
      overallScores: users,
      incompleteUserIds: [1, 2, 3, 4],
      currentUserId: 1,
      showIncomplete: false,
    });

    expect(ranked).toEqual([]);
  });

  it("handles an empty score list", () => {
    expect(
      rankForecasters({
        overallScores: [],
        incompleteUserIds: [],
        currentUserId: 1,
        showIncomplete: false,
      }),
    ).toEqual([]);
  });

  it("ignores incomplete ids that have no score row", () => {
    const ranked = rankForecasters({
      overallScores: users,
      incompleteUserIds: [999],
      currentUserId: null,
      showIncomplete: false,
    });

    expect(ranked).toHaveLength(4);
  });
});
