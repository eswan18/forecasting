"use server";
import { getUserFromCookies } from "../get-user";
import { revalidatePath } from "next/cache";
import {
  ServerActionResult,
  ERROR_CODES,
  error,
  success,
  validationError,
} from "@/lib/server-action-result";
import { logger } from "@/lib/logger";
import { withRLSAction } from "@/lib/db-helpers";
import { validateOptionLabels } from "@/lib/choice-forecast";

/**
 * Edits the labels of a choice prop's options.
 *
 * The option set is frozen once the prop exists — forecasts and resolutions
 * hang off option ids — so this only renames: the given ids must be exactly
 * the prop's existing option ids. RLS decides who may edit (the prop's owner,
 * a competition admin, or a site admin); rows the caller cannot see look like
 * a missing prop.
 */
export async function updatePropOptions({
  propId,
  options,
}: {
  propId: number;
  options: { id: number; text: string }[];
}): Promise<ServerActionResult<void>> {
  const currentUser = await getUserFromCookies();
  logger.debug("Updating prop options", {
    propId,
    optionCount: options.length,
    currentUserId: currentUser?.id,
  });

  if (!currentUser) {
    logger.warn("Unauthorized attempt to update prop options", { propId });
    return error(
      "You must be logged in to edit propositions",
      ERROR_CODES.UNAUTHORIZED,
    );
  }

  const labelErrors = validateOptionLabels(options.map((o) => o.text));
  if (labelErrors.length > 0) {
    logger.warn("Validation error updating prop options", {
      propId,
      labelErrors,
    });
    return validationError(
      "Please fix the validation errors",
      { options: labelErrors },
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const startTime = Date.now();
  try {
    const result = await withRLSAction(currentUser.id, async (trx) => {
      const existing = await trx
        .selectFrom("prop_options")
        .select("id")
        .where("prop_id", "=", propId)
        .execute();
      if (existing.length === 0) {
        return error(
          "Proposition not found or has no options",
          ERROR_CODES.NOT_FOUND,
        );
      }

      const existingIds = existing.map((e) => e.id).sort((a, b) => a - b);
      const givenIds = options.map((o) => o.id).sort((a, b) => a - b);
      if (JSON.stringify(existingIds) !== JSON.stringify(givenIds)) {
        return error(
          "Options cannot be added or removed; only their labels can change",
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      for (const option of options) {
        const updated = await trx
          .updateTable("prop_options")
          .set({ text: option.text.trim() })
          .where("id", "=", option.id)
          .where("prop_id", "=", propId)
          .executeTakeFirst();
        // The select above proves the caller can *see* these options;
        // `manage_prop_options` can still hide them from UPDATE. Without this
        // check a zero-row update would report a silent success.
        if (Number(updated?.numUpdatedRows ?? 0) === 0) {
          return error(
            "Proposition not found or you cannot edit it",
            ERROR_CODES.NOT_FOUND,
          );
        }
      }

      return success(undefined);
    });

    if (result.success) {
      const duration = Date.now() - startTime;
      logger.info("Prop options updated successfully", {
        operation: "updatePropOptions",
        table: "prop_options",
        propId,
        optionCount: options.length,
        duration,
      });

      revalidatePath("/props");
      revalidatePath("/competitions");
    }

    return result;
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error("Failed to update prop options", err as Error, {
      operation: "updatePropOptions",
      table: "prop_options",
      propId,
      duration,
    });
    // The deferred unique fires at commit, i.e. from this catch rather than
    // from the UPDATE inside the transaction, so map it to the validation
    // error the caller can actually show against the option fields.
    if ((err as Error).message?.includes("prop_options_prop_text_unique")) {
      return error("Options must be unique", ERROR_CODES.VALIDATION_ERROR);
    }
    return error("Failed to update options", ERROR_CODES.DATABASE_ERROR);
  }
}
