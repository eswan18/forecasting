import { redirect } from "next/navigation";
import { ServerActionResult, ERROR_CODES } from "./server-action-result";

/**
 * Helper function to handle server action results in server components
 * Automatically redirects on unauthorized errors and throws on other errors
 */
export function handleServerActionResult<T>(
  result: ServerActionResult<T>,
  options?: {
    unauthorizedRedirect?: string;
    throwOnError?: boolean;
  },
): T {
  const { unauthorizedRedirect = "/login", throwOnError = true } =
    options || {};

  if (!result.success) {
    if (result.code === ERROR_CODES.UNAUTHORIZED) {
      redirect(unauthorizedRedirect);
    }

    // For other errors, throw by default (will be caught by error boundary)
    if (throwOnError) {
      throw new Error(result.error);
    }

    // If not throwing, return undefined (caller must handle this case)
    return undefined as T;
  }

  return result.data;
}

/**
 * Like `handleServerActionResult`, but returns `fallback` on error instead of
 * throwing — for callers that can render something sensible without the data.
 * Unauthorized still redirects: a signed-out reader gets the login page, not a
 * page quietly rendered from a fallback.
 */
export function handleServerActionResultWithFallback<T>(
  result: ServerActionResult<T>,
  fallback: T,
  options?: {
    unauthorizedRedirect?: string;
  },
): T {
  const { unauthorizedRedirect = "/login" } = options || {};

  if (!result.success) {
    if (result.code === ERROR_CODES.UNAUTHORIZED) {
      redirect(unauthorizedRedirect);
    }

    // Return fallback value on error
    console.error("Server action error:", result.error);
    return fallback;
  }

  return result.data;
}
