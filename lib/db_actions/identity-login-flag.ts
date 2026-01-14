"use server";

import { db } from "@/lib/database";
import { VUser } from "@/types/db_types";
import { logger } from "@/lib/logger";

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
