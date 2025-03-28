import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await sql<void>`ALTER TABLE resolutions ENABLE ROW LEVEL SECURITY`.execute(db);
	// Users can view their own records and public records (where resolutions.user_id is null).
	// Users can only update their own records.
	await sql<void>`
		CREATE POLICY "users_own_records" ON resolutions
		USING (resolutions.user_id IS NULL OR current_user_id() = resolutions.user_id)
		WITH CHECK (resolutions.user_id IS NOT NULL AND current_user_id() = resolutions.user_id);
	`.execute(db);
	// Admins can read and write all records.
	await sql<void>`
		CREATE POLICY admin_all_access ON resolutions
		USING (is_current_user_admin())
		WITH CHECK (is_current_user_admin());
	`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
	await sql<void>`DROP POLICY "users_own_records" ON resolutions;`.execute(db);
	await sql<void>`DROP POLICY admin_all_access ON resolutions;`.execute(db);
	await sql<void>`ALTER TABLE resolutions DISABLE ROW LEVEL SECURITY`.execute(db);
}
