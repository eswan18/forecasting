"use server";

import { OrderByExpression, OrderByModifiers } from "kysely";
import { db } from "@/lib/database";
import { VUser, UserUpdate, Database } from "@/types/db_types";
import { getUserFromCookies } from "@/lib/get-user";
import {
  ServerActionResult,
  success,
  error,
  ERROR_CODES,
} from "@/lib/server-action-result";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

type Sort = {
  expr: OrderByExpression<Database, "v_users", VUser>;
  modifiers?: OrderByModifiers;
};

export async function getUsers({ sort }: { sort?: Sort } = {}): Promise<
  ServerActionResult<VUser[]>
> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting users", {
    currentUserId: currentUser?.id,
    hasSort: !!sort,
  });

  const startTime = Date.now();
  try {
    // v_users carries every user's email and idp_user_id -- the subject the
    // IdP identifies them by across the whole fleet -- so this is admin-only.
    // The `users` table has no RLS, so this check is the only thing standing
    // between a logged-in caller and the entire directory; a server action is
    // reachable without the /admin layout that gates the page.
    if (!currentUser?.is_admin) {
      logger.warn("Non-admin attempt to get users", { userId: currentUser?.id });
      return error(
        "Only admins can view users",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    let query = db.selectFrom("v_users").selectAll();
    if (sort) {
      query = query.orderBy(sort.expr, sort.modifiers);
    }
    const users = await query.execute();

    const duration = Date.now() - startTime;
    logger.debug(`Retrieved ${users.length} users`, {
      operation: "getUsers",
      table: "v_users",
      duration,
    });

    return success(users);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get users", err as Error, {
      operation: "getUsers",
      table: "v_users",
      duration,
    });
    return error("Failed to fetch users", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function getUserById(
  id: number,
): Promise<ServerActionResult<VUser | undefined>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting user by ID", {
    userId: id,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    // Admin-only for the same reason as getUsers above: the row includes
    // email and idp_user_id, and there is no RLS on `users` to fall back on.
    if (!currentUser?.is_admin) {
      logger.warn("Non-admin attempt to get user by ID", {
        userId: currentUser?.id,
        targetUserId: id,
      });
      return error(
        "Only admins can view user details",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    const foundUser = await db
      .selectFrom("v_users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    const duration = Date.now() - startTime;
    if (foundUser) {
      logger.debug("User retrieved successfully", {
        operation: "getUserById",
        table: "v_users",
        userId: id,
        duration,
      });
    } else {
      logger.warn("User not found", {
        operation: "getUserById",
        table: "v_users",
        userId: id,
        duration,
      });
    }

    return success(foundUser);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get user by ID", err as Error, {
      operation: "getUserById",
      table: "v_users",
      userId: id,
      duration,
    });
    return error("Failed to fetch user details", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function setUserActive({
  userId,
  active,
}: {
  userId: number;
  active: boolean;
}): Promise<ServerActionResult<VUser>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Setting user active status", {
    currentUserId: currentUser?.id,
    targetUserId: userId,
    active,
  });

  const startTime = Date.now();
  try {
    if (!currentUser) {
      logger.warn("Unauthorized attempt to toggle user status");
      return error(
        "You must be logged in to modify user status",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    if (!currentUser.is_admin) {
      logger.warn("Non-admin attempt to toggle user status", {
        userId: currentUser.id,
        targetUserId: userId,
      });
      return error(
        "Only admins can modify user status",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    // Set the status: active = null, inactive = current timestamp
    const newDeactivatedAt = active ? null : new Date();

    // Update the user's status
    await db
      .updateTable("users")
      .set({ deactivated_at: newDeactivatedAt })
      .where("id", "=", userId)
      .execute();

    revalidatePath("/admin/users");

    const updatedUserResult = await getUserById(userId);
    if (!updatedUserResult.success) {
      return updatedUserResult;
    }

    const duration = Date.now() - startTime;
    logger.info("User status updated successfully", {
      operation: "setUserActive",
      userId,
      active,
      duration,
    });

    return success(updatedUserResult.data!);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to update user status", err as Error, {
      operation: "setUserActive",
      userId,
      active,
      duration,
    });
    return error("Failed to update user status", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function updateUser({
  id,
  user,
}: {
  id: number;
  user: UserUpdate;
}): Promise<ServerActionResult<void>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Updating user", {
    userId: id,
    updateFields: Object.keys(user),
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    // Check that the user is who they say they are.
    if (!currentUser || currentUser.id !== id) {
      logger.warn("Unauthorized attempt to update user", {
        userId: id,
        currentUserId: currentUser?.id,
      });
      return error(
        "You can only update your own profile",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    // Users can only change a couple of fields: name and email.
    // If they try to change anything else, return an error.
    const allowedFields = ["name", "email"];
    const invalidFields = Object.keys(user).filter(
      (key) => !allowedFields.includes(key),
    );

    if (invalidFields.length > 0) {
      logger.warn("User attempted to update unauthorized fields", {
        userId: id,
        invalidFields,
        currentUserId: currentUser.id,
      });
      return error(
        `You cannot update the following fields: ${invalidFields.join(", ")}`,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    await db.updateTable("users").set(user).where("id", "=", id).execute();

    const duration = Date.now() - startTime;
    logger.debug("User updated successfully", {
      operation: "updateUser",
      table: "users",
      userId: id,
      updateFields: Object.keys(user),
      duration,
    });

    return success(undefined);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to update user", err as Error, {
      operation: "updateUser",
      table: "users",
      userId: id,
      duration,
    });

    if (err instanceof Error && err.message.includes("duplicate")) {
      return error(
        "A user with this email already exists",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
    return error("Failed to update user", ERROR_CODES.DATABASE_ERROR);
  }
}
