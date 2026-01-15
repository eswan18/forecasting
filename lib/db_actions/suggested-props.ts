"use server";

import { NewSuggestedProp, VSuggestedProp } from "@/types/db_types";
import { db } from "@/lib/database";
import { getUserFromCookies } from "@/lib/get-user";
import { logger } from "@/lib/logger";
import { sql } from "kysely";
import { revalidatePath } from "next/cache";
import {
  ServerActionResult,
  success,
  error,
  ERROR_CODES,
} from "@/lib/server-action-result";

export async function getSuggestedProps(): Promise<
  ServerActionResult<VSuggestedProp[]>
> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting suggested props", {
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    if (!currentUser?.is_admin) {
      logger.warn("Unauthorized attempt to get suggested props", {
        currentUserId: currentUser?.id,
      });
      return error(
        "Only admins can view suggested props",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    const results = await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true);`.compile(
          db,
        ),
      );
      return await trx.selectFrom("v_suggested_props").selectAll().execute();
    });

    const duration = Date.now() - startTime;
    logger.info(`Retrieved ${results.length} suggested props`, {
      operation: "getSuggestedProps",
      table: "v_suggested_props",
      duration,
    });

    return success(results);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get suggested props", err as Error, {
      operation: "getSuggestedProps",
      table: "v_suggested_props",
      duration,
    });
    return error(
      "Failed to retrieve suggested props",
      ERROR_CODES.DATABASE_ERROR,
    );
  }
}

export async function createSuggestedProp({
  prop,
}: {
  prop: NewSuggestedProp;
}): Promise<ServerActionResult<number>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Creating suggested prop", {
    suggesterUserId: prop.suggester_user_id,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    if (!currentUser) {
      logger.warn("Unauthorized attempt to create suggested prop", {
        suggesterUserId: prop.suggester_user_id,
      });
      return error("You must be logged in", ERROR_CODES.UNAUTHORIZED);
    }

    // Make sure the user is suggesting a prop with their own user ID.
    if (prop.suggester_user_id !== currentUser.id) {
      logger.warn("User attempted to suggest prop for different user", {
        suggesterUserId: prop.suggester_user_id,
        currentUserId: currentUser.id,
      });
      return error("Unauthorized", ERROR_CODES.UNAUTHORIZED);
    }

    const { id } = await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true);`.compile(
          db,
        ),
      );
      return await trx
        .insertInto("suggested_props")
        .values(prop)
        .returning("id")
        .executeTakeFirstOrThrow();
    });

    const duration = Date.now() - startTime;
    logger.info("Suggested prop created successfully", {
      operation: "createSuggestedProp",
      table: "suggested_props",
      suggestedPropId: id,
      suggesterUserId: prop.suggester_user_id,
      duration,
    });

    return success(id);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to create suggested prop", err as Error, {
      operation: "createSuggestedProp",
      table: "suggested_props",
      suggesterUserId: prop.suggester_user_id,
      duration,
    });
    return error("Failed to create suggested prop", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function deleteSuggestedProp({
  id,
}: {
  id: number;
}): Promise<ServerActionResult<void>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Deleting suggested prop", {
    suggestedPropId: id,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    if (!currentUser?.is_admin) {
      logger.warn("Unauthorized attempt to delete suggested prop", {
        suggestedPropId: id,
        currentUserId: currentUser?.id,
      });
      return error(
        "Only admins can delete suggested props",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(
          db,
        ),
      );
      await trx.deleteFrom("suggested_props").where("id", "=", id).execute();
    });

    const duration = Date.now() - startTime;
    logger.info("Suggested prop deleted successfully", {
      operation: "deleteSuggestedProp",
      table: "suggested_props",
      suggestedPropId: id,
      duration,
    });

    revalidatePath("/admin/suggested-props");
    return success(undefined);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to delete suggested prop", err as Error, {
      operation: "deleteSuggestedProp",
      table: "suggested_props",
      suggestedPropId: id,
      duration,
    });
    return error("Failed to delete suggested prop", ERROR_CODES.DATABASE_ERROR);
  }
}
