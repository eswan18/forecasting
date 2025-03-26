import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await sql<void>`ALTER TABLE props ENABLE ROW LEVEL SECURITY`.execute(db);
	await sql<void>`
		CREATE POLICY "Users can see their own props" ON props
		USING (
				props.user_id IS NULL
			OR
				props.user_id IS NOT NULL
				AND current_setting('app.current_user_id', true) IS NOT NULL
				AND props.user_id = current_setting('app.current_user_id', null)::INTEGER
		)`
		.execute(db);

	// Update v_props to use the new policy and to include props.user_id.
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
}

export async function down(db: Kysely<any>): Promise<void> {
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
	await sql<void>`DROP POLICY "Users can see their own props" ON props`
		.execute(db);
	await sql<void>`ALTER TABLE props DISABLE ROW LEVEL SECURITY`.execute(db);
}
