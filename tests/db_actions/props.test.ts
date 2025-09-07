import { describe, it, expect, beforeEach } from "vitest";
import { getTestDb } from "../helpers/testDatabase";
import { TestDataFactory } from "../helpers/testFactories";
import { getProps } from "@/lib/db_actions/props";

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

describe("Props Database Actions", () => {
  let testDb: any;
  let factory: TestDataFactory;

  beforeEach(async () => {
    testDb = await getTestDb();
    factory = new TestDataFactory(testDb);
    
    // Replace the mocked database with our test database
    originalDb = testDb;
  });

  describe("getProps", () => {
    it("should return all props when no filters applied", async () => {
      const user = await factory.createUser();
      const prop1 = await factory.createProp({ text: "Prop 1" });
      const prop2 = await factory.createProp({ text: "Prop 2" });

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      const result = await getProps({});

      expect(result).toHaveLength(2);
      expect(result.some(p => p.prop_text === "Prop 1")).toBe(true);
      expect(result.some(p => p.prop_text === "Prop 2")).toBe(true);
    });

    it("should filter props by single competition ID", async () => {
      const user = await factory.createUser();
      const competition = await factory.createCompetition();
      const propInComp = await factory.createCompetitionProp(competition.id, { 
        text: "Competition Prop" 
      });
      const propNotInComp = await factory.createProp({ 
        text: "Standalone Prop" 
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

      const result = await getProps({ competitionId: dbCompetition.id });

      expect(result).toHaveLength(1);
      expect(result[0].prop_text).toBe("Competition Prop");
    });

    it("should filter props outside competitions (null competition ID)", async () => {
      const user = await factory.createUser();
      const competition = await factory.createCompetition();
      const propInComp = await factory.createCompetitionProp(competition.id, { 
        text: "Competition Prop" 
      });
      const propNotInComp = await factory.createProp({ 
        text: "Standalone Prop" 
      });

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      const result = await getProps({ competitionId: null });

      expect(result).toHaveLength(1);
      expect(result[0].prop_text).toBe("Standalone Prop");
    });

    it("should filter props by multiple competition IDs", async () => {
      const user = await factory.createUser();
      const comp1 = await factory.createCompetition({ name: "Competition 1" });
      const comp2 = await factory.createCompetition({ name: "Competition 2" });
      const comp3 = await factory.createCompetition({ name: "Competition 3" });

      const prop1 = await factory.createCompetitionProp(comp1.id, { 
        text: "Prop in Comp 1" 
      });
      const prop2 = await factory.createCompetitionProp(comp2.id, { 
        text: "Prop in Comp 2" 
      });
      const prop3 = await factory.createCompetitionProp(comp3.id, { 
        text: "Prop in Comp 3" 
      });

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      // Get actual competition IDs from database
      const dbComp1 = await testDb
        .selectFrom("competitions")
        .select("id")
        .where("name", "=", comp1.name)
        .executeTakeFirst();

      const dbComp2 = await testDb
        .selectFrom("competitions")
        .select("id")
        .where("name", "=", comp2.name)
        .executeTakeFirst();

      const result = await getProps({ 
        competitionId: [dbComp1.id, dbComp2.id] 
      });

      expect(result).toHaveLength(2);
      expect(result.some(p => p.prop_text === "Prop in Comp 1")).toBe(true);
      expect(result.some(p => p.prop_text === "Prop in Comp 2")).toBe(true);
      expect(result.some(p => p.prop_text === "Prop in Comp 3")).toBe(false);
    });

    it("should filter props by single user ID (personal props)", async () => {
      const user1 = await factory.createUser();
      const user2 = await factory.createUser();
      const personalProp1 = await factory.createPersonalProp(user1.id, { 
        text: "User 1 Personal Prop" 
      });
      const personalProp2 = await factory.createPersonalProp(user2.id, { 
        text: "User 2 Personal Prop" 
      });
      const publicProp = await factory.createProp({ 
        text: "Public Prop" 
      });

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

      const result = await getProps({ userId: dbUser1.id });

      expect(result).toHaveLength(1);
      expect(result[0].prop_text).toBe("User 1 Personal Prop");
    });

    it("should filter props with null user ID (public props)", async () => {
      const user = await factory.createUser();
      const personalProp = await factory.createPersonalProp(user.id, { 
        text: "Personal Prop" 
      });
      const publicProp = await factory.createProp({ 
        text: "Public Prop" 
      });

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      const result = await getProps({ userId: null });

      expect(result).toHaveLength(1);
      expect(result[0].prop_text).toBe("Public Prop");
    });

    it("should return props in ascending order by prop_id", async () => {
      const user = await factory.createUser();
      
      // Create props in different order
      const prop2 = await factory.createProp({ text: "Second Prop" });
      const prop1 = await factory.createProp({ text: "First Prop" });
      const prop3 = await factory.createProp({ text: "Third Prop" });

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      const result = await getProps({});

      expect(result).toHaveLength(3);
      // Results should be ordered by prop_id ascending
      // The exact order depends on database-generated IDs, but they should be consistent
      for (let i = 1; i < result.length; i++) {
        expect(result[i].prop_id).toBeGreaterThan(result[i-1].prop_id);
      }
    });

    it("should handle combined filters (competition and user)", async () => {
      const user = await factory.createUser();
      const competition = await factory.createCompetition();

      // Create various prop types
      const compProp = await factory.createCompetitionProp(competition.id, { 
        text: "Competition Prop" 
      });
      const personalProp = await factory.createPersonalProp(user.id, { 
        text: "Personal Prop" 
      });
      const publicProp = await factory.createProp({ 
        text: "Public Prop" 
      });

      vi.mocked(getUserFromCookies).mockResolvedValue({
        id: user.id,
        name: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });

      // Get actual IDs from database
      const dbCompetition = await testDb
        .selectFrom("competitions")
        .select("id")
        .where("name", "=", competition.name)
        .executeTakeFirst();

      const dbUser = await testDb
        .selectFrom("users")
        .select("id")
        .where("email", "=", user.email)
        .executeTakeFirst();

      // Filter for both competition props and personal props
      const result = await getProps({ 
        competitionId: dbCompetition.id,
        userId: dbUser.id 
      });

      // Should return props that match either filter (OR logic)
      expect(result).toHaveLength(2);
      expect(result.some(p => p.prop_text === "Competition Prop")).toBe(true);
      expect(result.some(p => p.prop_text === "Personal Prop")).toBe(true);
      expect(result.some(p => p.prop_text === "Public Prop")).toBe(false);
    });
  });
});