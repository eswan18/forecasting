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
