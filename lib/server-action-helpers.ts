import { redirect } from 'next/navigation';
import { ServerActionResult, ERROR_CODES } from './server-action-result';

/**
 * Helper function to handle server action results in server components
 * Automatically redirects on unauthorized errors and throws on other errors
 */
export function handleServerActionResult<T>(
  result: ServerActionResult<T>,
  options?: {
    unauthorizedRedirect?: string;
    throwOnError?: boolean;
  }
): T {
  const { 
    unauthorizedRedirect = '/login',
    throwOnError = true 
  } = options || {};

  if (!result.success) {
    // Handle unauthorized errors with redirect
    if (result.code === ERROR_CODES.UNAUTHORIZED) {
      redirect(unauthorizedRedirect);
    }
    
    // For other errors, throw by default (will be caught by error boundary)
    if (throwOnError) {
      throw new Error(result.error);
    }
    
    // If not throwing, return undefined (caller must handle this case)
    return undefined as any;
  }
  
  return result.data;
}

/**
 * Helper to handle server action results with a custom error component
 */
export function handleServerActionResultWithFallback<T>(
  result: ServerActionResult<T>,
  fallback: T,
  options?: {
    unauthorizedRedirect?: string;
  }
): T {
  const { unauthorizedRedirect = '/login' } = options || {};

  if (!result.success) {
    if (result.code === ERROR_CODES.UNAUTHORIZED) {
      redirect(unauthorizedRedirect);
    }
    
    // Return fallback value on error
    console.error('Server action error:', result.error);
    return fallback;
  }
  
  return result.data;
}