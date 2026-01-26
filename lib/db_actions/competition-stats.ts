"use server";

import { getUserFromCookies } from "../get-user";
import { logger } from "@/lib/logger";
import {
  ServerActionResult,
  success,
  error,
  ERROR_CODES,
} from "@/lib/server-action-result";
import { withRLS } from "@/lib/db-helpers";

export interface CompetitionStats {
  /** Props the user hasn't forecasted yet (and are still open) */
  toForecast: number;
  /** Props that are closed (past deadline) but not yet resolved */
  closed: number;
  /** Props that have been resolved */
  resolved: number;
  /** Total props in the competition */
  total: number;
}

/**
 * Get aggregate statistics for a competition relative to a user
 *
 * For private competitions, uses per-prop dates (forecasts_due_date).
 * For public competitions, uses competition-level dates.
 */
export async function getCompetitionStats({
  competitionId,
  userId,
}: {
  competitionId: number;
  userId: number;
}): Promise<ServerActionResult<CompetitionStats>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting competition stats", {
    competitionId,
    userId,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    const now = new Date();

    const stats = await withRLS(currentUser?.id, async (trx) => {
      // Get all props for this competition with user forecast status
      const propsQuery = trx
        .selectFrom("v_props")
        .leftJoin("forecasts", (join) =>
          join
            .onRef("v_props.prop_id", "=", "forecasts.prop_id")
            .on("forecasts.user_id", "=", userId),
        )
        .select([
          "v_props.prop_id",
          "v_props.resolution_id",
          "v_props.prop_forecasts_due_date",
          "v_props.competition_forecasts_close_date",
          "v_props.competition_is_private",
          "forecasts.id as user_forecast_id",
        ])
        .where("v_props.competition_id", "=", competitionId);

      const props = await propsQuery.execute();

      let toForecast = 0;
      let closed = 0;
      let resolved = 0;

      for (const prop of props) {
        const isResolved = prop.resolution_id !== null;
        const hasUserForecast = prop.user_forecast_id !== null;

        // Determine the effective close date for this prop
        // Private competitions use per-prop dates, public use competition dates
        const closeDate = prop.competition_is_private
          ? prop.prop_forecasts_due_date
          : prop.competition_forecasts_close_date;

        const isClosed = closeDate !== null && closeDate < now;

        if (isResolved) {
          resolved++;
        } else if (isClosed) {
          closed++;
        } else if (!hasUserForecast) {
          // Still open and user hasn't forecasted
          toForecast++;
        }
      }

      return {
        toForecast,
        closed,
        resolved,
        total: props.length,
      };
    });

    const duration = Date.now() - startTime;
    logger.info("Competition stats calculated", {
      operation: "getCompetitionStats",
      competitionId,
      userId,
      stats,
      duration,
    });

    return success(stats);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get competition stats", err as Error, {
      operation: "getCompetitionStats",
      competitionId,
      userId,
      duration,
    });
    return error("Failed to get competition stats", ERROR_CODES.DATABASE_ERROR);
  }
}

export interface UpcomingDeadline {
  propId: number;
  propText: string;
  deadline: Date;
  userForecast: number | null;
  userForecastId: number | null;
}

/**
 * Get upcoming prop deadlines for a user in a competition
 * Returns props sorted by deadline (soonest first), excluding resolved props
 */
export async function getUpcomingDeadlines({
  competitionId,
  userId,
  limit = 5,
}: {
  competitionId: number;
  userId: number;
  limit?: number;
}): Promise<ServerActionResult<UpcomingDeadline[]>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting upcoming deadlines", {
    competitionId,
    userId,
    limit,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    const now = new Date();

    const deadlines = await withRLS(currentUser?.id, async (trx) => {
      // For private competitions, we use the prop-level deadline
      // For public competitions, we use the competition-level close date
      const results = await trx
        .selectFrom("v_props")
        .leftJoin("forecasts", (join) =>
          join
            .onRef("v_props.prop_id", "=", "forecasts.prop_id")
            .on("forecasts.user_id", "=", userId),
        )
        .select([
          "v_props.prop_id",
          "v_props.prop_text",
          "v_props.prop_forecasts_due_date",
          "v_props.competition_forecasts_close_date",
          "v_props.competition_is_private",
          "forecasts.forecast as user_forecast",
          "forecasts.id as user_forecast_id",
        ])
        .where("v_props.competition_id", "=", competitionId)
        .where("v_props.resolution_id", "is", null) // Not resolved
        .execute();

      // Filter and transform in JavaScript since we need conditional date logic
      const upcomingProps = results
        .map((row) => {
          const deadline = row.competition_is_private
            ? row.prop_forecasts_due_date
            : row.competition_forecasts_close_date;

          if (!deadline || deadline < now) {
            return null; // Already past deadline or no deadline
          }

          return {
            propId: row.prop_id,
            propText: row.prop_text,
            deadline,
            userForecast: row.user_forecast,
            userForecastId: row.user_forecast_id,
          };
        })
        .filter((item): item is UpcomingDeadline => item !== null)
        .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
        .slice(0, limit);

      return upcomingProps;
    });

    const duration = Date.now() - startTime;
    logger.info(`Retrieved ${deadlines.length} upcoming deadlines`, {
      operation: "getUpcomingDeadlines",
      competitionId,
      userId,
      limit,
      duration,
    });

    return success(deadlines);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get upcoming deadlines", err as Error, {
      operation: "getUpcomingDeadlines",
      competitionId,
      userId,
      limit,
      duration,
    });
    return error(
      "Failed to get upcoming deadlines",
      ERROR_CODES.DATABASE_ERROR,
    );
  }
}
