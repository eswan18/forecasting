import { Kysely } from "kysely";
import { Database, User, Prop, Competition, Forecast } from "@/types/db_types";
import argon2 from "argon2";

// Use existing types from the codebase instead of duplicating interfaces
// Extend User with username field for convenience in tests
export type TestUser = User & {
  username: string | null;
};

// These types match exactly with the database types
export type TestProp = Prop;
export type TestCompetition = Competition;
export type TestForecast = Forecast;

export class TestDataFactory {
  constructor(private db: Kysely<Database>) {}

  async createUser(
    overrides: Partial<TestUser> & {
      password?: string;
    } = {},
  ): Promise<TestUser> {
    const username =
      overrides.username ||
      `testuser_${Math.random().toString(36).substring(7)}`;
    const password = overrides.password || "testpassword123";
    const name =
      overrides.name ||
      overrides.username ||
      `testuser_${Math.random().toString(36).substring(7)}`;
    const email =
      overrides.email ||
      `test_${Math.random().toString(36).substring(7)}@example.com`;
    const isAdmin = overrides.is_admin || false;

    // Create login record directly with test database
    const SALT = process.env.ARGON2_SALT;
    const passwordHash = await argon2.hash(String(SALT) + password, {
      type: argon2.argon2id,
    });

    const loginResult = await this.db
      .insertInto("logins")
      .values({ username, password_hash: passwordHash })
      .returning("id")
      .executeTakeFirst();

    if (!loginResult) {
      throw new Error("Failed to create login record");
    }

    // Create user record directly with test database
    const userResult = await this.db
      .insertInto("users")
      .values({ name, email, login_id: loginResult.id, is_admin: isAdmin })
      .returning("id")
      .executeTakeFirst();

    if (!userResult) {
      throw new Error("Failed to create user record");
    }

    // Fetch created user and associated login to return a rich object
    const createdUser = await this.db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", userResult.id)
      .executeTakeFirst();

    if (!createdUser) {
      throw new Error("Created user not found in database");
    }

    const login = await this.db
      .selectFrom("logins")
      .selectAll()
      .where("id", "=", createdUser.login_id!)
      .executeTakeFirst();

    return {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      login_id: createdUser.login_id,
      is_admin: createdUser.is_admin,
      created_at: createdUser.created_at,
      updated_at: createdUser.updated_at,
      username: login?.username || null,
    };
  }

  async createCompetition(
    overrides: Partial<TestCompetition> = {},
  ): Promise<TestCompetition> {
    const defaults = {
      name: `Test Competition ${Math.random().toString(36).substring(7)}`,
      forecasts_due_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };

    const competitionData = { ...defaults, ...overrides } as any;

    const result = await this.db
      .insertInto("competitions")
      .values(competitionData)
      .returningAll()
      .executeTakeFirst();

    return result!;
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

    return result!;
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

    return result!;
  }

  async createAdminUser(
    overrides: Partial<TestUser> & {
      password?: string;
    } = {},
  ): Promise<TestUser> {
    return this.createUser({
      is_admin: true,
      username: `admin_${Math.random().toString(36).substring(7)}`,
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
}
