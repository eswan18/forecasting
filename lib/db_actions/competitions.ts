"use server";

import { db } from "@/lib/database";
import {
  Competition,
  CompetitionUpdate,
  NewCompetition,
} from "@/types/db_types";
import { getUserFromCookies } from "../get-user";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

function validateCompetitionDates({
  forecasts_open_date,
  forecasts_close_date,
  end_date,
}: {
  forecasts_open_date: Date;
  forecasts_close_date: Date;
  end_date: Date;
}) {
  if (forecasts_open_date >= forecasts_close_date) {
    throw new Error("Open date must be before close date");
  }
  if (forecasts_close_date >= end_date) {
    throw new Error("Close date must be before end date");
  }
}

export async function getCompetitionById(
  id: number,
): Promise<Competition | undefined> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting competition by ID", {
    competitionId: id,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    const competition = await db
      .selectFrom("competitions")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    const duration = Date.now() - startTime;
    if (competition) {
      logger.info("Competition retrieved successfully", {
        operation: "getCompetitionById",
        table: "competitions",
        competitionId: id,
        duration,
      });
    } else {
      logger.warn("Competition not found", {
        operation: "getCompetitionById",
        table: "competitions",
        competitionId: id,
        duration,
      });
    }

    return competition;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get competition by ID", error as Error, {
      operation: "getCompetitionById",
      table: "competitions",
      competitionId: id,
      duration,
    });
    throw error;
  }
}

export async function getCompetitions(): Promise<Competition[]> {
  const currentUser = await getUserFromCookies();
  logger.debug("Getting all competitions", {
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    let query = db
      .selectFrom("competitions")
      .orderBy("name", "desc")
      .selectAll();
    const results = await query.execute();

    const duration = Date.now() - startTime;
    logger.info(`Retrieved ${results.length} competitions`, {
      operation: "getCompetitions",
      table: "competitions",
      duration,
    });

    return results;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get competitions", error as Error, {
      operation: "getCompetitions",
      table: "competitions",
      duration,
    });
    throw error;
  }
}

export async function updateCompetition({
  id,
  competition,
}: {
  id: number;
  competition: CompetitionUpdate;
}) {
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
      throw new Error("Unauthorized: Only admins can update competitions");
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
        throw new Error("Competition not found");
      }
      const openDate =
        (competition as any).forecasts_open_date ??
        existing.forecasts_open_date;
      const closeDate =
        (competition as any).forecasts_close_date ??
        existing.forecasts_close_date;
      const endDate = (competition as any).end_date ?? existing.end_date;
      if (openDate == null) {
        throw new Error("Forecasts open date is required");
      }
      validateCompetitionDates({
        forecasts_open_date: openDate,
        forecasts_close_date: closeDate,
        end_date: endDate,
      });
    }

    await db
      .updateTable("competitions")
      .set(competition)
      .where("id", "=", id)
      .execute();

    const duration = Date.now() - startTime;
    logger.info("Competition updated successfully", {
      operation: "updateCompetition",
      table: "competitions",
      competitionId: id,
      duration,
    });

    revalidatePath("/competitions");
    revalidatePath("/admin/competitions");
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to update competition", error as Error, {
      operation: "updateCompetition",
      table: "competitions",
      competitionId: id,
      duration,
    });
    throw error;
  }
}

export async function createCompetition({
  competition,
}: {
  competition: NewCompetition;
}) {
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
      throw new Error("Unauthorized: Only admins can create competitions");
    }

    // Validate dates on create
    if (competition.forecasts_open_date == null) {
      throw new Error("Forecasts open date is required");
    }
    validateCompetitionDates({
      forecasts_open_date: competition.forecasts_open_date,
      forecasts_close_date: competition.forecasts_close_date,
      end_date: competition.end_date,
    });

    await db.insertInto("competitions").values(competition).execute();

    const duration = Date.now() - startTime;
    logger.info("Competition created successfully", {
      operation: "createCompetition",
      table: "competitions",
      competitionName: competition.name,
      duration,
    });

    revalidatePath("/competitions");
    revalidatePath("/admin/competitions");
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to create competition", error as Error, {
      operation: "createCompetition",
      table: "competitions",
      competitionName: competition.name,
      duration,
    });
    throw error;
  }
}

export async function toggleCompetitionVisibility({
  id,
  visible,
}: {
  id: number;
  visible: boolean;
}) {
  const currentUser = await getUserFromCookies();
  logger.debug("Toggling competition visibility", {
    competitionId: id,
    visible,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    if (!currentUser?.is_admin) {
      logger.warn("Unauthorized attempt to toggle competition visibility", {
        competitionId: id,
        currentUserId: currentUser?.id,
      });
      throw new Error(
        "Unauthorized: Only admins can toggle competition visibility",
      );
    }

    await db
      .updateTable("competitions")
      .set({ visible })
      .where("id", "=", id)
      .execute();

    const duration = Date.now() - startTime;
    logger.info("Competition visibility toggled successfully", {
      operation: "toggleCompetitionVisibility",
      table: "competitions",
      competitionId: id,
      visible,
      duration,
    });

    revalidatePath("/competitions");
    revalidatePath("/admin/competitions");
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to toggle competition visibility", error as Error, {
      operation: "toggleCompetitionVisibility",
      table: "competitions",
      competitionId: id,
      visible,
      duration,
    });
    throw error;
  }
}
