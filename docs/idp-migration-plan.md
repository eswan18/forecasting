# Identity Provider Migration Plan

This document outlines the plan to migrate the Forecasting app from its current built-in authentication system to the external Identity Provider (IDP).

## Goals

1. Migrate existing users transparently on their next login
2. Feature flag the rollout so only flagged users experience the new flow
3. Maintain backwards compatibility during the transition period
4. Eventually deprecate the legacy login system

## Current State

### Authentication Architecture
- **Users table**: Contains user profile data (`id`, `name`, `email`, `is_admin`, etc.)
- **Logins table**: Contains credentials (`id`, `username`, `password_hash`)
- **Relationship**: `users.login_id` → `logins.id` (nullable, 1:1)
- **Session**: JWT stored in HTTP-only cookie named `"token"`, contains `{ loginId: number }`
- **User lookup**: Via `v_users` view joining users ↔ logins

### Key Files
| File | Purpose |
|------|---------|
| `/lib/auth/login.ts` | Password verification, JWT creation, cookie setting |
| `/lib/get-user.ts` | Extract user from JWT cookie |
| `/lib/db_actions/feature_flags.ts` | Feature flag queries |
| `/types/db_types.ts` | TypeScript types for all tables |

## Design Decisions

### 1. New Database Fields

Add to `users` table:
- `idp_user_id` (UUID, nullable) - The `sub` claim from IDP tokens

**Inferring login type:**
- `idp_user_id IS NULL` → user is on legacy login (or has no login at all)
- `idp_user_id IS NOT NULL` → user has been migrated to IDP

No separate `using_legacy_login` flag needed - it's redundant with the presence/absence of `idp_user_id`.

### 2. Feature Flag Strategy

**Problem**: The current `hasFeatureEnabled()` function requires an authenticated user to check flags. But we need to decide which login flow to use *before* the user is authenticated.

**Solution**: Create a two-tier feature flag approach:

1. **Global flag** (`identity-login` with `user_id = NULL`): Master switch for the feature
2. **Per-user override**: When global is enabled, individual users can be excluded

**New function needed**: `isIdentityLoginEnabled(username: string)` that:
- Checks if global `identity-login` flag is enabled
- Looks up user by username to check per-user override
- Does NOT require authentication (called on login page)

### 3. Login Flow Changes

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LOGIN PAGE                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  User enters username                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────┐                                            │
│  │ isIdentityLoginEnabled│                                           │
│  │ (username)?          │                                           │
│  └─────────────────────┘                                            │
│           │                                                          │
│     ┌─────┴─────┐                                                   │
│     │           │                                                   │
│   NO│         YES│                                                   │
│     ▼           ▼                                                   │
│  ┌──────┐   ┌────────────────────┐                                  │
│  │Legacy│   │Check idp_user_id   │                                  │
│  │Login │   │for user            │                                  │
│  └──────┘   └────────────────────┘                                  │
│                    │                                                 │
│              ┌─────┴─────┐                                          │
│              │           │                                          │
│          NULL│      NOT NULL│                                         │
│              ▼           ▼                                          │
│        ┌──────────┐  ┌──────────┐                                   │
│        │Legacy    │  │Redirect  │                                   │
│        │Login +   │  │to IDP    │                                   │
│        │Migration │  │OAuth     │                                   │
│        └──────────┘  └──────────┘                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. JWT Token Strategy

**Option chosen**: Dual-token support during transition

- **Legacy JWT**: `{ loginId: number }` - signed with `JWT_SECRET`
- **IDP JWT**: Standard OIDC token with `sub` (UUID) - signed by IDP

The `getUserFromCookies()` function will:
1. Try to decode as legacy JWT first
2. If that fails, try to validate as IDP token
3. Look up user by `login_id` (legacy) or `idp_user_id` (IDP)

## Implementation Plan

### Phase 1: Database Migration

**File**: `migrations/TIMESTAMP_add-idp-user-id.ts`

