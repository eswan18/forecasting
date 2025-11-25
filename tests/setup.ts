import { afterEach } from "vitest";
import { getCurrentTest } from "@vitest/runner";

// Only setup testcontainers if Docker is available and TEST_USE_CONTAINERS is true
const useContainers = process.env.TEST_USE_CONTAINERS === "true";

if (useContainers) {
  // Clean up test data after each test to ensure isolation
  // Note: Container setup/teardown is now handled by globalSetup.ts
  // We use afterEach instead of beforeEach to clean up only the data created by the current test
  afterEach(async () => {
    const { getTestDb, cleanupTestData } = await import(
      "./helpers/testDatabase"
    );
    const { testIdTracker } = await import("./helpers/testIdTracker");

    const db = await getTestDb();
    const test = getCurrentTest();

    if (test) {
      // Get tracked IDs for the current test
      // Use task ID if available (more reliable in parallel execution)
      const testId = test.task?.id
        ? test.task.id.toString()
        : `${test.file?.name || "unknown"}:${test.name}`;
      const trackedIds = testIdTracker.getTrackedIdsForTest(testId);

      // Clean up only the tracked IDs for this test
      await cleanupTestData(db, trackedIds);

      // Clear the tracked IDs to prevent memory leaks
      testIdTracker.clearTest(testId);
    } else {
      // Fallback: try to get tracked IDs for current test context
      const trackedIds = testIdTracker.getTrackedIds();
      if (Object.keys(trackedIds).length > 0) {
        await cleanupTestData(db, trackedIds);
        testIdTracker.clearCurrentTest();
      }
    }
  });
}
