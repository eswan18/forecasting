"use server";

import { getUserFromCookies } from "../get-user";
import { randomBytes } from "crypto";
import { db } from "@/lib/database";
import { logger } from "@/lib/logger";
import { InviteToken } from "@/types/db_types";
import {
  ServerActionResult,
  success,
  error,
  ERROR_CODES,
} from "@/lib/server-action-result";

export async function generateInviteToken({ notes }: { notes?: string }) {
  const currentUser = await getUserFromCookies();
  logger.debug("Generating invite token", {
    notes,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    if (!currentUser?.is_admin) {
      logger.warn("Unauthorized attempt to generate invite token", {
        currentUserId: currentUser?.id,
      });
      throw new Error("Unauthorized");
    }

    // Create the token.
    const token = randomBytes(16).toString("hex");

    // Save it to the db.
    await db
      .insertInto("invite_tokens")
      .values({ token, created_at: new Date(), notes })
      .execute();

    const duration = Date.now() - startTime;
    logger.info("Invite token generated successfully", {
      operation: "generateInviteToken",
      table: "invite_tokens",
      token: token.substring(0, 8) + "...", // Log partial token for security
      duration,
    });

    return token;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to generate invite token", error as Error, {
      operation: "generateInviteToken",
      table: "invite_tokens",
      duration,
    });
    throw error;
  }
}

export async function inviteTokenIsValid(token: string) {
  logger.debug("Validating invite token", {
    token: token.substring(0, 8) + "...", // Log partial token for security
  });

  const startTime = Date.now();
  try {
    const invite = await db
      .selectFrom("invite_tokens")
      .selectAll()
      .where("token", "=", token)
      .executeTakeFirst();

    const duration = Date.now() - startTime;

    if (invite === undefined) {
      logger.warn("Invite token does not exist", {
        operation: "inviteTokenIsValid",
        table: "invite_tokens",
        token: token.substring(0, 8) + "...",
        duration,
      });
      return false;
    }

    if (invite.used_at !== null) {
      logger.warn("Invite token has already been used", {
        operation: "inviteTokenIsValid",
        table: "invite_tokens",
        token: token.substring(0, 8) + "...",
        usedAt: invite.used_at.toISOString(),
        duration,
      });
      return false;
    }

    logger.info("Invite token is valid", {
      operation: "inviteTokenIsValid",
      table: "invite_tokens",
      token: token.substring(0, 8) + "...",
      duration,
    });

    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to validate invite token", error as Error, {
      operation: "inviteTokenIsValid",
      table: "invite_tokens",
      token: token.substring(0, 8) + "...",
      duration,
    });
    throw error;
  }
}

export async function consumeInviteToken(token: string) {
  logger.debug("Consuming invite token", {
    token: token.substring(0, 8) + "...", // Log partial token for security
  });

  const startTime = Date.now();
  try {
    const invite = await db
      .updateTable("invite_tokens")
      .where("token", "=", token)
      .set({ used_at: new Date() })
      .returning("token")
      .execute();

    if (!invite) {
      logger.warn("Invalid invite token for consumption", {
        operation: "consumeInviteToken",
        table: "invite_tokens",
        token: token.substring(0, 8) + "...",
      });
      throw new Error("Invalid invite token.");
    }

    const duration = Date.now() - startTime;
    logger.info("Invite token consumed successfully", {
      operation: "consumeInviteToken",
      table: "invite_tokens",
      token: token.substring(0, 8) + "...",
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to consume invite token", error as Error, {
      operation: "consumeInviteToken",
      table: "invite_tokens",
      token: token.substring(0, 8) + "...",
      duration,
    });
    throw error;
  }
}

export async function getInviteTokens(): Promise<
  ServerActionResult<InviteToken[]>
> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting invite tokens", {
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    if (!currentUser?.is_admin) {
      logger.warn("Unauthorized attempt to get invite tokens", {
        currentUserId: currentUser?.id,
      });
      return error(
        "You must be an admin to view invite tokens",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    const inviteTokens = await db
      .selectFrom("invite_tokens")
      .selectAll()
      .orderBy("created_at", "desc")
      .execute();

    const duration = Date.now() - startTime;
    logger.debug(`Retrieved ${inviteTokens.length} invite tokens`, {
      operation: "getInviteTokens",
      table: "invite_tokens",
      duration,
    });

    return success(inviteTokens);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get invite tokens", err as Error, {
      operation: "getInviteTokens",
      table: "invite_tokens",
      duration,
    });
    return error(
      "Failed to retrieve invite tokens",
      ERROR_CODES.DATABASE_ERROR,
    );
  }
}

export async function deleteInviteToken({
  id,
}: {
  id: number;
}): Promise<ServerActionResult<void>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Deleting invite token", {
    currentUserId: currentUser?.id,
    inviteTokenId: id,
  });

  const startTime = Date.now();
  try {
    if (!currentUser?.is_admin) {
      logger.warn("Unauthorized attempt to delete invite token", {
        currentUserId: currentUser?.id,
        inviteTokenId: id,
      });
      return error(
        "You must be an admin to delete invite tokens",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    await db.deleteFrom("invite_tokens").where("id", "=", id).execute();

    const duration = Date.now() - startTime;
    logger.info("Invite token deleted successfully", {
      operation: "deleteInviteToken",
      table: "invite_tokens",
      inviteTokenId: id,
      duration,
    });

    return success(undefined);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to delete invite token", err as Error, {
      operation: "deleteInviteToken",
      table: "invite_tokens",
      inviteTokenId: id,
      duration,
    });
    return error("Failed to delete invite token", ERROR_CODES.DATABASE_ERROR);
  }
}
