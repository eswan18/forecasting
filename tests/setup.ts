import { beforeAll, afterAll, beforeEach } from "vitest";

// Only setup testcontainers if Docker is available and TEST_USE_CONTAINERS is true
const useContainers = process.env.TEST_USE_CONTAINERS === "true";

if (useContainers) {
  const { setupTestDatabase, cleanupTestDatabase, getTestDb, cleanupTestData } = await import("./helpers/testDatabase");

  // Global setup and teardown for testcontainers
  beforeAll(async () => {
    await setupTestDatabase();
  }, 300000); // 5 minutes timeout for container setup

  afterAll(async () => {
    await cleanupTestDatabase();
  }, 30000); // 30 seconds timeout for cleanup

  // Clean up test data between tests to ensure isolation
  beforeEach(async () => {
    const db = await getTestDb();
    await cleanupTestData(db);
  });
}