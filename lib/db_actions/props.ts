"use server";
import { getUserFromCookies } from "../get-user";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/database";
import { VProp, PropUpdate, NewProp, NewResolution } from "@/types/db_types";
import { sql } from "kysely";
import {
  ServerActionResult,
  ERROR_CODES,
  error,
  success,
  validationError,
} from "@/lib/server-action-result";
import { logger } from "@/lib/logger";

export async function getPropById(
  propId: number,
): Promise<ServerActionResult<VProp | null>> {
  const currentUser = await getUserFromCookies();

  logger.debug("Getting prop by ID", {
    propId,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    const result = await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(
          db,
        ),
      );

      const prop = await trx
        .selectFrom("v_props")
        .selectAll()
        .where("prop_id", "=", propId)
        .executeTakeFirst();

      return prop;
    });

    const duration = Date.now() - startTime;
    logger.info(`Retrieved prop by ID`, {
      operation: "getPropById",
      table: "v_props",
      duration,
      propId,
      found: !!result,
    });

    return success(result || null);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Error getting prop by ID", err as Error, {
      operation: "getPropById",
      table: "v_props",
      duration,
      propId,
    });
    return error("Failed to fetch prop", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function getProps({
  competitionId,
  userId,
}: {
  competitionId?: (number | null)[] | number | null;
  userId?: (number | null)[] | number | null;
}): Promise<ServerActionResult<VProp[]>> {
  const currentUser = await getUserFromCookies();

  logger.debug("Getting props", {
    propCompetitionId: JSON.stringify(competitionId),
    propUserId: JSON.stringify(userId),
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    // Clients can pass a single user ID (or null) or a single competition ID (or null) or
    // an array of IDs.
    // Standardize the input to an array of IDs.
    let normalizedUserId: (number | null)[];
    if (typeof userId === "number") {
      normalizedUserId = [userId];
    } else if (userId === null) {
      normalizedUserId = [null];
    } else if (Array.isArray(userId)) {
      normalizedUserId = userId;
    } else {
      normalizedUserId = [];
    }

    let normalizedCompetitionId: (number | null)[];
    if (typeof competitionId === "number") {
      normalizedCompetitionId = [competitionId];
    } else if (competitionId === null) {
      normalizedCompetitionId = [null];
    } else if (Array.isArray(competitionId)) {
      normalizedCompetitionId = competitionId;
    } else {
      normalizedCompetitionId = [];
    }

    // Build and execute the query.
    const results = await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(
          db,
        ),
      );
      let query = trx
        .selectFrom("v_props")
        .orderBy("prop_id", "asc")
        .selectAll();

      if (normalizedCompetitionId.length > 0) {
        // Add filters for competitions, if requested.
        const nonNullCompetitionIds = normalizedCompetitionId.filter(
          (id: number | null) => id !== null,
        );
        query = query.where((eb) => {
          const ors = [];
          if (nonNullCompetitionIds.length > 0) {
            ors.push(eb("competition_id", "in", nonNullCompetitionIds));
          }
          if (
            normalizedCompetitionId.find((id: number | null) => id === null) !==
            undefined
          ) {
            // If null is in the array, include rows where competition_id is null.
            ors.push(eb("competition_id", "is", null));
          }
          return eb.or(ors);
        });
      }

      if (normalizedUserId.length > 0) {
        // Add filters for users, if requested.
        const nonNullUserIds = normalizedUserId.filter(
          (id: number | null) => id !== null,
        );
        query = query.where((eb) => {
          const ors = [];
          if (nonNullUserIds.length > 0) {
            ors.push(eb("prop_user_id", "in", nonNullUserIds));
          }
          if (
            normalizedUserId.find((id: number | null) => id === null) !==
            undefined
          ) {
            // If null is in the array, we want to include public props (where prop_user_id is null).
            ors.push(eb("prop_user_id", "is", null));
          }
          return eb.or(ors);
        });
      }

      return await query.execute();
    });

    const duration = Date.now() - startTime;
    logger.info(`Retrieved ${results.length} props`, {
      operation: "getProps",
      table: "v_props",
      propCompetitionId: JSON.stringify(competitionId),
      propUserId: JSON.stringify(userId),
      duration,
    });

    return success(results);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to get props", err as Error, {
      operation: "getProps",
      table: "v_props",
      propCompetitionId: JSON.stringify(competitionId),
      propUserId: JSON.stringify(userId),
      duration,
    });
    return error("Failed to fetch props", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function resolveProp({
  propId,
  resolution,
  notes,
  userId,
  overwrite = false,
}: {
  propId: number;
  resolution: boolean;
  notes?: string;
  userId: number | null;
  overwrite?: boolean;
}): Promise<ServerActionResult<void>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Resolving prop", {
    propId,
    resolution,
    propUserId: userId,
    overwrite,
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

      // first check that this prop doesn't already have a resolution
      const existingResolution = await trx
        .selectFrom("resolutions")
        .where("prop_id", "=", propId)
        .select("resolution")
        .executeTakeFirst();
      if (!!existingResolution && !overwrite) {
        logger.warn("Attempted to resolve prop that already has resolution", {
          propId,
          existingResolution: existingResolution.resolution,
          overwrite,
        });
        throw new Error(`Proposition ${propId} already has a resolution`);
      }

      if (existingResolution) {
        // Update the existing record.
        await trx
          .updateTable("resolutions")
          .set({ resolution, notes })
          .where("prop_id", "=", propId)
          .execute();
        logger.debug("Updated existing resolution", { propId, resolution });
      } else {
        // Insert a new record.
        const record: NewResolution = {
          prop_id: propId,
          resolution,
          user_id: userId,
          notes,
        };
        await trx.insertInto("resolutions").values(record).execute();
        logger.debug("Created new resolution", { propId, resolution });
      }
    });

    const duration = Date.now() - startTime;
    logger.info("Prop resolved successfully", {
      operation: "resolveProp",
      table: "resolutions",
      propId,
      resolution,
      duration,
    });

    revalidatePath("/props");
    return success(undefined);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to resolve prop", err as Error, {
      operation: "resolveProp",
      table: "resolutions",
      propId,
      duration,
    });
    // Check if it's the validation error we threw
    if (
      err instanceof Error &&
      err.message === `Proposition ${propId} already has a resolution`
    ) {
      return error(err.message, ERROR_CODES.VALIDATION_ERROR);
    }
    return error("Failed to resolve prop", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function unresolveProp({
  propId,
}: {
  propId: number;
}): Promise<ServerActionResult<void>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Unresolving prop", {
    propId,
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
      await trx
        .deleteFrom("resolutions")
        .where("prop_id", "=", propId)
        .execute();
    });

    const duration = Date.now() - startTime;
    logger.info("Prop unresolved successfully", {
      operation: "unresolveProp",
      table: "resolutions",
      propId,
      duration,
    });

    revalidatePath("/props");
    return success(undefined);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to unresolve prop", err as Error, {
      operation: "unresolveProp",
      table: "resolutions",
      propId,
      duration,
    });
    return error("Failed to unresolve prop", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function updateProp({
  id,
  prop,
}: {
  id: number;
  prop: PropUpdate;
}): Promise<ServerActionResult<void>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Updating prop", {
    propId: id,
    updateFields: Object.keys(prop),
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    if (!currentUser) {
      logger.warn("Unauthorized attempt to update prop", { propId: id });
      return error(
        "You must be logged in to update propositions",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    // Validate prop data
    if (prop.text && prop.text.trim().length < 8) {
      logger.warn("Validation error: prop text too short", {
        propId: id,
        textLength: prop.text?.length,
      });
      return validationError(
        "Proposition text must be at least 8 characters long",
        { text: ["Text is too short"] },
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(
          db,
        ),
      );
      await trx.updateTable("props").set(prop).where("id", "=", id).execute();
    });

    const duration = Date.now() - startTime;
    logger.info("Prop updated successfully", {
      operation: "updateProp",
      table: "props",
      propId: id,
      duration,
    });

    revalidatePath("/props");
    return success(undefined);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to update prop", err as Error, {
      operation: "updateProp",
      table: "props",
      propId: id,
      duration,
    });
    return error("Failed to update proposition", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function createProp({
  prop,
}: {
  prop: NewProp;
}): Promise<ServerActionResult<void>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Creating prop", {
    categoryId: prop.category_id,
    textLength: prop.text?.length,
    currentUserId: currentUser?.id,
  });

  const startTime = Date.now();
  try {
    if (!currentUser) {
      logger.warn("Unauthorized attempt to create prop");
      return error(
        "You must be logged in to create propositions",
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    // Validate prop data
    const validationErrors: Record<string, string[]> = {};

    if (!prop.text || prop.text.trim().length < 8) {
      validationErrors.text = [
        "Proposition text must be at least 8 characters long",
      ];
    }

    if (prop.category_id == null && prop.user_id === null) {
      validationErrors.category_id = ["Category is required"];
    }

    if (Object.keys(validationErrors).length > 0) {
      logger.warn("Validation error creating prop", {
        validationErrors,
        textLength: prop.text?.length,
        categoryId: prop.category_id,
      });
      return validationError(
        "Please fix the validation errors",
        validationErrors,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(
          db,
        ),
      );
      await trx.insertInto("props").values(prop).execute();
    });

    const duration = Date.now() - startTime;
    logger.info("Prop created successfully", {
      operation: "createProp",
      table: "props",
      categoryId: prop.category_id,
      textLength: prop.text?.length,
      duration,
    });

    revalidatePath("/props");
    return success(undefined);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to create prop", err as Error, {
      operation: "createProp",
      table: "props",
      categoryId: prop.category_id,
      duration,
    });

    if (err instanceof Error && err.message.includes("duplicate")) {
      return error(
        "A proposition with this text already exists",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    return error("Failed to create proposition", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function deleteResolution({
  id,
}: {
  id: number;
}): Promise<ServerActionResult<void>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Deleting resolution", {
    resolutionId: id,
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
      await trx.deleteFrom("resolutions").where("id", "=", id).execute();
    });

    const duration = Date.now() - startTime;
    logger.info("Resolution deleted successfully", {
      operation: "deleteResolution",
      table: "resolutions",
      resolutionId: id,
      duration,
    });

    revalidatePath("/props");
    revalidatePath("/standalone");
    return success(undefined);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to delete resolution", err as Error, {
      operation: "deleteResolution",
      table: "resolutions",
      resolutionId: id,
      duration,
    });
    return error("Failed to delete resolution", ERROR_CODES.DATABASE_ERROR);
  }
}

export async function deleteProp({
  id,
}: {
  id: number;
}): Promise<ServerActionResult<void>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Deleting prop", {
    propId: id,
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
      await trx.deleteFrom("props").where("id", "=", id).execute();
    });

    const duration = Date.now() - startTime;
    logger.info("Prop deleted successfully", {
      operation: "deleteProp",
      table: "props",
      propId: id,
      duration,
    });

    revalidatePath("/props");
    revalidatePath("/standalone");
    return success(undefined);
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to delete prop", err as Error, {
      operation: "deleteProp",
      table: "props",
      propId: id,
      duration,
    });
    return error("Failed to delete prop", ERROR_CODES.DATABASE_ERROR);
  }
}
