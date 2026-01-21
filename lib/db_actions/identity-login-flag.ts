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
  username,
  pictureUrl,
}: {
  idpUserId: string;
  email: string;
  name: string;
  username: string | null;
  pictureUrl: string | null;
}): Promise<VUser | null> {
  const startTime = Date.now();

  try {
    const { id } = await db
      .insertInto("users")
      .values({
        name,
        email,
        is_admin: false,
        idp_user_id: idpUserId,
        username,
        picture_url: pictureUrl,
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

/**
 * Sync user data from IDP claims.
 * Called on each login to keep email, username, name, and picture in sync with the IDP.
 * Name is only updated if provided by the IDP (not null).
 */
export async function syncUserFromIdp(
  userId: number,
  { email, username, name, pictureUrl }: { email: string; username: string | null; name: string | null; pictureUrl: string | null },
): Promise<boolean> {
  const startTime = Date.now();

  try {
    // Only include name in update if IDP provides it
    const updateData: { email: string; username: string | null; picture_url: string | null; name?: string } = {
      email,
      username,
      picture_url: pictureUrl,
    };
    if (name) {
      updateData.name = name;
    }

    await db
      .updateTable("users")
      .set(updateData)
      .where("id", "=", userId)
      .execute();

    const duration = Date.now() - startTime;
    logger.debug("Synced user data from IDP", {
      operation: "syncUserFromIdp",
      userId,
      email,
      username,
      name: name ? "[present]" : null,
      pictureUrl: pictureUrl ? "[present]" : null,
      duration,
    });

    return true;
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to sync user data from IDP", err as Error, {
      operation: "syncUserFromIdp",
      userId,
      duration,
    });
    return false;
  }
}
