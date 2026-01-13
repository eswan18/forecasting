"use server";

import { db } from "@/lib/database";
import { VUser } from "@/types/db_types";
import { logger } from "@/lib/logger";

/**
 * Check if identity login is enabled for a user.
 * This function does NOT require authentication - it's called on the login page
 * before the user is authenticated.
 *
 * The feature flag logic:
 * 1. Check if global `identity-login` flag is enabled (user_id = NULL)
 * 2. If global is disabled, return false
 * 3. If global is enabled, check for per-user override
 * 4. Per-user setting overrides global
 *
 * Returns: { enabled: boolean, user: VUser | null }
 * - enabled: whether IDP login should be used
 * - user: the user record (if found), includes idp_user_id to determine migration status
 */
export async function isIdentityLoginEnabled(username: string): Promise<{
  enabled: boolean;
  user: VUser | null;
}> {
  const startTime = Date.now();

  try {
    // 1. Check global flag (user_id = NULL)
    const globalFlag = await db
      .selectFrom("feature_flags")
      .select("enabled")
      .where("name", "=", "identity-login")
      .where("user_id", "is", null)
      .executeTakeFirst();

    if (!globalFlag?.enabled) {
      const duration = Date.now() - startTime;
      logger.debug("Identity login disabled globally", {
        operation: "isIdentityLoginEnabled",
        username,
        duration,
      });
      return { enabled: false, user: null };
    }

    // 2. Look up user by username
    const user = await db
      .selectFrom("v_users")
      .selectAll()
      .where("username", "=", username)
      .executeTakeFirst();

    if (!user) {
      // Unknown user - use IDP flow (they'll register via IDP)
      const duration = Date.now() - startTime;
      logger.debug("Identity login enabled for unknown user", {
        operation: "isIdentityLoginEnabled",
        username,
        duration,
      });
      return { enabled: true, user: null };
    }

    // 3. Check per-user override
    const userFlag = await db
      .selectFrom("feature_flags")
      .select("enabled")
      .where("name", "=", "identity-login")
      .where("user_id", "=", user.id)
      .executeTakeFirst();

    // Per-user setting overrides global, otherwise use global setting (true)
    const enabled = userFlag?.enabled ?? true;

    const duration = Date.now() - startTime;
    logger.debug("Identity login check completed", {
      operation: "isIdentityLoginEnabled",
      username,
      userId: user.id,
      enabled,
      hasIdpUserId: user.idp_user_id !== null,
      duration,
    });

    return { enabled, user };
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to check identity login flag", err as Error, {
      operation: "isIdentityLoginEnabled",
      username,
      duration,
    });
    // On error, fail closed - use legacy login
    return { enabled: false, user: null };
  }
}

/**
 * Get a user by their IDP user ID (the `sub` claim from IDP tokens).
 * Used when validating IDP tokens.
 */
export async function getUserByIdpUserId(
  idpUserId: string,
): Promise<VUser | null> {
  const startTime = Date.now();

  try {
    const user = await db
      .selectFrom("v_users")
      .selectAll()
      .where("idp_user_id", "=", idpUserId)
      .executeTakeFirst();

    const duration = Date.now() - startTime;
    logger.debug("Looked up user by IDP user ID", {
      operation: "getUserByIdpUserId",
      idpUserId,
      found: !!user,
      duration,
    });

    return user ?? null;
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to look up user by IDP user ID", err as Error, {
      operation: "getUserByIdpUserId",
      idpUserId,
      duration,
    });
    return null;
  }
}

/**
 * Update a user's IDP user ID after migration.
 */
export async function setUserIdpUserId(
  userId: number,
  idpUserId: string,
): Promise<boolean> {
  const startTime = Date.now();

  try {
    await db
      .updateTable("users")
      .set({ idp_user_id: idpUserId })
      .where("id", "=", userId)
      .execute();

    const duration = Date.now() - startTime;
    logger.info("Updated user IDP user ID", {
      operation: "setUserIdpUserId",
      userId,
      idpUserId,
      duration,
    });

    return true;
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to update user IDP user ID", err as Error, {
      operation: "setUserIdpUserId",
      userId,
      idpUserId,
      duration,
    });
    return false;
  }
}

/**
 * Create a new user from IDP registration.
 * Used when a user logs in via IDP for the first time (no existing user).
 */
export async function createUserFromIdp({
  idpUserId,
  email,
  name,
}: {
  idpUserId: string;
  email: string;
  name: string;
}): Promise<VUser | null> {
  const startTime = Date.now();

  try {
    const { id } = await db
      .insertInto("users")
      .values({
        name,
        email,
        login_id: null, // No legacy login
        is_admin: false,
        idp_user_id: idpUserId,
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    // Fetch the full user from the view
    const user = await db
      .selectFrom("v_users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirstOrThrow();

    const duration = Date.now() - startTime;
    logger.info("Created user from IDP", {
      operation: "createUserFromIdp",
      userId: id,
      idpUserId,
      email,
      duration,
    });

    return user;
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to create user from IDP", err as Error, {
      operation: "createUserFromIdp",
      idpUserId,
      email,
      duration,
    });
    return null;
  }
}
