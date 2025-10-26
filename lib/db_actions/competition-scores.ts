"use server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/database";
import { getUserFromCookies } from "@/lib/get-user";
import { sql } from "kysely";
import {
  ServerActionResult,
  success,
  error,
  ERROR_CODES,
} from "@/lib/server-action-result";

export interface UserScore {
  userId: number;
  userName: string;
  score: number;
}

export interface UserCategoryScore {
  userId: number;
  userName: string;
  categoryId: number;
  score: number;
}

export interface CompetitionScore {
  overallScores: UserScore[];
  categoryScores: UserCategoryScore[];
}

export async function getCompetitionScores({
  competitionId,
}: {
  competitionId: number;
}): Promise<ServerActionResult<CompetitionScore>> {
  // Scores are computed as the mean of the squared differences between the forecast and the resolution.
  const currentUser = await getUserFromCookies();
  logger.debug("Getting competition scores", {
    competitionId,
    currentUserId: currentUser?.id,
  });
  const startTime = Date.now();

  try {
    if (!currentUser) {
      logger.warn("Unauthorized attempt to get competition scores");
      return error(
        "You must be logged in to view competition scores",
        ERROR_CODES.UNAUTHORIZED,
      );
    }
    const results = await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(
          db,
        ),
      );

      // Execute both queries in parallel for better performance
      const [overallResults, categoryResults] = await Promise.all([
        // Get overall scores (averaged by user across all categories)
        trx
          .selectFrom("v_forecasts")
          .select(["user_id", "user_name", sql`AVG(score)`.as("average_score")])
          .where("competition_id", "=", competitionId)
          .where("resolution", "is not", null)
          .groupBy(["user_id", "user_name"])
          .execute(),

        // Get category scores (averaged by user per category)
        trx
          .selectFrom("v_forecasts")
          .select([
            "user_id",
            "user_name",
            "category_id",
            sql`AVG(score)`.as("average_score"),
          ])
          .where("competition_id", "=", competitionId)
          .where("resolution", "is not", null)
          .where("category_id", "is not", null)
          .groupBy(["user_id", "user_name", "category_id"])
          .execute(),
      ]);

      return { overallResults, categoryResults };
    });

    const duration = Date.now() - startTime;
    logger.debug("Retrieved aggregated scores from database", {
      operation: "getCompetitionScores",
      table: "v_forecasts",
      duration,
      competitionId,
      currentUserId: currentUser?.id,
      overallCount: results.overallResults.length,
      categoryCount: results.categoryResults.length,
    });

    // Transform results into the expected array format
    const overallScores: UserScore[] = results.overallResults.map((row) => ({
      userId: row.user_id,
      userName: row.user_name,
      score: Number(row.average_score),
    }));

    const categoryScores: UserCategoryScore[] = results.categoryResults.map(
      (row) => ({
        userId: row.user_id,
        userName: row.user_name,
        categoryId: row.category_id!,
        score: Number(row.average_score),
      }),
    );

    logger.info("Competition scores calculated successfully", {
      operation: "getCompetitionScores",
      competitionId,
      currentUserId: currentUser?.id,
      userCount: overallScores.length,
      categoryCount: categoryScores.length,
      duration: Date.now() - startTime,
    });

    return success({
      overallScores,
      categoryScores,
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get competition scores", err as Error, {
      operation: "getCompetitionScores",
      table: "v_forecasts",
      duration,
      competitionId,
      currentUserId: currentUser?.id,
    });
    return error(
      "Failed to retrieve competition scores",
      ERROR_CODES.DATABASE_ERROR,
    );
  }
}
