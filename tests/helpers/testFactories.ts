import { Kysely } from "kysely";
import crypto from "crypto";
import {
  Database,
  User,
  Prop,
  PropOption,
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

    this.getTracker().trackId("resolutions", result.id);

    return result;
  }

  /**
   * A choice prop with its options. Returns the prop plus its option rows
   * ordered by position.
   */
  async createChoiceProp(
    kind: "one_of" | "any_of",
    labels: string[],
    overrides: Partial<TestProp> = {},
  ): Promise<{ prop: TestProp; options: PropOption[] }> {
    const prop = await this.createProp({ ...overrides, kind });
    const options: PropOption[] = [];
    for (const [position, text] of labels.entries()) {
      const option = await this.db
        .insertInto("prop_options")
        .values({ prop_id: prop.id, text, position })
        .returningAll()
        .executeTakeFirstOrThrow();
      // Not tracked: cascades from the prop delete.
      options.push(option);
    }
    return { prop, options };
  }

  /** A choice forecast: header row with a null forecast plus one child per option. */
  async createChoiceForecast(
    userId: number,
    propId: number,
    probabilities: { optionId: number; probability: number }[],
  ): Promise<TestForecast> {
    const header = await this.db
      .insertInto("forecasts")
      .values({ user_id: userId, prop_id: propId, forecast: null })
      .returningAll()
      .executeTakeFirstOrThrow();
    this.getTracker().trackId("forecasts", header.id);
    await this.db
      .insertInto("forecast_options")
      .values(
        probabilities.map((p) => ({
          forecast_id: header.id,
          prop_id: propId,
          option_id: p.optionId,
          probability: p.probability,
        })),
      )
      .execute();
    return header;
  }

  /** A choice resolution: header row with a null resolution plus one child per option. */
  async createChoiceResolution(
    propId: number,
    outcomes: { optionId: number; outcome: boolean }[],
    overrides: Partial<
      Omit<TestResolution, "id" | "prop_id" | "resolution">
    > = {},
  ): Promise<TestResolution> {
    const header = await this.db
      .insertInto("resolutions")
      .values({
        prop_id: propId,
        resolution: null,
        notes: null,
        user_id: null,
        ...overrides,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    this.getTracker().trackId("resolutions", header.id);
    await this.db
      .insertInto("resolution_options")
      .values(
        outcomes.map((o) => ({
          resolution_id: header.id,
          prop_id: propId,
          option_id: o.optionId,
          outcome: o.outcome,
        })),
      )
      .execute();
    return header;
  }
}
