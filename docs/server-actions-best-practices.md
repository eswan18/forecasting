# Server Actions Best Practices

This document outlines the best practices for handling errors in Next.js server actions in our codebase.

## Why Return Results Instead of Throwing Errors?

Next.js recommends returning structured results from server actions rather than throwing errors because:

1. **Type Safety**: TypeScript can infer the return type, making it clear what errors can occur
2. **Better UX**: Errors can be handled gracefully without breaking the UI
3. **Consistency**: All server actions follow the same pattern
4. **Testability**: Easier to test different error scenarios

## The Pattern

### 1. Server Action Result Types

All server actions should return a `ServerActionResult<T>`:

```typescript
export type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
```

### 2. Writing Server Actions

```typescript
import {
  ServerActionResult,
  success,
  error,
  ERROR_CODES,
} from "@/lib/server-action-result";

export async function updateUser({
  id,
  user,
}: {
  id: number;
  user: UserUpdate;
}): Promise<ServerActionResult<void>> {
  try {
    // Check authorization
    const currentUser = await getUserFromCookies();
    if (!currentUser || currentUser.id !== id) {
      return error(
        "You can only update your own profile",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    // Perform the action
    await db.updateTable("users").set(user).where("id", "=", id).execute();

    return success(undefined);
  } catch (err) {
    console.error("Error updating user:", err);
    return error("Failed to update user", ERROR_CODES.DATABASE_ERROR);
  }
}
```

### 3. Using Server Actions in Client Components

Use the `useServerAction` hook for automatic error handling and loading states:

```typescript
import { useServerAction } from '@/hooks/use-server-action';

function MyComponent() {
  const updateUserAction = useServerAction(updateUser, {
    successMessage: 'Profile updated successfully',
    onSuccess: () => {
      // Handle success
    },
  });

  async function handleSubmit(values: FormValues) {
    await updateUserAction.execute({ id: userId, user: values });
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={updateUserAction.isLoading}>
        {updateUserAction.isLoading ? 'Saving...' : 'Save'}
      </button>
      {updateUserAction.error && (
        <p className="text-red-500">{updateUserAction.error}</p>
      )}
    </form>
  );
}
```

### 4. Using Server Actions in Server Components

Use the helper functions for clean error handling:

```typescript
import { handleServerActionResult } from '@/lib/server-action-helpers';

export default async function Page() {
  const result = await getUsers();
  const users = handleServerActionResult(result); // Automatically handles errors

  return <UsersList users={users} />;
}
```

## Error Codes

Use predefined error codes for consistency:

```typescript
export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};
```

## Validation Errors

For forms with multiple fields, use `ServerActionResultWithValidation`:

```typescript
export async function createProp({
  prop,
}: {
  prop: NewProp;
}): Promise<ServerActionResultWithValidation<void>> {
  const validationErrors: Record<string, string[]> = {};

  if (!prop.prop_text || prop.prop_text.trim().length < 10) {
    validationErrors.prop_text = [
      "Proposition text must be at least 10 characters long",
    ];
  }

  if (Object.keys(validationErrors).length > 0) {
    return validationError(
      "Please fix the validation errors",
      validationErrors,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  // ... rest of the action
}
```

## Migration Guide

To migrate existing server actions:

1. Change the return type to `Promise<ServerActionResult<T>>`
2. Wrap the logic in a try-catch block
3. Replace `throw new Error()` with `return error()`
4. Return `success(data)` for successful operations
5. Update all callers to handle the result object

## Benefits

- **Consistent Error Handling**: All errors follow the same pattern
- **Better Developer Experience**: Clear types and predictable behavior
- **Improved User Experience**: Graceful error handling with proper feedback
- **Easier Testing**: Mock different scenarios without throwing errors
- **Type Safety**: TypeScript knows exactly what can be returned
