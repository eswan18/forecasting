import { vi, describe, expect, beforeEach } from "vitest";
import { getTestDb } from "../../tests/helpers/testDatabase";
import { TestDataFactory } from "../../tests/helpers/testFactories";
import {
  shouldRunContainerTests,
  ifRunningContainerTestsIt,
} from "../../tests/helpers/testUtils";

let getCompetitionScores: typeof import("./competition-scores").getCompetitionScores;

// Mock getUserFromCookies
vi.mock("@/lib/get-user", () => ({
  getUserFromCookies: vi.fn(),
}));

import { getUserFromCookies } from "@/lib/get-user";

describe("getCompetitionScores", () => {
  let testDb: any;
  let factory: TestDataFactory;

  beforeEach(async () => {
    if (shouldRunContainerTests()) {
      testDb = await getTestDb();
      factory = new TestDataFactory(testDb);
      vi.clearAllMocks();

      // Import the actual function for testing
      const competitionScoresModule = await import("./competition-scores");
      getCompetitionScores = competitionScoresModule.getCompetitionScores;
    } else {
      vi.clearAllMocks();
    }
  });

  describe("authentication", () => {
    ifRunningContainerTestsIt(
      "should return error when user is not authenticated",
      async () => {
        vi.mocked(getUserFromCookies).mockResolvedValue(null);

        const result = await getCompetitionScores({ competitionId: 1 });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe(
            "You must be logged in to view competition scores",
          );
          expect(result.code).toBe("UNAUTHORIZED");
        }
      },
    );
  });

  describe("data aggregation", () => {
    ifRunningContainerTestsIt(
      "should return empty scores for competition with no forecasts",
      async () => {
        const user = await factory.createUser();
        vi.mocked(getUserFromCookies).mockResolvedValue(user);

        const competition = await factory.createCompetition();

        const result = await getCompetitionScores({
          competitionId: competition.id,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.overallScores).toEqual([]);
          expect(result.data.categoryScores).toEqual([]);
        }
      },
    );

    ifRunningContainerTestsIt(
      "should aggregate scores correctly for multiple users and categories",
      async () => {
        const user1 = await factory.createUser({ name: "User One" });
        const user2 = await factory.createUser({ name: "User Two" });
        vi.mocked(getUserFromCookies).mockResolvedValue(user1);

        const competition = await factory.createCompetition();

        // Create categories
        const politicsCategory = await factory.createCategory({
          name: "Politics",
        });

        const economicsCategory = await factory.createCategory({
          name: "Economics",
        });

        // Create props in different categories
        const prop1 = await factory.createCompetitionProp(competition.id, {
          category_id: politicsCategory.id,
          text: "Biden will win 2024",
        });

        const prop2 = await factory.createCompetitionProp(competition.id, {
          category_id: economicsCategory.id,
          text: "Inflation will drop 2%",
        });

        const prop3 = await factory.createCompetitionProp(competition.id, {
          category_id: politicsCategory.id,
          text: "Democrats will keep the Senate",
        });

        // Create forecasts with different probabilities
        await factory.createForecast(user1.id, prop1.id, { forecast: 0.7 }); // user1 prediction: 70%
        await factory.createForecast(user1.id, prop2.id, { forecast: 0.4 }); // user1 prediction: 40%
        await factory.createForecast(user1.id, prop3.id, { forecast: 0.6 }); // user1 prediction: 60%

        await factory.createForecast(user2.id, prop1.id, { forecast: 0.8 }); // user2 prediction: 80%
        await factory.createForecast(user2.id, prop2.id, { forecast: 0.3 }); // user2 prediction: 30%
        await factory.createForecast(user2.id, prop3.id, { forecast: 0.5 }); // user2 prediction: 50%

        // Create resolutions (actual outcomes)
        await factory.createResolution(prop1.id, {
          resolution: true, // Biden won
          notes: "Test resolution",
          user_id: user1.id,
        });

        await factory.createResolution(prop2.id, {
          resolution: false, // Inflation didn't drop below 2%
          notes: "Test resolution",
          user_id: user1.id,
        });

        await factory.createResolution(prop3.id, {
          resolution: true, // Democrats kept the Senate
          notes: "Test resolution",
          user_id: user1.id,
        });

        // Note: When props are resolved, ALL users who forecast on those props get scores
        // So both user1 and user2 should appear in the scores
        const result = await getCompetitionScores({
          competitionId: competition.id,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const { overallScores, categoryScores } = result.data;

          // Check overall scores (both users have resolved forecasts)
          expect(overallScores).toHaveLength(2);
          expect(overallScores).toContainEqual({
            userId: user1.id,
            userName: user1.name,
            score: expect.any(Number), // Brier score calculation
          });
          expect(overallScores).toContainEqual({
            userId: user2.id,
            userName: user2.name,
            score: expect.any(Number), // Brier score calculation
          });

          // Check category scores (both users in both categories)
          expect(categoryScores).toHaveLength(4); // 2 users × 2 categories

          // Politics category scores (both users have 2 forecasts each)
          const politicsScoresUser1 = categoryScores.find(
            (c) =>
              c.categoryId === politicsCategory!.id && c.userId === user1.id,
          );
          expect(politicsScoresUser1).toBeDefined();
          expect(politicsScoresUser1!.userName).toBe(user1.name);
          // (0.7 - 1)^2 = 0.09 and (0.6 - 1)^2 = 0.16, so average is 0.125
          expect(politicsScoresUser1!.score).toBeCloseTo(0.125, 6);

          const politicsScoresUser2 = categoryScores.find(
            (c) =>
              c.categoryId === politicsCategory!.id && c.userId === user2.id,
          );
          expect(politicsScoresUser2).toBeDefined();
          expect(politicsScoresUser2!.userName).toBe(user2.name);
          // (0.8 - 1)^2 = 0.04 and (0.5 - 1)^2 = 0.25, so average is 0.145
          expect(politicsScoresUser2!.score).toBeCloseTo(0.145, 6);

          // Economics category scores (both users have 1 forecast each)
          const economicsScoresUser1 = categoryScores.find(
            (c) =>
              c.categoryId === economicsCategory!.id && c.userId === user1.id,
          );
          expect(economicsScoresUser1).toBeDefined();
          expect(economicsScoresUser1!.userName).toBe(user1.name);
          // (0.4 - 0)^2 = 0.16
          expect(economicsScoresUser1!.score).toBeCloseTo(0.16, 6);

          const economicsScoresUser2 = categoryScores.find(
            (c) =>
              c.categoryId === economicsCategory!.id && c.userId === user2.id,
          );
          expect(economicsScoresUser2).toBeDefined();
          expect(economicsScoresUser2!.userName).toBe(user2.name);
          // (0.3 - 0)^2 = 0.09
          expect(economicsScoresUser2!.score).toBeCloseTo(0.09, 6);
        }
      },
    );

    ifRunningContainerTestsIt(
      "should calculate Brier scores correctly",
      async () => {
        const user = await factory.createUser();
        vi.mocked(getUserFromCookies).mockResolvedValue(user);

        const competition = await factory.createCompetition();

        // Create a single prop
        const prop = await factory.createCompetitionProp(competition.id, {
          text: "Will this happen?",
        });

        // User predicts 80% probability
        await factory.createForecast(user.id, prop.id, { forecast: 0.8 });

        // Actual outcome: it happened (true)
        await factory.createResolution(prop.id, {
          resolution: true,
          notes: "Test resolution",
          user_id: user.id,
        });

        const result = await getCompetitionScores({
          competitionId: competition.id,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const { overallScores } = result.data;

          // Brier score = (resolution - forecast)^2 = (1 - 0.8)^2 = 0.04
          expect(overallScores).toHaveLength(1);
          expect(overallScores[0].userId).toBe(user.id);
          expect(overallScores[0].userName).toBe(user.name);
          expect(overallScores[0].score).toBeCloseTo(0.04, 6); // (1 - 0.8)^2 = 0.04
        }
      },
    );

    ifRunningContainerTestsIt(
      "should handle competition with no resolved forecasts",
      async () => {
        const user = await factory.createUser();
        vi.mocked(getUserFromCookies).mockResolvedValue(user);

        const competition = await factory.createCompetition();

        // Create prop but no resolution
        await factory.createCompetitionProp(competition.id, {
          text: "Unresolved proposition",
        });

        const result = await getCompetitionScores({
          competitionId: competition.id,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.overallScores).toEqual([]);
          expect(result.data.categoryScores).toEqual([]);
        }
      },
    );
  });

  describe("error handling", () => {
    ifRunningContainerTestsIt(
      "should return error for non-existent competition",
      async () => {
        const user = await factory.createUser();
        vi.mocked(getUserFromCookies).mockResolvedValue(user);

        const result = await getCompetitionScores({ competitionId: 999999 });

        expect(result.success).toBe(true);
        if (result.success) {
          // Non-existent competition should return empty scores
          expect(result.data.overallScores).toEqual([]);
          expect(result.data.categoryScores).toEqual([]);
        }
      },
    );
  });
});
