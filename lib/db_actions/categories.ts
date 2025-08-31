"use server";
import { Category } from "@/types/db_types";
import { getUserFromCookies } from "../get-user";
import { db } from "@/lib/database";
import { logger } from "@/lib/logger";

export async function getCategories(): Promise<Category[]> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting categories", { currentUserId: currentUser?.id });

  const startTime = Date.now();
  try {
    if (!currentUser) {
      logger.warn("Unauthorized attempt to get categories");
      throw new Error("Unauthorized");
    }

    const results = await db.selectFrom("categories").selectAll().execute();

    const duration = Date.now() - startTime;
    logger.info(`Retrieved ${results.length} categories`, {
      operation: "getCategories",
      table: "categories",
      duration,
    });

    return results;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get categories", error as Error, {
      operation: "getCategories",
      table: "categories",
      duration,
    });
    throw error;
  }
}
