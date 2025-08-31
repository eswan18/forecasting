"use server";

import { getUserFromCookies } from "../get-user";
import { randomBytes } from "crypto";
import { db } from "@/lib/database";
import { logger } from "@/lib/logger";

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
