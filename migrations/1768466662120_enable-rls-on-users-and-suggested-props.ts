import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Enable RLS on suggested_props table.
 *
 * suggested_props table:
 * - Any authenticated user can INSERT their own suggestions
 * - Only admins can SELECT/UPDATE/DELETE (to review and manage suggestions)
 *
 * The view (v_suggested_props) already has security_barrier and security_invoker
 * set, so RLS policies will cascade through it.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Enable RLS on suggested_props table
  await sql<void>`ALTER TABLE suggested_props ENABLE ROW LEVEL SECURITY`.execute(
    db,
  );

  // Users can insert their own suggestions
  await sql<void>`
    CREATE POLICY "users_insert_own" ON suggested_props
    FOR INSERT
    WITH CHECK (current_user_id() = suggester_user_id);
  `.execute(db);

  // Only admins can view/update/delete suggestions
  await sql<void>`
    CREATE POLICY "admin_all_access" ON suggested_props
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Remove RLS from suggested_props
  await sql<void>`DROP POLICY "users_insert_own" ON suggested_props`.execute(
    db,
  );
  await sql<void>`DROP POLICY "admin_all_access" ON suggested_props`.execute(
    db,
  );
  await sql<void>`ALTER TABLE suggested_props DISABLE ROW LEVEL SECURITY`.execute(
    db,
  );
}
