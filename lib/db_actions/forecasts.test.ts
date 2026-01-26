import { vi, describe, expect, beforeEach } from "vitest";
import { getTestDb } from "../../tests/helpers/testDatabase";
import { TestDataFactory } from "../../tests/helpers/testFactories";
import {
  shouldRunContainerTests,
  ifRunningContainerTestsIt,
} from "../../tests/helpers/testUtils";

let getRecentlyResolvedForecasts: typeof import("./forecasts").getRecentlyResolvedForecasts;

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
