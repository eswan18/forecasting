/**
 * Server Action Result Types
 *
 * These types provide a consistent pattern for handling server action results.
 * Instead of throwing errors, server actions should return these result types.
 */

export type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type ServerActionResultWithValidation<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      code?: string;
      validationErrors?: Record<string, string[]>;
    };

/**
 * Helper functions to create consistent result objects
 */
export function success<T>(data: T): ServerActionResult<T> {
  return { success: true, data };
}

export function error(error: string, code?: string): ServerActionResult<never> {
  return { success: false, error, code };
}

export function validationError(
  error: string,
  validationErrors?: Record<string, string[]>,
  code?: string,
): ServerActionResultWithValidation<never> {
  return { success: false, error, validationErrors, code };
}

/**
 * Common error codes for consistent error handling
 */
export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Wraps an async function to catch errors and return a consistent result
 */
export async function safeServerAction<T>(
  fn: () => Promise<T>,
): Promise<ServerActionResult<T>> {
  try {
    const data = await fn();
    return success(data);
  } catch (err) {
    console.error("Server action error:", err);

    if (err instanceof Error) {
      // Check for specific error types
      if (err.message.includes("Unauthorized")) {
        return error(
          "You are not authorized to perform this action",
          ERROR_CODES.UNAUTHORIZED,
        );
      }

      return error(err.message, ERROR_CODES.UNKNOWN_ERROR);
    }

    return error("An unexpected error occurred", ERROR_CODES.UNKNOWN_ERROR);
  }
}
