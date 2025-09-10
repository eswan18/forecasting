import { beforeEach } from "vitest";

// Only setup testcontainers if Docker is available and TEST_USE_CONTAINERS is true
const useContainers = process.env.TEST_USE_CONTAINERS === "true";

if (useContainers) {
  // Clean up test data between tests to ensure isolation
  // Note: Container setup/teardown is now handled by globalSetup.ts
  beforeEach(async () => {
    const { getTestDb, cleanupTestData } = await import(
      "./helpers/testDatabase"
    );
    const db = await getTestDb();
    await cleanupTestData(db);
  });
}
