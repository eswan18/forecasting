import { Database } from "@/types/db_types";
import { db } from "@/lib/database";
import { Transaction, sql } from "kysely";
import type { ServerActionResult } from "@/lib/server-action-result";

/**
 * Executes a database operation within a transaction with Row Level Security (RLS) context.
 *
 * This helper sets the `app.current_user_id` PostgreSQL configuration variable,
 * which RLS policies use to determine data access permissions.
 *
 * @param userId - The ID of the current user, or undefined if not authenticated
 * @param fn - The database operation to execute within the transaction
 * @returns The result of the database operation
 *
 * @example
 * const results = await withRLS(currentUser?.id, async (trx) => {
 *   return await trx.selectFrom("v_props").selectAll().execute();
 * });
 */
export async function withRLS<T>(
  userId: number | undefined,
  fn: (trx: Transaction<Database>) => Promise<T>,
): Promise<T> {
  return db.transaction().execute(async (trx) => {
    await trx.executeQuery(
      sql`SELECT set_config('app.current_user_id', ${userId}, true);`.compile(
        db,
      ),
    );
    return fn(trx);
  });
}

/**
 * Sentinel error used to trigger transaction rollback when the callback
 * returns a ServerActionResult with success: false.
 */
class RollbackWithResult<T> extends Error {
  constructor(public result: ServerActionResult<T>) {
    super("rollback");
  }
}

/**
 * Like `withRLS`, but the callback returns a `ServerActionResult<T>` directly.
 *
 * This allows clean early `return error(...)` inside the transaction while
 * preserving RLS context and transactional atomicity. If the callback returns
 * an error result, the transaction is automatically rolled back.
 *
 * @example
 * const result = await withRLSAction(currentUser.id, async (trx) => {
 *   const membership = await trx.selectFrom("competition_members")
 *     .select("role")
 *     .where("competition_id", "=", competitionId)
 *     .where("user_id", "=", currentUser.id)
 *     .executeTakeFirst();
 *
 *   if (membership?.role !== "admin") {
 *     return error("Only admins can do this", ERROR_CODES.UNAUTHORIZED);
 *   }
 *
 *   const inserted = await trx.insertInto("competition_members").values(...).returningAll().executeTakeFirstOrThrow();
 *   return success(inserted);
 * });
 */
export async function withRLSAction<T>(
  userId: number | undefined,
  fn: (trx: Transaction<Database>) => Promise<ServerActionResult<T>>,
): Promise<ServerActionResult<T>> {
  try {
    return await db.transaction().execute(async (trx) => {
      await trx.executeQuery(
        sql`SELECT set_config('app.current_user_id', ${userId}, true);`.compile(
          db,
        ),
      );
      const result = await fn(trx);
      if (!result.success) {
        throw new RollbackWithResult(result);
      }
      return result;
    });
  } catch (err) {
    if (err instanceof RollbackWithResult) {
      return err.result as ServerActionResult<T>;
    }
    throw err;
  }
}
