import { vi, describe, expect, beforeEach } from "vitest";
import { getTestDb } from "../../tests/helpers/testDatabase";
import { TestDataFactory } from "../../tests/helpers/testFactories";
import {
  shouldRunContainerTests,
  ifRunningContainerTestsIt,
} from "../../tests/helpers/testUtils";

let getRecentlyResolvedForecasts: typeof import("./forecasts").getRecentlyResolvedForecasts;
let getPropsWithUserForecasts: typeof import("./forecasts").getPropsWithUserForecasts;

// `forecasts.ts` transitively imports the server-only `attachOptions` helper.
vi.mock("server-only", () => ({}));

// Mock getUserFromCookies
vi.mock("@/lib/get-user", () => ({
  getUserFromCookies: vi.fn(),
}));

import { getUserFromCookies } from "@/lib/get-user";

describe("getRecentlyResolvedForecasts", () => {
  let testDb: any;
  let factory: TestDataFactory;

  beforeEach(async () => {
    if (shouldRunContainerTests()) {
      testDb = await getTestDb();
      factory = new TestDataFactory(testDb);
      vi.clearAllMocks();

      const forecastsModule = await import("./forecasts");
      getRecentlyResolvedForecasts =
        forecastsModule.getRecentlyResolvedForecasts;
    } else {
      vi.clearAllMocks();
    }
  });

  ifRunningContainerTestsIt(
    "should return only resolved forecasts for the specified user",
    async () => {
      const user = await factory.createUser({ name: "Test User" });
      vi.mocked(getUserFromCookies).mockResolvedValue(user);

      const competition = await factory.createCompetition();

      // Create two props - one resolved, one not
      const resolvedProp = await factory.createCompetitionProp(competition.id, {
        text: "Resolved prop",
      });
      const unresolvedProp = await factory.createCompetitionProp(
        competition.id,
        {
          text: "Unresolved prop",
        },
      );

      // Create forecasts for both
      await factory.createForecast(user.id, resolvedProp.id, { forecast: 0.7 });
      await factory.createForecast(user.id, unresolvedProp.id, {
        forecast: 0.5,
      });

      // Only resolve one prop
      await factory.createResolution(resolvedProp.id, {
        resolution: true,
        notes: "It happened",
        user_id: user.id,
      });

      const result = await getRecentlyResolvedForecasts({ userId: user.id });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].prop_text).toBe("Resolved prop");
        expect(result.data[0].resolution).toBe(true);
      }
    },
  );

  ifRunningContainerTestsIt(
    "should respect the limit parameter",
    async () => {
      const user = await factory.createUser({ name: "Test User" });
      vi.mocked(getUserFromCookies).mockResolvedValue(user);

      const competition = await factory.createCompetition();

      // Create 5 resolved props
      for (let i = 0; i < 5; i++) {
        const prop = await factory.createCompetitionProp(competition.id, {
          text: `Prop ${i}`,
        });
        await factory.createForecast(user.id, prop.id, { forecast: 0.5 });
        await factory.createResolution(prop.id, {
          resolution: true,
          notes: `Resolution ${i}`,
          user_id: user.id,
        });
      }

      const result = await getRecentlyResolvedForecasts({
        userId: user.id,
        limit: 2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    },
  );
});

describe("getPropsWithUserForecasts", () => {
  let testDb: any;
  let factory: TestDataFactory;

  beforeEach(async () => {
    if (shouldRunContainerTests()) {
      testDb = await getTestDb();
      factory = new TestDataFactory(testDb);
      vi.clearAllMocks();

      const forecastsModule = await import("./forecasts");
      getPropsWithUserForecasts = forecastsModule.getPropsWithUserForecasts;
    } else {
      vi.clearAllMocks();
    }
  });

  ifRunningContainerTestsIt(
    "returns no options for a binary prop and option summaries for a choice prop",
    async () => {
      const user = await factory.createUser();
      vi.mocked(getUserFromCookies).mockResolvedValue(user);

      const competition = await factory.createCompetition();
      const binaryProp = await factory.createCompetitionProp(competition.id, {
        text: "Binary prop",
      });
      await factory.createForecast(user.id, binaryProp.id, { forecast: 0.7 });

      const { prop: choiceProp, options } = await factory.createChoiceProp(
        "one_of",
        ["Red", "Green", "Blue"],
        { competition_id: competition.id, text: "Choice prop" },
      );
      await factory.createChoiceForecast(user.id, choiceProp.id, [
        { optionId: options[0].id, probability: 0.6 },
        { optionId: options[1].id, probability: 0.3 },
        { optionId: options[2].id, probability: 0.1 },
      ]);

      const result = await getPropsWithUserForecasts({
        userId: user.id,
        competitionId: competition.id,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const binary = result.data.find((p) => p.prop_id === binaryProp.id)!;
      expect(binary.prop_kind).toBe("binary");
      expect(binary.options).toEqual([]);
      // `forecasts.forecast` is a numeric column, which pg returns as a string.
      expect(Number(binary.user_forecast)).toBe(0.7);
      expect(binary.user_forecast_id).not.toBeNull();

      const choice = result.data.find((p) => p.prop_id === choiceProp.id)!;
      expect(choice.prop_kind).toBe("one_of");
      expect(choice.user_forecast).toBeNull();
      expect(choice.user_forecast_id).not.toBeNull();
      expect(choice.options.map((o) => o.text)).toEqual([
        "Red",
        "Green",
        "Blue",
      ]);
      expect(choice.options.map((o) => o.user_forecast)).toEqual([
        0.6, 0.3, 0.1,
      ]);
      expect(choice.options.map((o) => Number(o.community_average))).toEqual([
        0.6, 0.3, 0.1,
      ]);
      expect(choice.options.every((o) => o.outcome === null)).toBe(true);
    },
  );
});
