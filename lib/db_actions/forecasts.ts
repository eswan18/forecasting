"use server";

import { Database, ForecastUpdate, NewForecast, VForecast, VProp } from "@/types/db_types";
import { getUserFromCookies } from "@/lib/get-user";
import { revalidatePath } from "next/cache";
import { OrderByExpression, OrderByModifiers, sql } from "kysely";
import { logger } from "@/lib/logger";
import {
  ServerActionResult,
  success,
  error,
  ERROR_CODES,
} from "@/lib/server-action-result";
import { withRLS, withRLSAction } from "@/lib/db-helpers";

export type VForecastsOrderByExpression = OrderByExpression<
  Database,
  "v_forecasts",
  VForecast
>;
type Sort = {
  expr: VForecastsOrderByExpression;
  modifiers?: OrderByModifiers;
};

export async function getForecasts({
  userId,
  competitionId,
  propId,
  resolution,
  sort,
}: {
  userId?: number;
  competitionId?: number | null;
  propId?: number;
  resolution?: (boolean | null)[];
  sort?: Sort;
}): Promise<ServerActionResult<VForecast[]>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting forecasts", {
    userId,
    competitionId,
    propId,
    resolution,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    const results = await withRLS(currentUser?.id, async (trx) => {
      let query = trx.selectFrom("v_forecasts").selectAll();
      if (userId !== undefined) {
        query = query.where("user_id", "=", userId);
      }
      if (typeof competitionId === "number") {
        // If competitionID is a number, we want to filter down to that competition.
        query = query.where("competition_id", "=", competitionId);
      } else if (competitionId === null) {
        // If competitionID is null, we want to filter down to forecasts that are not in a competition.
        query = query.where("competition_id", "is", null);
      }
      if (propId !== undefined) {
        query = query.where("prop_id", "=", propId);
      }
      if (resolution !== undefined) {
        const nonNullResolutions = resolution.filter((res) => res !== null);
        query = query.where((eb) => {
          const ors = [];
          if (nonNullResolutions.length > 0) {
            ors.push(eb("resolution", "in", nonNullResolutions));
          }
          if (resolution && resolution.find((r) => r === null) !== undefined) {
            // If null is in the array, include rows where resolution is null.
            ors.push(eb("resolution", "is", null));
          }
          return eb.or(ors);
        });
      }
      if (sort) {
        query = query.orderBy(sort.expr, sort.modifiers);
      }
      return await query.execute();
    });

    const duration = Date.now() - startTime;
    logger.debug(`Retrieved ${results.length} forecasts`, {
      operation: "getForecasts",
      table: "v_forecasts",
      duration,
      userId,
      competitionId,
    });

    return success(results);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get forecasts", err as Error, {
      operation: "getForecasts",
      table: "v_forecasts",
      duration,
      userId,
      competitionId,
    });
    return error("Failed to retrieve forecasts", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function createForecast({
  forecast,
}: {
  forecast: NewForecast;
}): Promise<ServerActionResult<number>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Creating forecast", {
    propId: forecast.prop_id,
    userId: forecast.user_id,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    // Check that the competition hasn't ended, then insert the record.
    const result = await withRLSAction(currentUser?.id, async (trx) => {
      const prop = await trx
        .selectFrom("v_props")
        .where("prop_id", "=", forecast.prop_id)
        .select("competition_forecasts_close_date")
        .executeTakeFirst();
      const closeDate = prop?.competition_forecasts_close_date;
      if (closeDate && closeDate <= new Date()) {
        logger.warn("Attempted to create forecast past due date", {
          propId: forecast.prop_id,
          dueDate: closeDate.toISOString(),
        });
        return error(
          "Cannot create forecasts past the due date",
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      const { id } = await trx
        .insertInto("forecasts")
        .values(forecast)
        .returning("id")
        .executeTakeFirstOrThrow();
      return success(id);
    });

    if (result.success) {
      const duration = Date.now() - startTime;
      logger.info("Forecast created successfully", {
        operation: "createForecast",
        table: "forecasts",
        forecastId: result.data,
        propId: forecast.prop_id,
        userId: forecast.user_id,
        duration,
      });

      revalidatePath("/competitions");
      revalidatePath("/standalone/forecasts");
    }

    return result;
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to create forecast", err as Error, {
      operation: "createForecast",
      table: "forecasts",
      propId: forecast.prop_id,
      userId: forecast.user_id,
      duration,
    });
    return error("Failed to create forecast", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function updateForecast({
  id,
  forecast,
}: {
  id: number;
  forecast: ForecastUpdate;
}): Promise<ServerActionResult<void>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Updating forecast", {
    forecastId: id,
    currentUserId: currentUser?.id,
    updateFields: Object.keys(forecast),
  });

  const startTime = Date.now();
  try {
    // Don't let users change any column except the forecast.
    if (Object.keys(forecast).length !== 1 || !("forecast" in forecast)) {
      logger.warn("Attempted update with invalid columns", {
        forecastId: id,
        attemptedColumns: Object.keys(forecast),
        currentUserId: currentUser?.id,
      });
      return error("Unauthorized", ERROR_CODES.UNAUTHORIZED);
    }

    // Check that the competition hasn't ended, then update the record.
    const result = await withRLSAction(currentUser?.id, async (trx) => {
      // Check close date via v_forecasts (which joins with competition data)
      const forecastRecord = await trx
        .selectFrom("v_forecasts")
        .where("forecast_id", "=", id)
        .select("competition_forecasts_close_date")
        .executeTakeFirst();

      if (!forecastRecord) {
        return error("Forecast not found", ERROR_CODES.VALIDATION_ERROR);
      }

      const closeDate = forecastRecord.competition_forecasts_close_date;
      if (closeDate && closeDate <= new Date()) {
        logger.warn("Attempted to update forecast past due date", {
          forecastId: id,
          dueDate: closeDate.toISOString(),
        });
        return error(
          "Cannot update forecasts past the due date",
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      await trx
        .updateTable("forecasts")
        .set(forecast)
        .where("id", "=", id)
        .execute();

      return success(undefined);
    });

    if (result.success) {
      const duration = Date.now() - startTime;
      logger.debug("Forecast updated successfully", {
        operation: "updateForecast",
        table: "forecasts",
        forecastId: id,
        currentUserId: currentUser?.id,
        duration,
      });

      revalidatePath("/competitions");
      revalidatePath("/standalone/forecasts");
    }

    return result;
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to update forecast", err as Error, {
      operation: "updateForecast",
      table: "forecasts",
      forecastId: id,
      duration,
    });
    return error("Failed to update forecast", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function getUnforecastedProps({
  competitionId,
  userId,
}: {
  competitionId: number;
  userId: number;
}): Promise<ServerActionResult<VProp[]>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting unforecasted props", {
    competitionId,
    userId,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    // Fetch props without a corresponding entry in the forecasts table for that user.
    const results = await withRLS(currentUser?.id, async (trx) => {
      return await trx
        .selectFrom("v_props")
        .selectAll()
        .where("competition_id", "=", competitionId)
        .where(({ not, exists, selectFrom }) =>
          not(
            exists(
              selectFrom("forecasts")
                .select("id")
                .where("user_id", "=", userId)
                .whereRef("forecasts.prop_id", "=", "v_props.prop_id"),
            ),
          ),
        )
        .execute();
    });

    const duration = Date.now() - startTime;
    logger.debug(`Found ${results.length} unforecasted props`, {
      operation: "getUnforecastedProps",
      table: "v_props",
      competitionId,
      userId,
      duration,
    });

    return success(results);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get unforecasted props", err as Error, {
      operation: "getUnforecastedProps",
      table: "v_props",
      competitionId,
      userId,
      duration,
    });
    return error(
      "Failed to retrieve unforecasted props",
      ERROR_CODES.DATABASE_ERROR,
    );
  }
}

