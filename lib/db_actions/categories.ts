"use server";
import { Category } from "@/types/db_types";
import { getUserFromCookies } from "../get-user";
import { db } from "@/lib/database";
import { logger } from "@/lib/logger";
import {
  ServerActionResult,
  success,
  error,
  ERROR_CODES,
} from "@/lib/server-action-result";

export async function getCategories(): Promise<
  ServerActionResult<Category[]>
> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting categories", { currentUserId: currentUser?.id });

  const startTime = Date.now();
  try {
    if (!currentUser) {
      logger.warn("Unauthorized attempt to get categories");
      return error(
        "You must be logged in to view categories",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    const results = await db.selectFrom("categories").selectAll().execute();

    const duration = Date.now() - startTime;
    logger.debug(`Retrieved ${results.length} categories`, {
      operation: "getCategories",
      table: "categories",
      duration,
    });

    return success(results);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get categories", err as Error, {
      operation: "getCategories",
      table: "categories",
      duration,
    });
    return error("Failed to fetch categories", ERROR_CODES.DATABASE_ERROR);
  }
}
