import { getCurrentTest } from "@vitest/runner";

/**
 * Tracks database IDs created during a test for selective cleanup.
 * Each test gets its own tracked IDs to enable parallel test execution.
 */
export interface TrackedIds {
  [tableName: string]: number[];
}

class TestIdTracker {
  private trackedIds: Map<string, TrackedIds> = new Map();

  /**
   * Get the current test ID from Vitest context.
   * Falls back to a unique ID if test context is not available.
   */
  private getTestId(): string {
    try {
      const test = getCurrentTest();
      if (test) {
        // Use test task ID if available (more reliable in parallel execution)
        // Otherwise fall back to file name + test name
        if (test.task?.id) {
          return test.task.id.toString();
        }
        return `${test.file?.name || "unknown"}:${test.name}`;
      }
    } catch (error) {
      // getCurrentTest() might not be available in all contexts
      // This is expected in some cases (e.g., when called outside test context)
    }
    // Fallback for cases where test context isn't available
    return `unknown:${Date.now()}`;
  }

  /**
   * Track an ID for a specific table in the current test.
   */
  trackId(tableName: string, id: number): void {
    const testId = this.getTestId();
    if (!this.trackedIds.has(testId)) {
      this.trackedIds.set(testId, {});
    }
    const tracked = this.trackedIds.get(testId)!;
    if (!tracked[tableName]) {
      tracked[tableName] = [];
    }
    if (!tracked[tableName].includes(id)) {
      tracked[tableName].push(id);
    }
  }

  /**
   * Get all tracked IDs for the current test.
   */
  getTrackedIds(): TrackedIds {
    const testId = this.getTestId();
    return this.trackedIds.get(testId) || {};
  }

  /**
   * Get tracked IDs for a specific test (by test ID).
   * Used for cleanup in afterEach hooks.
   */
  getTrackedIdsForTest(testId: string): TrackedIds {
    return this.trackedIds.get(testId) || {};
  }

  /**
   * Clear tracked IDs for the current test.
   * Should be called after cleanup to prevent memory leaks.
   */
  clearCurrentTest(): void {
    const testId = this.getTestId();
    this.trackedIds.delete(testId);
  }

  /**
   * Clear tracked IDs for a specific test.
   */
  clearTest(testId: string): void {
    this.trackedIds.delete(testId);
  }

  /**
   * Get all test IDs that have tracked data.
   * Useful for debugging.
   */
  getAllTestIds(): string[] {
    return Array.from(this.trackedIds.keys());
  }
}

// Singleton instance
export const testIdTracker = new TestIdTracker();
