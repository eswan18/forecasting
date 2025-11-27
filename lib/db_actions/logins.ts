"use server";

import { db } from "@/lib/database";
import { Login, NewLogin, LoginUpdate } from "@/types/db_types";
import { getUserFromCookies } from "@/lib/get-user";
import { logger } from "@/lib/logger";
import {
  ServerActionResult,
  success,
  error,
  ERROR_CODES,
} from "@/lib/server-action-result";

export async function getLoginByUsername(
  username: string,
): Promise<ServerActionResult<Login | null>> {
  logger.debug("Getting login by username", {
    username,
  });

  const startTime = Date.now();
  try {
    const login = await db
      .selectFrom("logins")
      .selectAll()
      .where("username", "=", username)
      .executeTakeFirst();

    const duration = Date.now() - startTime;
    if (login) {
      logger.debug("Login retrieved successfully", {
        operation: "getLoginByUsername",
        table: "logins",
        loginId: login.id,
        duration,
      });
      return success(login);
    } else {
      logger.warn("Login not found", {
        operation: "getLoginByUsername",
        table: "logins",
        username,
        duration,
      });
      return success(null);
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get login by username", err as Error, {
      operation: "getLoginByUsername",
      table: "logins",
      username,
      duration,
    });
    return error("Failed to retrieve login", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function createLogin({
  login,
}: {
  login: NewLogin;
}): Promise<ServerActionResult<number>> {
  logger.debug("Creating login", {
    username: login.username,
  });

  const startTime = Date.now();
  try {
    const { id } = await db
      .insertInto("logins")
      .values(login)
      .returning("id")
      .executeTakeFirstOrThrow();

    const duration = Date.now() - startTime;
    logger.info("Login created successfully", {
      operation: "createLogin",
      table: "logins",
      loginId: id,
      username: login.username,
      duration,
    });

    return success(id);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to create login", err as Error, {
      operation: "createLogin",
      table: "logins",
      username: login.username,
      duration,
    });
    // Check for unique constraint violation (duplicate username)
    if (
      err instanceof Error &&
      err.message.includes("unique constraint") &&
      err.message.includes("username")
    ) {
      return error("Username already exists", ERROR_CODES.VALIDATION_ERROR);
    }
    return error("Failed to create login", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function updateLogin({
  id,
  login,
}: {
  id: number;
  login: LoginUpdate;
}): Promise<ServerActionResult<void>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Updating login", {
    loginId: id,
    updateFields: Object.keys(login),
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    // Check that the user is who they say they are.
    if (!currentUser || currentUser.login_id !== id) {
      logger.warn("Unauthorized attempt to update login", {
        loginId: id,
        currentUserId: currentUser?.id,
      });
      return error("Unauthorized", ERROR_CODES.UNAUTHORIZED);
    }

    // Users can only change their username with this function.
    // If they try to change anything else, throw an error.
    if (Object.keys(login).some((key) => !["username"].includes(key))) {
      logger.warn("Attempted to update unauthorized login fields", {
        loginId: id,
        attemptedFields: Object.keys(login),
        currentUserId: currentUser?.id,
      });
      return error(
        'Not authorized to update login fields other than "username"',
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    await db.updateTable("logins").set(login).where("id", "=", id).execute();

    const duration = Date.now() - startTime;
    logger.debug("Login updated successfully", {
      operation: "updateLogin",
      table: "logins",
      loginId: id,
      updateFields: Object.keys(login),
      duration,
    });

    return success(undefined);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to update login", err as Error, {
      operation: "updateLogin",
      table: "logins",
      loginId: id,
      duration,
    });
    // Check for unique constraint violation (duplicate username)
    if (
      err instanceof Error &&
      err.message.includes("unique constraint") &&
      err.message.includes("username")
    ) {
      return error("Username already exists", ERROR_CODES.VALIDATION_ERROR);
    }
    return error("Failed to update login", ERROR_CODES.DATABASE_ERROR);
  }
}
