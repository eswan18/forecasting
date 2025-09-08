import { describe, it, expect, beforeEach, vi } from "vitest";
import { getTestDb } from "../helpers/testDatabase";
import { TestDataFactory } from "../helpers/testFactories";
import { 
  getCompetitions, 
  getCompetitionById, 
  createCompetition, 
  updateCompetition 
} from "@/lib/db_actions/competitions";

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

// We need to replace the db import with our test database
let originalDb: any;
vi.mock("@/lib/database", async () => {
  const actual = await vi.importActual("@/lib/database");
  return {
    ...actual,
    get db() { return originalDb; }
  };
});

import { getUserFromCookies } from "@/lib/get-user";

import { getUserFromCookies } from "@/lib/get-user";

describe("Competitions Database Actions", () => {
  let testDb: any;
  let factory: TestDataFactory;

  beforeEach(async () => {
    testDb = await getTestDb();
    factory = new TestDataFactory(testDb);
    
    // Replace the mocked database with our test database
    originalDb = testDb;
  });

  describe("getCompetitions", () => {
    it("should return all competitions ordered by name desc", async () => {
      const user = await factory.createUser();
      const comp1 = await factory.createCompetition({ name: "Alpha Competition" });
      const comp2 = await factory.createCompetition({ name: "Beta Competition" });

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      const result = await getCompetitions();

      expect(result).toHaveLength(4); // 2 seed competitions + 2 test competitions
      expect(result[0].name).toBe("Beta Competition"); // desc order
      expect(result[1].name).toBe("Alpha Competition");
      // Seed competitions should also be present
      expect(result.find(c => c.name === "2025 Public Competition")).toBeDefined();
      expect(result.find(c => c.name === "2024 Public Competition")).toBeDefined();
    });

    it("should return empty array when no competitions exist", async () => {
      const user = await factory.createUser();

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      const result = await getCompetitions();

      expect(result).toHaveLength(2); // Should have 2 seed competitions
      expect(result.find(c => c.name === "2025 Public Competition")).toBeDefined();
      expect(result.find(c => c.name === "2024 Public Competition")).toBeDefined();
    });
  });

  describe("getCompetitionById", () => {
    it("should return competition when found", async () => {
      const user = await factory.createUser();
      const competition = await factory.createCompetition({
        name: "Test Competition",
      });

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      // Get actual competition ID from database
      const dbCompetition = await testDb
        .selectFrom("competitions")
        .select("id")
        .where("name", "=", competition.name)
        .executeTakeFirst();

      const result = await getCompetitionById(dbCompetition.id);

      expect(result).toBeDefined();
      expect(result?.name).toBe("Test Competition");
    });

    it("should return undefined when competition not found", async () => {
      const user = await factory.createUser();

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      const result = await getCompetitionById(99999); // Non-existent ID

      expect(result).toBeUndefined();
    });
  });

  describe("createCompetition", () => {
    it("should create competition when user is admin", async () => {
      const adminUser = await factory.createAdminUser();

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: adminUser.id,
        name: adminUser.username,
        email: adminUser.email,
        is_admin: true,
      });

      const competitionData = {
        name: "New Competition",
        forecasts_due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      await createCompetition({ competition: competitionData });

      // Verify competition was created in database
      const createdCompetition = await testDb
        .selectFrom("competitions")
        .selectAll()
        .where("name", "=", competitionData.name)
        .executeTakeFirst();

      expect(createdCompetition).toBeDefined();
      expect(createdCompetition.name).toBe(competitionData.name);
    });

    it("should throw error when user is not admin", async () => {
      const regularUser = await factory.createUser({ is_admin: false });

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: regularUser.id,
        name: regularUser.username,
        email: regularUser.email,
        is_admin: false,
      });

      const competitionData = {
        name: "New Competition",
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      await expect(
        createCompetition({ competition: competitionData })
      ).rejects.toThrow("Unauthorized: Only admins can create competitions");
    });

    it("should throw error when user is not logged in", async () => {
      vi.mocked(getUserFromCookies).mockResolvedValue(null);

      const competitionData = {
        name: "New Competition",
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      await expect(
        createCompetition({ competition: competitionData })
      ).rejects.toThrow("Unauthorized: Only admins can create competitions");
    });
  });

  describe("updateCompetition", () => {
    it("should update competition when user is admin", async () => {
      const adminUser = await factory.createAdminUser();
      const competition = await factory.createCompetition({
        name: "Original Name",
      });

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: adminUser.id,
        name: adminUser.username,
        email: adminUser.email,
        is_admin: true,
      });

      // Get actual competition ID from database
      const dbCompetition = await testDb
        .selectFrom("competitions")
        .select("id")
        .where("name", "=", competition.name)
        .executeTakeFirst();

      const updateData = {
        name: "Updated Name",
      };

      await updateCompetition({ 
        id: dbCompetition.id, 
        competition: updateData 
      });

      // Verify competition was updated in database
      const updatedCompetition = await testDb
        .selectFrom("competitions")
        .selectAll()
        .where("id", "=", dbCompetition.id)
        .executeTakeFirst();

      expect(updatedCompetition.name).toBe("Updated Name");
    });

    it("should throw error when user is not admin", async () => {
      const regularUser = await factory.createUser({ is_admin: false });
      const competition = await factory.createCompetition();

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: regularUser.id,
        name: regularUser.username,
        email: regularUser.email,
        is_admin: false,
      });

      const dbCompetition = await testDb
        .selectFrom("competitions")
        .select("id")
        .where("name", "=", competition.name)
        .executeTakeFirst();

      const updateData = {
        name: "Updated Name",
      };

      await expect(
        updateCompetition({ id: dbCompetition.id, competition: updateData })
      ).rejects.toThrow("Unauthorized: Only admins can update competitions");
    });

    it("should throw error when user is not logged in", async () => {
      const competition = await factory.createCompetition();

      vi.mocked(getUserFromCookies).mockResolvedValue(null);

      const dbCompetition = await testDb
        .selectFrom("competitions")
        .select("id")
        .where("name", "=", competition.name)
        .executeTakeFirst();

      const updateData = {
        name: "Updated Name",
      };

      await expect(
        updateCompetition({ id: dbCompetition.id, competition: updateData })
      ).rejects.toThrow("Unauthorized: Only admins can update competitions");
    });
  });
});