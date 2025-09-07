import { vi } from "vitest";

/**
 * Shared mock configurations for testcontainer tests
 */

/**
 * Mock getUserFromCookies since we're testing database actions in isolation
 */
export function mockGetUserFromCookies() {
  vi.mock("@/lib/get-user", () => ({
    getUserFromCookies: vi.fn(),
  }));
}

/**
 * Mock logger to avoid console output during tests
 */
export function mockLogger() {
  vi.mock("@/lib/logger", () => ({
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  }));
}

/**
 * Mock database connection to use test database instead of production
 * Returns the variable that should be set to the test database instance
 */
export function mockDatabase(): { originalDb: any } {
  let originalDb: any;
  
  vi.mock("@/lib/database", async () => {
    const actual = await vi.importActual("@/lib/database");
    return {
      ...actual,
      get db() { return originalDb; }
    };
  });
  
  return { originalDb };
}

/**
 * Mock revalidatePath since we don't need to test cache revalidation
 */
export function mockRevalidatePath() {
  vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
  }));
}