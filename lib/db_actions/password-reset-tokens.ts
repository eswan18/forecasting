"use server";

import { randomBytes } from "crypto";
import { db } from "@/lib/database";
import { headers } from "next/headers";
import { sendEmail } from "../email";
import { updateLoginPasswordFromResetToken } from "../auth";
import { logger } from "@/lib/logger";

const PASSWORD_RESET_TOKEN_LIFESPAN_MINUTES = 15;

export async function initiatePasswordReset({
  username,
}: {
  username: string;
}) {
  logger.debug("Initiating password reset", {
    username,
  });

  const startTime = Date.now();
  try {
    // We need the hostname in order to build the password reset link.
    const headerValues = await headers();
    const host = headerValues.get("host");
    if (!host) {
      throw new Error("Host header is missing");
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
      return;
    }

    if (!user.login_id) {
      logger.warn("Attempted password reset for user without login_id", {
        operation: "initiatePasswordReset",
        table: "v_users",
        username,
      });
      return;
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
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to initiate password reset", error as Error, {
      operation: "initiatePasswordReset",
      table: "password_reset_tokens",
      username,
      duration,
    });
    throw error;
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
}) {
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
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to execute password reset", error as Error, {
      operation: "executePasswordReset",
      table: "password_reset_tokens",
      username,
      token: token.substring(0, 8) + "...",
      duration,
    });
    // Suppress details of errors to avoid leaking information.
    throw new Error("Error resetting password");
  }
}
