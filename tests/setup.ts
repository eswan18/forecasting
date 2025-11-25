import { onTestFinished } from "@vitest/runner";

// Only setup testcontainers if Docker is available and TEST_USE_CONTAINERS is true
const useContainers = process.env.TEST_USE_CONTAINERS === "true";

if (useContainers) {
  // Clean up test data after each test to ensure isolation
  // Note: Container setup/teardown is now handled by globalSetup.ts
  // Use onTestFinished instead of afterEach + getCurrentTest() because:
  // 1. getCurrentTest() doesn't work reliably in global afterEach hooks
  // 2. onTestFinished provides reliable test context even during parallel execution
  // 3. onTestFinished is called for each test automatically when registered in setup files
  onTestFinished(async (test) => {
    const { getTestDb, cleanupTestData } = await import(
      "./helpers/testDatabase"
    );
    const { getTrackerForTest, clearTrackerForTest } = await import(
      "./helpers/testIdTracker"
    );

    // Get the tracker instance for this specific test
    const tracker = getTrackerForTest(test);
    if (tracker) {
      const trackedIds = tracker.getTrackedIds();

      if (trackedIds.length > 0) {
        const db = await getTestDb();
        // Clean up only the tracked IDs for this test
        await cleanupTestData(db, trackedIds);
      }

      // Clear the tracked IDs and remove from registry to prevent memory leaks
      tracker.clear();
      clearTrackerForTest(test);
    }
  });
}