```typescript
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Add idp_user_id column to users table
  await db.schema
    .alterTable("users")
    .addColumn("idp_user_id", "uuid")
    .execute();

  // Add index for IDP user lookup
  await db.schema
    .createIndex("idx_users_idp_user_id")
    .on("users")
    .column("idp_user_id")
    .execute();

  // Update v_users view to include new column
  // (Drop dependent views first, recreate after)
  await db.schema.dropView("v_password_reset_tokens").ifExists().execute();
  await db.schema.dropView("v_suggested_props").ifExists().execute();
  await db.schema.dropView("v_feature_flags").ifExists().execute();
  await db.schema.dropView("v_users").execute();

  await db.schema
    .createView("v_users")
    .as(
      db
        .selectFrom("users")
        .leftJoin("logins", "users.login_id", "logins.id")
        .select([
          "users.id",
          "users.name",
          "users.email",
          "users.is_admin",
          "users.deactivated_at",
          "users.created_at",
          "users.updated_at",
          "users.idp_user_id",
          "logins.id as login_id",
          "logins.username",
        ]),
    )
    .execute();

  // Recreate dependent views (v_suggested_props, v_feature_flags, v_password_reset_tokens)
  // ... (copy from existing migration pattern)
}

export async function down(db: Kysely<any>): Promise<void> {
  // Reverse the migration
  // ... (drop views, remove column, recreate views without idp_user_id)
}
```

**Update TypeScript types** in `/types/db_types.ts`:

```typescript
export interface UsersTable {
  // ... existing fields ...
  idp_user_id: string | null;  // UUID from IDP (null = legacy login)
}

export interface VUsersView {
  // ... existing fields ...
  idp_user_id: string | null;
}
```

### Phase 2: Environment Variables

Add to `.env.*` files:

```bash
# Identity Provider
IDP_BASE_URL=https://identity.yourdomain.com
IDP_CLIENT_ID=...
IDP_CLIENT_SECRET=...
IDP_ADMIN_CLIENT_ID=...
IDP_ADMIN_CLIENT_SECRET=...
```

### Phase 3: IDP Client Library

**New file**: `/lib/idp/client.ts`

```typescript
// Token management for client credentials (admin API)
export class IDPAdminClient {
  private token: string | null = null;
  private tokenExpiry: number = 0;

  async getToken(): Promise<string> { /* ... */ }
  async createUser(username: string, email: string, password: string): Promise<IDPUser> { /* ... */ }
}

// OAuth flow helpers
export function getAuthorizationUrl(state: string, redirectUri: string): string { /* ... */ }
export async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<TokenResponse> { /* ... */ }
export async function validateIDPToken(token: string): Promise<IDPClaims> { /* ... */ }
```

### Phase 4: Feature Flag Function

**New file**: `/lib/db_actions/identity-login-flag.ts`

```typescript
/**
 * Check if identity login is enabled for a user.
 * This function does NOT require authentication - it's called on the login page.
 *
 * Returns: { enabled: boolean, user: VUser | null }
 * - enabled: whether IDP login should be used
 * - user: the user record (if found), includes idp_user_id to determine migration status
 */
export async function isIdentityLoginEnabled(username: string): Promise<{
  enabled: boolean;
  user: VUser | null;
}> {
  // 1. Check global flag (user_id = NULL)
  const globalFlag = await db
    .selectFrom("feature_flags")
    .select("enabled")
    .where("name", "=", "identity-login")
    .where("user_id", "is", null)
    .executeTakeFirst();

  if (!globalFlag?.enabled) {
    return { enabled: false, user: null }; // Feature not enabled globally
  }

  // 2. Look up user by username
  const user = await db
    .selectFrom("v_users")
    .selectAll()
    .where("username", "=", username)
    .executeTakeFirst();

  if (!user) {
    return { enabled: true, user: null }; // Unknown user, use new flow (they'll register via IDP)
  }

  // 3. Check per-user override
  const userFlag = await db
    .selectFrom("feature_flags")
    .select("enabled")
    .where("name", "=", "identity-login")
    .where("user_id", "=", user.id)
    .executeTakeFirst();

  // Per-user setting overrides global, otherwise use global setting
  const enabled = userFlag?.enabled ?? true;
  return { enabled, user };
}
```

