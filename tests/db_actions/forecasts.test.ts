import { describe, it, expect, beforeEach } from "vitest";
import { getTestDb } from "../helpers/testDatabase";
import { TestDataFactory } from "../helpers/testFactories";
import { getForecasts, createForecast } from "@/lib/db_actions/forecasts";

// Mock getUserFromCookies since we're testing database actions in isolation
vi.mock("@/lib/get-user", () => ({
  getUserFromCookies: vi.fn(),
}));

// Mock logger to avoid console output during tests
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock revalidatePath since we don't need to test cache revalidation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock the database module - we'll replace the implementation in beforeEach
let originalDb: any;
vi.mock("@/lib/database", async () => {
  const actual = await vi.importActual("@/lib/database");
  return {
    ...actual,
    get db() { return originalDb; }
  };
});

import { getUserFromCookies } from "@/lib/get-user";

describe("Forecasts Database Actions", () => {
  let testDb: any;
  let factory: TestDataFactory;

  beforeEach(async () => {
    testDb = await getTestDb();
    factory = new TestDataFactory(testDb);
    
    // Replace the mocked database with our test database
    originalDb = testDb;
  });

  describe("getForecasts", () => {
    it("should return all forecasts when no filters applied", async () => {
      const user1 = await factory.createUser();
      const user2 = await factory.createUser();
      const prop1 = await factory.createProp();
      const prop2 = await factory.createProp();

      await factory.createForecast(user1.id, prop1.id, { forecast: 0.7 });
      await factory.createForecast(user2.id, prop2.id, { forecast: 0.3 });

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user1.id,
        name: user1.username,
        email: user1.email,
        is_admin: user1.is_admin,
      });

      const result = await getForecasts({});

      expect(result).toHaveLength(2);
      expect(result.some(f => parseFloat(f.forecast.toString()) === 0.7)).toBe(true);
      expect(result.some(f => parseFloat(f.forecast.toString()) === 0.3)).toBe(true);
    });

    it("should filter forecasts by userId", async () => {
      const user1 = await factory.createUser();
      const user2 = await factory.createUser();
      const prop = await factory.createProp();

      await factory.createForecast(user1.id, prop.id, { forecast: 0.7 });
      await factory.createForecast(user2.id, prop.id, { forecast: 0.3 });

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user1.id,
        name: user1.username,
        email: user1.email,
        is_admin: user1.is_admin,
      });

      // Get actual user ID from database
      const dbUser1 = await testDb
        .selectFrom("users")
        .select("id")
        .where("email", "=", user1.email)
        .executeTakeFirst();

      const result = await getForecasts({ userId: dbUser1.id });

      expect(result).toHaveLength(1);
      expect(parseFloat(result[0].forecast.toString())).toBe(0.7);
    });

    it("should filter forecasts by competition", async () => {
      const user = await factory.createUser();
      const competition = await factory.createCompetition();
      const propInComp = await factory.createCompetitionProp(competition.id);
      const propNotInComp = await factory.createProp();

      await factory.createForecast(user.id, propInComp.id, { forecast: 0.7 });
      await factory.createForecast(user.id, propNotInComp.id, { forecast: 0.3 });

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      // Get actual competition ID from database
      const dbComp = await testDb
        .selectFrom("competitions")
        .select("id")
        .where("name", "=", competition.name)
        .executeTakeFirst();

      const result = await getForecasts({ competitionId: dbComp.id });

      expect(result).toHaveLength(1);
      expect(parseFloat(result[0].forecast.toString())).toBe(0.7);
    });

    it("should filter forecasts outside competitions", async () => {
      const user = await factory.createUser();
      const competition = await factory.createCompetition();
      const propInComp = await factory.createCompetitionProp(competition.id);
      const propNotInComp = await factory.createProp();

      await factory.createForecast(user.id, propInComp.id, { forecast: 0.7 });
      await factory.createForecast(user.id, propNotInComp.id, { forecast: 0.3 });

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      const result = await getForecasts({ competitionId: null });

      expect(result).toHaveLength(1);
      expect(parseFloat(result[0].forecast.toString())).toBe(0.3);
    });

    it("should apply sorting when provided", async () => {
      const user = await factory.createUser();
      const prop1 = await factory.createProp();
      const prop2 = await factory.createProp();

      await factory.createForecast(user.id, prop1.id, { forecast: 0.3 });
      await factory.createForecast(user.id, prop2.id, { forecast: 0.7 });

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      const result = await getForecasts({ 
        sort: { expr: "forecast", modifiers: "asc" } 
      });

      expect(result).toHaveLength(2);
      expect(parseFloat(result[0].forecast.toString())).toBe(0.3);
      expect(parseFloat(result[1].forecast.toString())).toBe(0.7);
    });
  });

  describe("createForecast", () => {
    it("should create a new forecast successfully", async () => {
      const user = await factory.createUser();
      const prop = await factory.createProp();

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      // Get actual IDs from database
      const dbUser = await testDb
        .selectFrom("users")
        .select("id")
        .where("email", "=", user.email)
        .executeTakeFirst();

      const dbProp = await testDb
        .selectFrom("props")
        .select("id")
        .where("text", "=", prop.text)
        .executeTakeFirst();

      const forecastData = {
        user_id: dbUser.id,
        prop_id: dbProp.id,
        forecast: 0.75,
      };

      const forecastId = await createForecast({ forecast: forecastData });

      expect(forecastId).toBeDefined();
      expect(typeof forecastId).toBe("number");

      // Verify forecast was created in database
      const createdForecast = await testDb
        .selectFrom("forecasts")
        .selectAll()
        .where("id", "=", forecastId)
        .executeTakeFirst();

      expect(createdForecast).toBeDefined();
      expect(createdForecast.user_id).toBe(dbUser.id);
      expect(createdForecast.prop_id).toBe(dbProp.id);
      expect(parseFloat(createdForecast.forecast.toString())).toBe(0.75);
    });

    it("should prevent duplicate forecasts for same user-prop combination", async () => {
      const user = await factory.createUser();
      const prop = await factory.createProp();

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      // Get actual IDs from database
      const dbUser = await testDb
        .selectFrom("users")
        .select("id")
        .where("email", "=", user.email)
        .executeTakeFirst();

      const dbProp = await testDb
        .selectFrom("props")
        .select("id")
        .where("text", "=", prop.text)
        .executeTakeFirst();

      const forecastData = {
        user_id: dbUser.id,
        prop_id: dbProp.id,
        forecast: 0.75,
      };

      // Create first forecast
      await createForecast({ forecast: forecastData });

      // Try to create duplicate forecast
      await expect(createForecast({ forecast: forecastData })).rejects.toThrow();
    });

    it("should prevent forecasts past due date for competition props", async () => {
      const user = await factory.createUser();
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const competition = await factory.createCompetition({ 
        end_date: pastDate,
      });
      const prop = await factory.createCompetitionProp(competition.id);

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      // Get actual IDs from database
      const dbUser = await testDb
        .selectFrom("users")
        .select("id")
        .where("email", "=", user.email)
        .executeTakeFirst();

      const dbProp = await testDb
        .selectFrom("props")
        .select("id")
        .where("text", "=", prop.text)
        .executeTakeFirst();

      const forecastData = {
        user_id: dbUser.id,
        prop_id: dbProp.id,
        forecast: 0.75,
      };

      await expect(createForecast({ forecast: forecastData })).rejects.toThrow(
        "Cannot create forecasts past the due date"
      );
    });
  });
});