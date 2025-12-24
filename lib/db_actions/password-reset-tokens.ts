"use server";

import { randomBytes } from "crypto";
import { db } from "@/lib/database";
import { headers } from "next/headers";
import { sendEmail } from "../email";
import { updateLoginPasswordFromResetToken } from "../auth";
import { logger } from "@/lib/logger";
import {
  ServerActionResult,
  success,
  error,
  ERROR_CODES,
} from "@/lib/server-action-result";
import { getUserFromCookies } from "../get-user";
import { PasswordReset } from "@/types/db_types";

const PASSWORD_RESET_TOKEN_LIFESPAN_MINUTES = 15;

export async function initiatePasswordReset({
  username,
}: {
  username: string;
}): Promise<ServerActionResult<void>> {
  logger.debug("Initiating password reset", {
    username,
  });

  const startTime = Date.now();
  try {
    // We need the hostname in order to build the password reset link.
    const headerValues = await headers();
    const host = headerValues.get("host");
    if (!host) {
      return error("Host header is missing", ERROR_CODES.VALIDATION_ERROR);
    }

    // Get the login_id for the user.
    const user = await db
      .selectFrom("v_users")
      .selectAll()
      .where("username", "=", username)
      .executeTakeFirst();

    // Return silently if the user doesn't exist to avoid leaking information.
    if (!user) {
      logger.warn("Attempted password reset for non-existent user", {
        operation: "initiatePasswordReset",
        table: "v_users",
        username,
      });
      // Return success to avoid leaking information about user existence
      return success(undefined);
    }

    if (!user.login_id) {
      logger.warn("Attempted password reset for user without login_id", {
        operation: "initiatePasswordReset",
        table: "v_users",
        username,
      });
      // Return success to avoid leaking information
      return success(undefined);
    }

    // Create a random token.
    const token = randomBytes(32).toString("hex");
    const initatedTime = new Date();
    const expirationTime = new Date(
      initatedTime.getTime() +
        PASSWORD_RESET_TOKEN_LIFESPAN_MINUTES * 60 * 1000,
    );
    const record = {
      login_id: user.login_id,
      token,
      initiated_at: initatedTime,
      expires_at: expirationTime,
    };

    // Save the token to the database.
    logger.debug("Creating password reset token record", {
      operation: "initiatePasswordReset",
      table: "password_reset_tokens",
      loginId: user.login_id,
      token: token.substring(0, 8) + "...", // Log partial token for security
      expiresAt: expirationTime.toISOString(),
    });

    await db
      .insertInto("password_reset_tokens")
      .values(record)
      .returning("id")
      .executeTakeFirst();

    logger.debug("Password reset token created successfully", {
      operation: "initiatePasswordReset",
      table: "password_reset_tokens",
      loginId: user.login_id,
      token: token.substring(0, 8) + "...",
    });

    // Send an email with the reset link.
    let link = `${host}/reset-password?username=${username}&token=${token}`;
    if (!link.startsWith("http")) {
      if (link.startsWith("localhost")) {
        link = `http://${link}`;
      } else {
        link = `https://${link}`;
      }
    }

    await sendEmail({
      to: user.email,
      subject: "Forecasting: Password Reset Link",
      text: `Click here to reset your password: ${link}`,
      html: `Click <a href="${link}">here</a> to reset your password.`,
    });

    const duration = Date.now() - startTime;
    logger.info("Password reset initiated successfully", {
      operation: "initiatePasswordReset",
      table: "password_reset_tokens",
      username,
      emailSent: true,
      duration,
    });

    return success(undefined);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to initiate password reset", err as Error, {
      operation: "initiatePasswordReset",
      table: "password_reset_tokens",
      username,
      duration,
    });
    return error(
      "Failed to initiate password reset",
      ERROR_CODES.DATABASE_ERROR,
    );
  }
}

export async function executePasswordReset({
  username,
  token,
  password,
}: {
  username: string;
  token: string;
  password: string;
}): Promise<ServerActionResult<void>> {
  logger.debug("Executing password reset", {
    username,
    token: token.substring(0, 8) + "...", // Log partial token for security
  });

  const startTime = Date.now();
  try {
    await updateLoginPasswordFromResetToken({ username, token, password });

    const duration = Date.now() - startTime;
    logger.debug("Password reset executed successfully", {
      operation: "executePasswordReset",
      table: "password_reset_tokens",
      username,
      token: token.substring(0, 8) + "...",
      duration,
    });

    return success(undefined);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to execute password reset", err as Error, {
      operation: "executePasswordReset",
      table: "password_reset_tokens",
      username,
      token: token.substring(0, 8) + "...",
      duration,
    });
    // Suppress details of errors to avoid leaking information.
    return error("Error resetting password", ERROR_CODES.VALIDATION_ERROR);
  }
}

export async function getPasswordResetTokens(): Promise<
  ServerActionResult<PasswordReset[]>
> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting password reset tokens", {
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    if (!currentUser?.is_admin) {
      logger.warn("Unauthorized attempt to get password reset tokens", {
        currentUserId: currentUser?.id,
      });
      return error(
        "You must be an admin to view password reset tokens",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    const passwordResetTokens = await db
      .selectFrom("password_reset_tokens")
      .selectAll()
      .orderBy("initiated_at", "desc")
      .execute();

    const duration = Date.now() - startTime;
    logger.debug(`Retrieved ${passwordResetTokens.length} password reset tokens`, {
      operation: "getPasswordResetTokens",
      table: "password_reset_tokens",
      duration,
    });

    return success(passwordResetTokens);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get password reset tokens", err as Error, {
      operation: "getPasswordResetTokens",
      table: "password_reset_tokens",
      duration,
    });
    return error(
      "Failed to retrieve password reset tokens",
      ERROR_CODES.DATABASE_ERROR,
    );
  }
}
