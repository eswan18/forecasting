import { it } from "vitest";

export const ifRunningContainerTestsIt = shouldRunContainerTests() ? it : it.skip;
/**
 * Checks if container tests should be run
 * @returns true if TEST_USE_CONTAINERS is "true", false otherwise
 */
export function shouldRunContainerTests(): boolean {
  return process.env.TEST_USE_CONTAINERS === "true";
}
