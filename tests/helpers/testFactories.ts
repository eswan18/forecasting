import { Kysely } from "kysely";
import crypto from "crypto";
import {
  Database,
  User,
  Prop,
  Competition,
  Forecast,
  Category,
  Resolution,
} from "@/types/db_types";
import { getTestTracker } from "./testIdTracker";

// Use existing types from the codebase
export type TestUser = User;
export type TestProp = Prop;
export type TestCompetition = Competition;
export type TestForecast = Forecast;
export type TestCategory = Category;
export type TestResolution = Resolution;

export class TestDataFactory {
  constructor(private db: Kysely<Database>) {}

  /**
   * Get the tracker for the current test.
   * Each test gets its own tracker instance.
   */
  private getTracker() {
    return getTestTracker();
  }

  async createUser(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    const name =
      overrides.name || `testuser_${Math.random().toString(36).substring(7)}`;
    const email =
      overrides.email ||
      `test_${Math.random().toString(36).substring(7)}@example.com`;
    const isAdmin = overrides.is_admin || false;
    const idpUserId = overrides.idp_user_id || crypto.randomUUID();

    // Create user record directly with test database (no login needed)
    const userResult = await this.db
      .insertInto("users")
      .values({
        name,
        email,
        is_admin: isAdmin,
        idp_user_id: idpUserId,
      })
      .returning("id")
      .executeTakeFirst();

    if (!userResult) {
      throw new Error("Failed to create user record");
    }

    // Track the user ID
    this.getTracker().trackId("users", userResult.id);

    // Fetch created user to return a rich object
    const createdUser = await this.db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", userResult.id)
      .executeTakeFirst();

    if (!createdUser) {
      throw new Error("Created user not found in database");
    }

    return createdUser;
  }

  async createCompetition(
    overrides: Partial<TestCompetition> = {},
  ): Promise<TestCompetition> {
    const closeDate = overrides.forecasts_close_date || new Date();
    const defaults = {
      name: `Test Competition ${Math.random().toString(36).substring(7)}`,
      forecasts_open_date: new Date(
        closeDate.getTime() - 7 * 24 * 60 * 60 * 1000,
      ), // 7 days before close date
      forecasts_close_date: closeDate,
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      is_private: false, // Public competition by default
    };

    const competitionData = { ...defaults, ...overrides } as any;

    const result = await this.db
      .insertInto("competitions")
      .values(competitionData)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      throw new Error("Failed to create competition");
    }

    // Track the competition ID (but exclude seed competitions with IDs 1 and 2)
    if (result.id !== 1 && result.id !== 2) {
      this.getTracker().trackId("competitions", result.id);
    }

    return result;
  }

  async createProp(overrides: Partial<TestProp> = {}): Promise<TestProp> {
    const defaults = {
      text: `Test proposition text ${Math.random().toString(36).substring(7)}`,
      category_id: 1, // Default to first category (politics)
      competition_id: null,
      user_id: null,
      notes: null,
    };

    const propData = { ...defaults, ...overrides } as any;

    const result = await this.db
      .insertInto("props")
      .values(propData)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      throw new Error("Failed to create prop");
    }

    // Track the prop ID
    this.getTracker().trackId("props", result.id);

    return result;
  }

  async createForecast(
    userId: number,
    propId: number,
    overrides: Partial<TestForecast> = {},
  ): Promise<TestForecast> {
    const defaults = {
      user_id: userId,
      prop_id: propId,
      forecast: Math.round(Math.random() * 100) / 100, // Random probability between 0 and 1
    };

    const forecastData = { ...defaults, ...overrides } as any;

    const result = await this.db
      .insertInto("forecasts")
      .values(forecastData)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      throw new Error("Failed to create forecast");
    }

    // Track the forecast ID
    this.getTracker().trackId("forecasts", result.id);

    return result;
  }

  async createAdminUser(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    return this.createUser({
      is_admin: true,
      name: `admin_${Math.random().toString(36).substring(7)}`,
      ...overrides,
    });
  }

  async createPersonalProp(
    userId: number,
    overrides: Partial<TestProp> = {},
  ): Promise<TestProp> {
    return this.createProp({
      user_id: userId,
      competition_id: null,
      ...overrides,
    });
  }

  async createCompetitionProp(
    competitionId: number,
    overrides: Partial<TestProp> = {},
  ): Promise<TestProp> {
    return this.createProp({
      competition_id: competitionId,
      user_id: null,
      ...overrides,
    });
  }

  async createCategory(
    overrides: Partial<TestCategory> = {},
  ): Promise<TestCategory> {
    const defaults = {
      name: `Test Category ${Math.random().toString(36).substring(7)}`,
    };

    const categoryData = { ...defaults, ...overrides } as any;

    const result = await this.db
      .insertInto("categories")
      .values(categoryData)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      throw new Error("Failed to create category");
    }

    // Track the category ID
    this.getTracker().trackId("categories", result.id);

    return result;
  }

  async createResolution(
    propId: number,
    overrides: Partial<Omit<TestResolution, "id" | "prop_id">> = {},
  ): Promise<TestResolution> {
    const defaults = {
      resolution: true,
      notes: null,
      user_id: null,
      resolved_at: new Date(), // Required NOT NULL column in database schema
    };

    const resolutionData = {
      prop_id: propId,
      ...defaults,
      ...overrides,
    } as any;

    const result = await this.db
      .insertInto("resolutions")
      .values(resolutionData)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      throw new Error("Failed to create resolution");
    }

    // Track the resolution ID
    this.getTracker().trackId("resolutions", result.id);

    return result;
  }
}
