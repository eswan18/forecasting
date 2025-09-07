import { Kysely } from "kysely";
import { Database, User, Prop, Competition, Forecast } from "@/types/db_types";
import argon2 from "argon2";

const SALT = process.env.ARGON2_SALT || "test_salt";

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(SALT + password, {
    type: argon2.argon2id,
  });
}

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
  password_hash?: string;
}

export interface TestProp {
  id: string;
  title: string;
  description: string;
  category: string | null;
  competition_id: string | null;
  user_id: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TestCompetition {
  id: string;
  name: string;
  description: string | null;
  start_date: Date;
  end_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TestForecast {
  id: string;
  user_id: string;
  prop_id: string;
  probability: number;
  created_at: Date;
  updated_at: Date;
}

export class TestDataFactory {
  constructor(private db: Kysely<Database>) {}

  async createUser(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    const username = overrides.username || `testuser_${Math.random().toString(36).substring(7)}`;
    const password_hash = overrides.password_hash || await hashPassword("testpassword123");
    const email = overrides.email || `test_${Math.random().toString(36).substring(7)}@example.com`;
    const name = overrides.name || username;
    const is_admin = overrides.is_admin || false;

    // First create login record
    const loginResult = await this.db
      .insertInto("logins")
      .values({
        username,
        password_hash
      })
      .returning("id")
      .executeTakeFirst();

    if (!loginResult) {
      throw new Error("Failed to create login record");
    }

    // Then create user record
    const userResult = await this.db
      .insertInto("users")
      .values({
        name,
        email,
        login_id: loginResult.id,
        is_admin
      })
      .returning(["id", "name", "email", "login_id", "is_admin", "created_at", "updated_at"])
      .executeTakeFirst();

    if (!userResult) {
      throw new Error("Failed to create user record");
    }

    // Return combined data for convenience in tests
    return {
      ...userResult,
      username,
      password_hash
    };
  }

  async createCompetition(overrides: Partial<TestCompetition> = {}): Promise<TestCompetition> {
    const defaults = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: `Test Competition ${Math.random().toString(36).substring(7)}`,
      description: "A test competition for forecasting",
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      created_at: new Date(),
      updated_at: new Date(),
    };

    const competitionData = { ...defaults, ...overrides };
    
    await this.db
      .insertInto("competitions")
      .values(competitionData)
      .execute();

    return competitionData;
  }

  async createProp(overrides: Partial<TestProp> = {}): Promise<TestProp> {
    const defaults = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      title: `Test Proposition ${Math.random().toString(36).substring(7)}`,
      description: "A test proposition for forecasting",
      category: "test",
      competition_id: null,
      user_id: null,
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const propData = { ...defaults, ...overrides };
    
    await this.db
      .insertInto("props")
      .values(propData)
      .execute();

    return propData;
  }

  async createForecast(
    userId: string, 
    propId: string, 
    overrides: Partial<TestForecast> = {}
  ): Promise<TestForecast> {
    const defaults = {
      id: `forecast_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      user_id: userId,
      prop_id: propId,
      probability: Math.round(Math.random() * 100) / 100, // Random probability between 0 and 1
      created_at: new Date(),
      updated_at: new Date(),
    };

    const forecastData = { ...defaults, ...overrides };
    
    await this.db
      .insertInto("forecasts")
      .values(forecastData)
      .execute();

    return forecastData;
  }

  async createAdminUser(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    return this.createUser({ 
      is_admin: true, 
      username: `admin_${Math.random().toString(36).substring(7)}`,
      ...overrides 
    });
  }

  async createPersonalProp(userId: string, overrides: Partial<TestProp> = {}): Promise<TestProp> {
    return this.createProp({ 
      user_id: userId,
      competition_id: null,
      ...overrides 
    });
  }

  async createCompetitionProp(competitionId: string, overrides: Partial<TestProp> = {}): Promise<TestProp> {
    return this.createProp({ 
      competition_id: competitionId,
      user_id: null,
      ...overrides 
    });
  }
}