export async function getPropsWithUserForecasts({
  userId,
  competitionId,
}: {
  userId: number;
  competitionId: number | null;
}): Promise<
  ServerActionResult<
    (VProp & {
      user_forecast: number | null;
      user_forecast_id: number | null;
      community_average: number | null;
    })[]
  >
> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting props with user forecasts", {
    userId,
    competitionId,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    const results = await withRLS(currentUser?.id, async (trx) => {
      // Subquery to calculate community average per prop
      const communityAvgSubquery = trx
        .selectFrom("forecasts")
        .select([
          "prop_id",
          sql<number>`AVG(forecast)`.as("avg_forecast"),
        ])
        .groupBy("prop_id")
        .as("community_stats");

      let query = trx
        .selectFrom("v_props")
        .leftJoin("forecasts", (join) =>
          join
            .onRef("v_props.prop_id", "=", "forecasts.prop_id")
            .on("forecasts.user_id", "=", userId),
        )
        .leftJoin(communityAvgSubquery, (join) =>
          join.onRef("v_props.prop_id", "=", "community_stats.prop_id"),
        )
        .selectAll("v_props")
        .select("forecasts.forecast as user_forecast")
        .select("forecasts.id as user_forecast_id")
        .select("community_stats.avg_forecast as community_average");

      // Handle standalone props (competitionId = null)
      if (competitionId === null) {
        query = query.where("v_props.competition_id", "is", null);
      } else {
        query = query.where("v_props.competition_id", "=", competitionId);
      }

      return await query.execute();
    });

    const duration = Date.now() - startTime;
    logger.debug(`Retrieved ${results.length} props with user forecasts`, {
      operation: "getPropsWithUserForecasts",
      table: "v_props",
      duration,
      userId,
      competitionId,
    });

    return success(results);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get props with user forecasts", err as Error, {
      operation: "getPropsWithUserForecasts",
      table: "v_props",
      userId,
      competitionId,
      duration,
    });
    return error(
      "Failed to retrieve props with user forecasts",
      ERROR_CODES.DATABASE_ERROR,
    );
  }
}

