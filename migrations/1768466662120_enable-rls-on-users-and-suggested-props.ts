import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Enable RLS on users and suggested_props tables.
 *
 * users table:
 * - Users can only view/update their own record
 * - Admins can view/update all records
 *
 * suggested_props table:
 * - Any authenticated user can INSERT their own suggestions
 * - Only admins can SELECT/UPDATE/DELETE (to review and manage suggestions)
 *
 * The views (v_users, v_suggested_props) already have security_barrier and
 * security_invoker set, so RLS policies will cascade through them.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Enable RLS on users table
  await sql<void>`ALTER TABLE users ENABLE ROW LEVEL SECURITY`.execute(db);

  // Users can only view and update their own record
  await sql<void>`
    CREATE POLICY "users_own_record" ON users
    USING (current_user_id() = users.id)
    WITH CHECK (current_user_id() = users.id);
  `.execute(db);

  // Admins can read and write all user records
  await sql<void>`
    CREATE POLICY "admin_all_access" ON users
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());
  `.execute(db);

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
  await sql<void>`DROP POLICY "users_insert_own" ON suggested_props`.execute(db);
  await sql<void>`DROP POLICY "admin_all_access" ON suggested_props`.execute(db);
  await sql<void>`ALTER TABLE suggested_props DISABLE ROW LEVEL SECURITY`.execute(
    db,
  );

  // Remove RLS from users
  await sql<void>`DROP POLICY "users_own_record" ON users`.execute(db);
  await sql<void>`DROP POLICY "admin_all_access" ON users`.execute(db);
  await sql<void>`ALTER TABLE users DISABLE ROW LEVEL SECURITY`.execute(db);
}
