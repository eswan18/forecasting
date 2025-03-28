import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	// Add some helper functions to get the current user id and admin status.
	await sql<void>`
		CREATE FUNCTION is_current_user_admin() RETURNS BOOLEAN AS $$
		SELECT COALESCE(
			(
				SELECT is_admin
				FROM users
				WHERE id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER
			),
			false
  )
		$$ LANGUAGE sql STABLE SECURITY DEFINER;
	`.execute(db);
	await sql<void>`
		CREATE FUNCTION current_user_id() RETURNS INTEGER AS $$
			SELECT NULLIF(current_setting('app.current_user_id', true), '')::INTEGER;
		$$ LANGUAGE sql STABLE SECURITY DEFINER;
	`.execute(db);

	await sql<void>`ALTER TABLE props ENABLE ROW LEVEL SECURITY`.execute(db);
	// Users can view their own records and public records (where props.user_id is null).
	// Users can only update their own records.
	await sql<void>`
		CREATE POLICY "users_own_records" ON props
		USING (props.user_id IS NULL OR current_user_id() = props.user_id)
		WITH CHECK (props.user_id IS NOT NULL AND current_user_id() = props.user_id);
		`
		.execute(db);
	// Admins can read and write all records.
	await sql<void>`
		CREATE POLICY admin_all_access ON props
		USING (is_current_user_admin())
		WITH CHECK (is_current_user_admin());
	`
		.execute(db);

	// Update v_props to use the new policies and to include props.user_id.
	await db.schema.dropView('v_props').execute();
	await sql<void>`CREATE VIEW v_props WITH (security_barrier, security_invoker) AS
		SELECT categories.id AS category_id,
			categories.name AS category_name,
			props.id AS prop_id,
			props.text AS prop_text,
			props.notes AS prop_notes,
			props.year,
			props.user_id as prop_user_id,
			resolutions.id AS resolution_id,
			resolutions.resolution,
			resolutions.notes AS resolution_notes
		FROM props
			JOIN categories ON props.category_id = categories.id
			LEFT JOIN resolutions ON props.id = resolutions.prop_id;
	`
		.execute(db);
	await sql<void>`ALTER VIEW v_forecasts SET (security_barrier = true, security_invoker = true)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
	await sql<void>`ALTER VIEW v_forecasts RESET (security_barrier, security_invoker)`.execute(db);
	await db.schema.dropView('v_props').execute();
	await sql<void>`CREATE VIEW v_props AS
		SELECT categories.id AS category_id,
			categories.name AS category_name,
			props.id AS prop_id,
			props.text AS prop_text,
			props.notes AS prop_notes,
			props.year,
			resolutions.id AS resolution_id,
			resolutions.resolution,
			resolutions.notes AS resolution_notes
		FROM props
			JOIN categories ON props.category_id = categories.id
			LEFT JOIN resolutions ON props.id = resolutions.prop_id;
	`
		.execute(db);
	await sql<void>`DROP POLICY "users_own_records" ON props`.execute(db);
	await sql<void>`DROP POLICY "admin_all_access" ON props`.execute(db);
	await sql<void>`DROP FUNCTION is_current_user_admin`.execute(db);
	await sql<void>`DROP FUNCTION current_user_id`.execute(db);
	await sql<void>`ALTER TABLE props DISABLE ROW LEVEL SECURITY`.execute(db);
}
