import { Database } from "@/types/db_types";
import { db } from "@/lib/database";
import { Transaction, sql } from "kysely";

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
