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

export interface UserForecastScore {
  forecastId: number;
  propId: number;
  propText: string;
  categoryId: number | null;
  categoryName: string | null;
  forecast: number;
  resolution: boolean | null;
  score: number | null;
}

export interface UserScoreBreakdown {
  userId: number;
  userName: string;
  overallScore: number;
  categoryScores: UserCategoryScore[];
  forecastScores: UserForecastScore[];
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

export async function getUserScoreBreakdown({
  competitionId,
  userId,
}: {
  competitionId: number;
  userId: number;
}): Promise<ServerActionResult<UserScoreBreakdown>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting user score breakdown", {
    competitionId,
    userId,
    currentUserId: currentUser?.id,
  });
  const startTime = Date.now();

  try {
    if (!currentUser) {
      logger.warn("Unauthorized attempt to get user score breakdown");
      return error(
        "You must be logged in to view user scores",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    const results = await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(
          db,
        ),
      );

      // Get user info and overall score
      const [userInfo] = await trx
        .selectFrom("v_forecasts")
        .select(["user_id", "user_name", sql`AVG(score)`.as("average_score")])
        .where("competition_id", "=", competitionId)
        .where("user_id", "=", userId)
        .where("resolution", "is not", null)
        .groupBy(["user_id", "user_name"])
        .execute();

      if (!userInfo) {
        return null;
      }

      // Get category scores
      const categoryResults = await trx
        .selectFrom("v_forecasts")
        .select([
          "user_id",
          "user_name",
          "category_id",
          sql`AVG(score)`.as("average_score"),
        ])
        .where("competition_id", "=", competitionId)
        .where("user_id", "=", userId)
        .where("resolution", "is not", null)
        .where("category_id", "is not", null)
        .groupBy(["user_id", "user_name", "category_id"])
        .execute();

      // Get individual forecast scores
      const forecastResults = await trx
        .selectFrom("v_forecasts")
        .select([
          "forecast_id",
          "prop_id",
          "prop_text",
          "category_id",
          "category_name",
          "forecast",
          "resolution",
          "score",
        ])
        .where("competition_id", "=", competitionId)
        .where("user_id", "=", userId)
        .where("resolution", "is not", null)
        .orderBy("category_id", "asc")
        .orderBy("prop_id", "asc")
        .execute();

      return {
        userInfo,
        categoryResults,
        forecastResults,
      };
    });

    if (!results || !results.userInfo) {
      return error(
        "User not found or has no scores for this competition",
        ERROR_CODES.NOT_FOUND,
      );
    }

    const duration = Date.now() - startTime;
    logger.debug("Retrieved user score breakdown from database", {
      operation: "getUserScoreBreakdown",
      table: "v_forecasts",
      duration,
      competitionId,
      userId,
      currentUserId: currentUser?.id,
      forecastCount: results.forecastResults.length,
    });

    const categoryScores: UserCategoryScore[] = results.categoryResults.map(
      (row) => ({
        userId: row.user_id,
        userName: row.user_name,
        categoryId: row.category_id!,
        score: Number(row.average_score),
      }),
    );

    const forecastScores: UserForecastScore[] = results.forecastResults.map(
      (row) => ({
        forecastId: row.forecast_id,
        propId: row.prop_id,
        propText: row.prop_text,
        categoryId: row.category_id,
        categoryName: row.category_name,
        forecast: Number(row.forecast),
        resolution: row.resolution,
        score: row.score !== null ? Number(row.score) : null,
      }),
    );

    logger.info("User score breakdown calculated successfully", {
      operation: "getUserScoreBreakdown",
      competitionId,
      userId,
      currentUserId: currentUser?.id,
      forecastCount: forecastScores.length,
      duration: Date.now() - startTime,
    });

    return success({
      userId: results.userInfo.user_id,
      userName: results.userInfo.user_name,
      overallScore: Number(results.userInfo.average_score),
      categoryScores,
      forecastScores,
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get user score breakdown", err as Error, {
      operation: "getUserScoreBreakdown",
      table: "v_forecasts",
      duration,
      competitionId,
      userId,
      currentUserId: currentUser?.id,
    });
    return error(
      "Failed to retrieve user score breakdown",
      ERROR_CODES.DATABASE_ERROR,
    );
  }
}
