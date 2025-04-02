import type { Kysely } from 'kysely'
import { sql } from 'kysely'

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
	await sql<void>`ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY`.execute(db);
	// Users can view their own forecasts and public forecasts (where forecast.user_id
	// is null).
	// Users can only update their own forecasts.
	await sql<void>`
		CREATE POLICY "users_own_records" ON forecasts
		USING (forecasts.user_id IS NULL OR current_user_id() = forecasts.user_id)
		WITH CHECK (forecasts.user_id IS NOT NULL AND current_user_id() = forecasts.user_id);
	`.execute(db);
	// Admins can read and write all forecasts.
	await sql<void>`
		CREATE POLICY admin_all_access ON forecasts
		USING (is_current_user_admin())
		WITH CHECK (is_current_user_admin());
	`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
	await sql<void>`DROP POLICY "users_own_records" ON forecasts;`.execute(db);
	await sql<void>`DROP POLICY admin_all_access ON forecasts;`.execute(db);
	await sql<void>`ALTER TABLE forecasts DISABLE ROW LEVEL SECURITY`.execute(db);
}
