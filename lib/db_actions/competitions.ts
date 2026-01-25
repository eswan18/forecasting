"use server";

import { db } from "@/lib/database";
import { withRLS } from "@/lib/db-helpers";
import {
  Competition,
  CompetitionUpdate,
  NewCompetition,
} from "@/types/db_types";
import { getUserFromCookies } from "../get-user";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import {
  ServerActionResult,
  success,
  error,
  ERROR_CODES,
} from "@/lib/server-action-result";

function validateCompetitionDates({
  forecasts_open_date,
  forecasts_close_date,
  end_date,
}: {
  forecasts_open_date: Date | null | undefined;
  forecasts_close_date: Date | null | undefined;
  end_date: Date | null | undefined;
}): ServerActionResult<void> {
  // Private competitions have null/undefined dates - skip validation
  if (
    forecasts_open_date == null ||
    forecasts_close_date == null ||
    end_date == null
  ) {
    return success(undefined);
  }

  if (forecasts_open_date >= forecasts_close_date) {
    return error(
      "Open date must be before close date",
      ERROR_CODES.VALIDATION_ERROR,
    );
  }
  if (forecasts_close_date >= end_date) {
    return error(
      "Close date must be before end date",
      ERROR_CODES.VALIDATION_ERROR,
    );
  }
  return success(undefined);
}

export async function getCompetitionById(
  id: number,
): Promise<ServerActionResult<Competition>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting competition by ID", {
    competitionId: id,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    const competition = await withRLS(currentUser?.id, async (trx) => {
      return trx
        .selectFrom("competitions")
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirst();
    });

    const duration = Date.now() - startTime;
    if (competition) {
      logger.info("Competition retrieved successfully", {
        operation: "getCompetitionById",
        table: "competitions",
        competitionId: id,
        duration,
      });
      return success(competition);
    } else {
      logger.warn("Competition not found", {
        operation: "getCompetitionById",
        table: "competitions",
        competitionId: id,
        duration,
      });
      return error("Competition not found", ERROR_CODES.NOT_FOUND);
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get competition by ID", err as Error, {
      operation: "getCompetitionById",
      table: "competitions",
      competitionId: id,
      duration,
    });
    return error("Failed to retrieve competition", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function getCompetitions(): Promise<
  ServerActionResult<Competition[]>
> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting all competitions", {
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    const results = await withRLS(currentUser?.id, async (trx) => {
      return trx
        .selectFrom("competitions")
        .orderBy("name", "desc")
        .selectAll()
        .execute();
    });

    const duration = Date.now() - startTime;
    logger.info(`Retrieved ${results.length} competitions`, {
      operation: "getCompetitions",
      table: "competitions",
      duration,
    });

    return success(results);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get competitions", err as Error, {
      operation: "getCompetitions",
      table: "competitions",
      duration,
    });
    return error("Failed to retrieve competitions", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function updateCompetition({
  id,
  competition,
}: {
  id: number;
  competition: CompetitionUpdate;
}): Promise<ServerActionResult<void>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Updating competition", {
    competitionId: id,
    updateFields: Object.keys(competition),
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    if (!currentUser?.is_admin) {
      logger.warn("Unauthorized attempt to update competition", {
        competitionId: id,
        currentUserId: currentUser?.id,
      });
      return error(
        "Only admins can update competitions",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    // If any of the date fields are being changed, validate ordering using the
    // new values overlaid on the existing row.
    if (
      "forecasts_open_date" in competition ||
      "forecasts_close_date" in competition ||
      "end_date" in competition
    ) {
      const existing = await db
        .selectFrom("competitions")
        .select(["forecasts_open_date", "forecasts_close_date", "end_date"])
        .where("id", "=", id)
        .executeTakeFirst();
      if (!existing) {
        return error("Competition not found", ERROR_CODES.NOT_FOUND);
      }
      const openDate =
        "forecasts_open_date" in competition &&
        competition.forecasts_open_date !== undefined
          ? competition.forecasts_open_date
          : existing.forecasts_open_date;
      const closeDate =
        "forecasts_close_date" in competition &&
        competition.forecasts_close_date !== undefined
          ? competition.forecasts_close_date
          : existing.forecasts_close_date;
      const endDate =
        "end_date" in competition && competition.end_date !== undefined
          ? competition.end_date
          : existing.end_date;
      const validationResult = validateCompetitionDates({
        forecasts_open_date: openDate,
        forecasts_close_date: closeDate,
        end_date: endDate,
      });
      if (!validationResult.success) {
        return validationResult;
      }
    }

    await withRLS(currentUser.id, async (trx) => {
      await trx
        .updateTable("competitions")
        .set(competition)
        .where("id", "=", id)
        .execute();
    });

    const duration = Date.now() - startTime;
    logger.info("Competition updated successfully", {
      operation: "updateCompetition",
      table: "competitions",
      competitionId: id,
      duration,
    });

    revalidatePath("/competitions");
    revalidatePath("/admin/competitions");
    return success(undefined);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to update competition", err as Error, {
      operation: "updateCompetition",
      table: "competitions",
      competitionId: id,
      duration,
    });
    return error("Failed to update competition", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function createCompetition({
  competition,
}: {
  competition: NewCompetition;
}): Promise<ServerActionResult<void>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Creating competition", {
    competitionName: competition.name,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    if (!currentUser?.is_admin) {
      logger.warn("Unauthorized attempt to create competition", {
        currentUserId: currentUser?.id,
      });
      return error(
        "Only admins can create competitions",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    // Validate dates on create
    const validationResult = validateCompetitionDates({
      forecasts_open_date: competition.forecasts_open_date,
      forecasts_close_date: competition.forecasts_close_date,
      end_date: competition.end_date,
    });
    if (!validationResult.success) {
      return validationResult;
    }

    await withRLS(currentUser.id, async (trx) => {
      await trx.insertInto("competitions").values(competition).execute();
    });

    const duration = Date.now() - startTime;
    logger.info("Competition created successfully", {
      operation: "createCompetition",
      table: "competitions",
      competitionName: competition.name,
      duration,
    });

    revalidatePath("/competitions");
    revalidatePath("/admin/competitions");
    return success(undefined);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to create competition", err as Error, {
      operation: "createCompetition",
      table: "competitions",
      competitionName: competition.name,
      duration,
    });
    return error("Failed to create competition", ERROR_CODES.DATABASE_ERROR);
  }
}