### Phase 5: Login Flow Modifications

**Modify**: `/lib/auth/login.ts`

```typescript
export async function login({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<LoginResponse> {
  // Check if this user should use IDP login
  const { enabled: useIDP, user } = await isIdentityLoginEnabled(username);

  if (useIDP) {
    // Check if user needs migration (has no idp_user_id yet)
    if (user && user.idp_user_id === null) {
      // Legacy user - verify password locally, then migrate
      return await legacyLoginWithMigration({ username, password, user });
    } else {
      // User should use OAuth flow - return special response
      return {
        success: false,
        error: "Please use the new login method.",
        useOAuth: true
      };
    }
  }

  // Original legacy login flow
  return await legacyLogin({ username, password });
}

async function legacyLoginWithMigration({
  username,
  password,
  user,
}: {
  username: string;
  password: string;
  user: VUser;
}): Promise<LoginResponse> {
  // 1. Verify credentials locally (existing logic)
  const loginResult = await getLoginByUsername(username);
  if (!loginResult.success || !loginResult.data) {
    return { success: false, error: "Invalid username or password." };
  }

  const isValid = await argon2.verify(loginResult.data.password_hash, SALT + password);
  if (!isValid) {
    return { success: false, error: "Invalid username or password." };
  }

  // 2. Create user in IDP (using admin client credentials)
  const idpClient = new IDPAdminClient();

  try {
    const idpUser = await idpClient.createUser(username, user.email, password);

    // 3. Update local user with IDP user ID
    await db
      .updateTable("users")
      .set({ idp_user_id: idpUser.id })
      .where("id", "=", user.id)
      .execute();

    // 4. Create session using IDP token (or legacy JWT for now)
    // For simplicity during transition, still use legacy JWT
    const token = jwt.sign({ loginId: loginResult.data.id }, JWT_SECRET, {
      expiresIn: "3h",
    });

    // Set cookie and return success
    // ... (existing cookie logic)

    return { success: true };
  } catch (error) {
    // If IDP creation fails (e.g., user already exists), log but continue
    console.error("Failed to create IDP user during migration:", error);
    // Still allow login with legacy system
    return await legacyLogin({ username, password });
  }
}
```

### Phase 6: OAuth Callback Route

**New file**: `/app/oauth/callback/route.ts`

```typescript
import { exchangeCodeForTokens, validateIDPToken } from "@/lib/idp/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // Validate state, exchange code for tokens
  const tokens = await exchangeCodeForTokens(code, codeVerifier);
  const claims = await validateIDPToken(tokens.access_token);

  // Look up or create user by IDP user ID
  let user = await getUserByIDPUserId(claims.sub);

  if (!user) {
    // First login via IDP - create user record
    user = await createUserFromIDP({
      idp_user_id: claims.sub,
      email: claims.email,
      name: claims.username || claims.email.split("@")[0],
    });
  }

  // Set session cookie with IDP token (or create legacy-format JWT)
  const cookieStore = await cookies();
  cookieStore.set("token", tokens.access_token, { /* ... */ });

  redirect(returnUrl || "/");
}
```

### Phase 7: Update getUserFromCookies

**Modify**: `/lib/get-user.ts`

```typescript
export async function getUserFromCookies(): Promise<VUser | null> {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return null;
  }

  // Try legacy JWT first
  const legacyUser = await getUserFromLegacyToken(token);
  if (legacyUser) {
    return legacyUser;
  }

  // Try IDP token
  const idpUser = await getUserFromIDPToken(token);
  return idpUser;
}

async function getUserFromLegacyToken(token: string): Promise<VUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { loginId: number };
    return await db
      .selectFrom("v_users")
      .selectAll()
      .where("login_id", "=", decoded.loginId)
      .executeTakeFirstOrThrow();
  } catch {
    return null;
  }
}

async function getUserFromIDPToken(token: string): Promise<VUser | null> {
  try {
    const claims = await validateIDPToken(token);
    return await db
      .selectFrom("v_users")
      .selectAll()
      .where("idp_user_id", "=", claims.sub)
      .executeTakeFirstOrThrow();
  } catch {
    return null;
  }
}
```

