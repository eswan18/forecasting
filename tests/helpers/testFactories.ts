import { Kysely } from "kysely";
import { Database } from "@/types/db_types";
import argon2 from "argon2";

export interface TestUser {
  id: number;
  name: string;
  email: string;
  login_id: number | null;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
  // Include login info for convenience in tests
  username?: string;
}

export interface TestProp {
  id: string;
  text: string;
  category_id: number | null;
  competition_id: number | null;
  user_id: number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TestCompetition {
  id: string;
  name: string;
  forecasts_due_date: Date;
  end_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TestForecast {
  id: string;
  user_id: string;
  prop_id: string;
  forecast: number;
  created_at: Date;
  updated_at: Date;
}

export class TestDataFactory {
  constructor(private db: Kysely<Database>) {}

  async createUser(
    overrides: Partial<TestUser> & {
      username?: string;
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
    const SALT = process.env.ARGON2_SALT || "test_salt";
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
      username: login?.username,
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
      .returning(["id", "name", "forecasts_due_date", "end_date"])
      .executeTakeFirst();

    return {
      id: result!.id.toString(),
      name: result!.name,
      forecasts_due_date: result!.forecasts_due_date,
      end_date: result!.end_date,
      created_at: new Date(),
      updated_at: new Date(),
    };
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
      .returning([
        "id",
        "text",
        "category_id",
        "competition_id",
        "user_id",
        "notes",
      ])
      .executeTakeFirst();

    return {
      id: result!.id.toString(),
      text: result!.text,
      category_id: result!.category_id,
      competition_id: result!.competition_id,
      user_id: result!.user_id,
      notes: result!.notes,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createForecast(
    userId: string,
    propId: string,
    overrides: Partial<TestForecast> = {},
  ): Promise<TestForecast> {
    const defaults = {
      user_id: parseInt(userId),
      prop_id: parseInt(propId),
      forecast: Math.round(Math.random() * 100) / 100, // Random probability between 0 and 1
    };

    const forecastData = { ...defaults, ...overrides } as any;

    const result = await this.db
      .insertInto("forecasts")
      .values(forecastData)
      .returning(["id", "user_id", "prop_id", "forecast"])
      .executeTakeFirst();

    return {
      id: result!.id.toString(),
      user_id: userId,
      prop_id: propId,
      forecast: result!.forecast,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createAdminUser(
    overrides: Partial<TestUser> & {
      username?: string;
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
    userId: string,
    overrides: Partial<TestProp> = {},
  ): Promise<TestProp> {
    return this.createProp({
      user_id: userId as any,
      competition_id: null,
      ...overrides,
    });
  }

  async createCompetitionProp(
    competitionId: string,
    overrides: Partial<TestProp> = {},
  ): Promise<TestProp> {
    return this.createProp({
      competition_id: competitionId as any,
      user_id: null,
      ...overrides,
    });
  }
}
