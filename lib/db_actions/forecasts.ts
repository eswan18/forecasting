"use server";

import {
  Database,
  ForecastUpdate,
  NewForecast,
  VForecast,
  VProp,
} from "@/types/db_types";
import { db } from "@/lib/database";
import { getUserFromCookies } from "@/lib/get-user";
import { revalidatePath } from "next/cache";
import { OrderByExpression, OrderByModifiers, sql } from "kysely";
import { logger } from "@/lib/logger";

export type VForecastsOrderByExpression = OrderByExpression<
  Database,
  "v_forecasts",
  {}
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
}): Promise<VForecast[]> {
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
    const results = await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(
          db,
        ),
      );
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

    return results;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get forecasts", error as Error, {
      operation: "getForecasts",
      table: "v_forecasts",
      duration,
      userId,
      competitionId,
    });
    throw error;
  }
}

export async function createForecast({
  forecast,
}: {
  forecast: NewForecast;
}): Promise<number> {
  const currentUser = await getUserFromCookies();
  logger.debug("Creating forecast", {
    propId: forecast.prop_id,
    userId: forecast.user_id,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    // Check that the competition hasn't ended already.
    await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(
          db,
        ),
      );
      const prop = await trx
        .selectFrom("v_props")
        .where("prop_id", "=", forecast.prop_id)
        .select("competition_forecasts_due_date")
        .executeTakeFirst();
      const dueDate = prop?.competition_forecasts_due_date;
      if (dueDate && dueDate <= new Date()) {
        logger.warn("Attempted to create forecast past due date", {
          propId: forecast.prop_id,
          dueDate: dueDate.toISOString(),
        });
        throw new Error("Cannot create forecasts past the due date");
      }
    });

    // Insert the record.
    const id = await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(
          db,
        ),
      );
      const { id } = await trx
        .insertInto("forecasts")
        .values(forecast)
        .returning("id")
        .executeTakeFirstOrThrow();
      return id;
    });

    const duration = Date.now() - startTime;
    logger.info("Forecast created successfully", {
      operation: "createForecast",
      table: "forecasts",
      forecastId: id,
      propId: forecast.prop_id,
      userId: forecast.user_id,
      duration,
    });

    revalidatePath("/competitions");
    revalidatePath("/standalone/forecasts");
    return id;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to create forecast", error as Error, {
      operation: "createForecast",
      table: "forecasts",
      propId: forecast.prop_id,
      userId: forecast.user_id,
      duration,
    });
    throw error;
  }
}

export async function updateForecast({
  id,
  forecast,
}: {
  id: number;
  forecast: ForecastUpdate;
}): Promise<void> {
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
      throw new Error("Unauthorized");
    }

    // Check that the competition hasn't ended already.
    await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(
          db,
        ),
      );
      const prop = await trx
        .selectFrom("v_props")
        .where("prop_id", "=", id)
        .select("competition_forecasts_due_date")
        .executeTakeFirst();
      const dueDate = prop?.competition_forecasts_due_date;
      if (dueDate && dueDate <= new Date()) {
        logger.warn("Attempted to update forecast past due date", {
          forecastId: id,
          dueDate: dueDate.toISOString(),
        });
        throw new Error("Cannot create forecasts past the due date");
      }
    });

    // Update the record.
    await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(
          db,
        ),
      );
      await trx
        .updateTable("forecasts")
        .set(forecast)
        .where("id", "=", id)
        .execute();
    });

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
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to update forecast", error as Error, {
      operation: "updateForecast",
      table: "forecasts",
      forecastId: id,
      duration,
    });
    throw error;
  }
}

export async function getUnforecastedProps({
  competitionId,
  userId,
}: {
  competitionId: number;
  userId: number;
}): Promise<VProp[]> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting unforecasted props", {
    competitionId,
    userId,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    // Fetch props without a corresponding entry in the forecasts table for that user.
    const results = await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(
          db,
        ),
      );
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

    return results;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get unforecasted props", error as Error, {
      operation: "getUnforecastedProps",
      table: "v_props",
      competitionId,
      userId,
      duration,
    });
    throw error;
  }
}

export async function getPropsWithUserForecasts({
  userId,
  competitionId,
}: {
  userId: number;
  competitionId: number | null;
}): Promise<(VProp & { user_forecast: number | null })[]> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting props with user forecasts", {
    userId,
    competitionId,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    const results = await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(
          db,
        ),
      );

      let query = trx
        .selectFrom("v_props")
        .leftJoin("forecasts", (join) =>
          join
            .onRef("v_props.prop_id", "=", "forecasts.prop_id")
            .on("forecasts.user_id", "=", userId),
        )
        .selectAll("v_props")
        .select("forecasts.forecast as user_forecast");

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

    return results;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get props with user forecasts", error as Error, {
      operation: "getPropsWithUserForecasts",
      table: "v_props",
      duration,
      userId,
      competitionId,
    });
    throw error;
  }
}

export async function deleteForecast({ id }: { id: number }): Promise<void> {
  const currentUser = await getUserFromCookies();
  logger.debug("Deleting forecast", {
    forecastId: id,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(
          db,
        ),
      );
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
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to delete forecast", error as Error, {
      operation: "deleteForecast",
      table: "forecasts",
      forecastId: id,
      duration,
    });
    throw error;
  }
}