### Phase 8: Login Page UI Changes

**Modify**: `/app/login/login-form-card.tsx`

```typescript
// Add OAuth login button (shown when identity-login flag is enabled)
// Add logic to check feature flag and show appropriate UI
```

## Gotchas and Edge Cases

### 1. Password Reset Flow
- Legacy users can still reset password (updates local `logins` table)
- After migration, password reset should go through IDP
- **Solution**: Check `idp_user_id IS NULL` to determine which flow to use

### 2. Admin Impersonation
- `loginViaImpersonation()` creates legacy JWT
- Will continue to work during transition
- **Future**: May need IDP-based impersonation or removal

### 3. Registration
- Current: Requires invite token, creates login + user
- **Future**: Registration through IDP, then link to local user
- **Transition**: Keep legacy registration for now, add IDP registration later

### 4. Account Settings (Username/Password Changes)
- Currently updates `logins` table directly
- After migration, these should go through IDP
- **Solution**: Check `idp_user_id IS NULL` and route to appropriate system

### 5. Deactivated Users
- Current system checks `deactivated_at` on user lookup
- IDP doesn't know about deactivation status
- **Solution**: Always check `deactivated_at` after token validation

### 6. Cookie Domain/Security
- Legacy cookie: `token`, same domain
- IDP may use different cookie handling
- **Solution**: Store IDP access token in same `token` cookie for simplicity

### 7. Token Refresh
- Legacy JWT: No refresh, 3-hour expiry
- IDP tokens: Have refresh tokens
- **Transition**: Initially, just re-login on expiry; add refresh later

### 8. Race Condition on Migration
- User logs in on two devices simultaneously during migration
- Both try to create IDP account
- **Solution**: IDP returns 409 for duplicate; handle gracefully

### 9. Email Mismatch
- User's email in forecasting might differ from IDP
- **Solution**: Use IDP email as source of truth after migration

### 10. Feature Flag Chicken-and-Egg
- Can't check per-user flag without knowing the user
- On login page, only have username
- **Solution**: `isIdentityLoginEnabled(username)` function that doesn't require auth

## Rollout Plan

### Stage 1: Infrastructure
- [ ] Create IDP clients (Forecasting, Forecasting Admin)
- [ ] Add environment variables to all environments
- [ ] Deploy database migration (adds `idp_user_id` column)

### Stage 2: Code Changes
- [ ] Implement IDP client library
- [ ] Implement `isIdentityLoginEnabled()` function
- [ ] Implement migration flow in login
- [ ] Implement OAuth callback route
- [ ] Update `getUserFromCookies()` for dual-token support

### Stage 3: Testing
- [ ] Test legacy login (flag disabled) - should work as before
- [ ] Test legacy login with migration (flag enabled, legacy user)
- [ ] Test OAuth login (flag enabled, migrated user)
- [ ] Test new user registration via IDP

### Stage 4: Gradual Rollout
- [ ] Enable `identity-login` flag globally in dev environment
- [ ] Test with internal users in prod (per-user flag)
- [ ] Enable globally in prod
- [ ] Monitor for issues

### Stage 5: Cleanup (Future)
- [ ] Remove legacy login code
- [ ] Remove `logins` table
- [ ] Remove `login_id` from users
- [ ] Make `idp_user_id` NOT NULL (all users migrated)

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Create | `migrations/TIMESTAMP_add-idp-user-id.ts` | Database migration |
| Create | `lib/idp/client.ts` | IDP client library |
| Create | `lib/db_actions/identity-login-flag.ts` | Feature flag check |
| Create | `app/oauth/callback/route.ts` | OAuth callback handler |
| Modify | `types/db_types.ts` | Add new fields to types |
| Modify | `lib/auth/login.ts` | Add migration logic |
| Modify | `lib/get-user.ts` | Dual-token support |
| Modify | `app/login/login-form-card.tsx` | UI for OAuth option |
| Modify | `lib/auth/update-password.ts` | Route to IDP for migrated users |
