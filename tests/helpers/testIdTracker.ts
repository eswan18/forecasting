import { getCurrentTest } from "@vitest/runner";

/**
 * Tracks database IDs created during a test for selective cleanup.
 * Each test gets its own tracked IDs to enable parallel test execution.
 */
export interface TrackedIds {
  [tableName: string]: number[];
}

/**
 * Per-test tracker instance.
 * Each test should have its own instance, stored in the test context.
 */
export class TestIdTracker {
  private trackedIds: TrackedIds = {};

  /**
   * Track an ID for a specific table.
   */
  trackId(tableName: string, id: number): void {
    if (!this.trackedIds[tableName]) {
      this.trackedIds[tableName] = [];
    }
    if (!this.trackedIds[tableName].includes(id)) {
      this.trackedIds[tableName].push(id);
    }
  }

  /**
   * Get all tracked IDs for this test.
   */
  getTrackedIds(): TrackedIds {
    return this.trackedIds;
  }

  /**
   * Clear all tracked IDs.
   * Should be called after cleanup to prevent memory leaks.
   */
  clear(): void {
    this.trackedIds = {};
  }
}

/**
 * Registry to store tracker instances per test.
 * Uses test task ID as key for reliable retrieval across contexts.
 */
const trackerRegistry = new Map<string, TestIdTracker>();

/**
 * Get a consistent test ID from the test context.
 */
function getTestId(test: any): string | null {
  if (test?.task?.id) {
    return test.task.id.toString();
  }
  if (test?.file?.name && test?.name) {
    return `${test.file.name}:${test.name}`;
  }
  return null;
}

/**
 * Get or create a tracker instance for the current test.
 * Stores the tracker keyed by test ID for later retrieval.
 */
export function getTestTracker(): TestIdTracker {
  try {
    const test = getCurrentTest();
    if (test) {
      const testId = getTestId(test);
      if (testId) {
        if (!trackerRegistry.has(testId)) {
          trackerRegistry.set(testId, new TestIdTracker());
        }
        return trackerRegistry.get(testId)!;
      }
    }
  } catch (error) {
    // getCurrentTest() might not be available in all contexts
  }
  // Fallback: create a temporary tracker (will be cleaned up immediately)
  return new TestIdTracker();
}

/**
 * Get the tracker for a specific test (by test object).
 * Used in afterEach hooks to retrieve the tracker.
 */
export function getTrackerForTest(test: any): TestIdTracker | undefined {
  const testId = getTestId(test);
  if (testId) {
    return trackerRegistry.get(testId);
  }
  return undefined;
}

/**
 * Clear tracker for a specific test.
 */
export function clearTrackerForTest(test: any): void {
  const testId = getTestId(test);
  if (testId) {
    trackerRegistry.delete(testId);
  }
}

/**
 * Legacy singleton for backward compatibility.
 * New code should use getTestTracker() instead.
 * @deprecated Use getTestTracker() for per-test instances
 */
class LegacyTestIdTracker {
  private trackedIds: Map<string, TrackedIds> = new Map();

  private getTestId(): string {
    try {
      const test = getCurrentTest();
      if (test?.task?.id) {
        return test.task.id.toString();
      }
      if (test) {
        return `${test.file?.name || "unknown"}:${test.name}`;
      }
    } catch (error) {
      // Ignore
    }
    return `unknown:${Date.now()}`;
  }

  trackId(tableName: string, id: number): void {
    const tracker = getTestTracker();
    tracker.trackId(tableName, id);
  }

  getTrackedIds(): TrackedIds {
    const tracker = getTestTracker();
    return tracker.getTrackedIds();
  }

  getTrackedIdsForTest(testId: string): TrackedIds {
    // This method is less reliable with per-test instances
    // Try to get from current test context
    const tracker = getTestTracker();
    return tracker.getTrackedIds();
  }

  clearCurrentTest(): void {
    const tracker = getTestTracker();
    tracker.clear();
  }

  clearTest(testId: string): void {
    // Less reliable with per-test instances, but try anyway
    const tracker = getTestTracker();
    tracker.clear();
  }
}

// Singleton instance for backward compatibility
export const testIdTracker = new LegacyTestIdTracker();