export async function getRecentlyResolvedForecasts({
  userId,
  limit = 3,
}: {
  userId: number;
  limit?: number;
}): Promise<ServerActionResult<VForecast[]>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting recently resolved forecasts", {
    userId,
    limit,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    const results = await withRLS(currentUser?.id, async (trx) => {
      return await trx
        .selectFrom("v_forecasts")
        .selectAll()
        .where("user_id", "=", userId)
        .where("resolution", "is not", null)
        .orderBy("resolution_updated_at", "desc")
        .limit(limit)
        .execute();
    });

    const duration = Date.now() - startTime;
    logger.debug(`Retrieved ${results.length} recently resolved forecasts`, {
      operation: "getRecentlyResolvedForecasts",
      table: "v_forecasts",
      duration,
      userId,
      limit,
    });

    return success(results);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get recently resolved forecasts", err as Error, {
      operation: "getRecentlyResolvedForecasts",
      table: "v_forecasts",
      userId,
      limit,
      duration,
    });
    return error(
      "Failed to retrieve recently resolved forecasts",
      ERROR_CODES.DATABASE_ERROR,
    );
  }
}

export async function deleteForecast({
  id,
}: {
  id: number;
}): Promise<ServerActionResult<void>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Deleting forecast", {
    forecastId: id,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    await withRLS(currentUser?.id, async (trx) => {
      await trx.deleteFrom("forecasts").where("id", "=", id).execute();
    });

    const duration = Date.now() - startTime;
    logger.debug("Forecast deleted successfully", {
      operation: "deleteForecast",
      table: "forecasts",
      forecastId: id,
      currentUserId: currentUser?.id,
      duration,
    });

    revalidatePath("/competitions");
    revalidatePath("/standalone/forecasts");
    return success(undefined);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to delete forecast", err as Error, {
      operation: "deleteForecast",
      table: "forecasts",
      forecastId: id,
      duration,
    });
    return error("Failed to delete forecast", ERROR_CODES.DATABASE_ERROR);
  }
}
