import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema.alterTable('props')
		.alterColumn('category_id', (ac) => ac.dropNotNull())
		.execute()
	// Even though we're allowing props without categories, we don't want that to be
	// allowed for public props, at least for now. So we add a check to mandate that props
	// without a `user_id` must have a `category_id`.
	await db.schema
		.alterTable('props')
		.addCheckConstraint(
			'at_least_one_of_user_id_and_category_id',
			sql<boolean>`user_id IS NOT NULL OR category_id IS NOT NULL`,
		)
		.execute();
	// Our prop-related views currently *inner join* to the categories table, which means
	// they won't contain props without categories. Fix that by using a LEFT JOIN instead.
	await db.schema.dropView('v_props').execute();
	await db.schema.dropView('v_forecasts').execute();
	await sql<void>`CREATE VIEW v_props WITH (security_barrier, security_invoker) AS
		SELECT categories.id AS category_id,
			categories.name AS category_name,
			props.id AS prop_id,
			props.text AS prop_text,
			props.notes AS prop_notes,
			props.user_id as prop_user_id,
			props.competition_id,
			competitions.name AS competition_name,
			competitions.forecasts_due_date AS competition_forecasts_due_date,
			resolutions.id AS resolution_id,
			resolutions.resolution,
			resolutions.notes AS resolution_notes,
			resolutions.user_id as resolution_user_id
		FROM props
			LEFT JOIN categories ON props.category_id = categories.id
			LEFT JOIN resolutions ON props.id = resolutions.prop_id
			LEFT JOIN competitions ON props.competition_id = competitions.id;
	`.execute(db);
	await sql<void>`CREATE VIEW v_forecasts WITH (security_barrier, security_invoker) AS
		SELECT users.id AS user_id,
			users.name AS user_name,
			categories.id AS category_id,
			categories.name AS category_name,
			competitions.forecasts_due_date AS competition_forecasts_due_date,
			props.id AS prop_id,
			props.text AS prop_text,
			props.notes AS prop_notes,
			props.user_id as prop_user_id,
			props.competition_id,
			competitions.name AS competition_name,
			forecasts.id AS forecast_id,
			forecasts.forecast,
			resolutions.id AS resolution_id,
			resolutions.resolution,
			resolutions.notes AS resolution_notes,
			resolutions.user_id AS resolution_user_id,
			power(resolutions.resolution::integer::double precision - forecasts.forecast, 2::double precision) AS score
		FROM users
			JOIN forecasts ON users.id = forecasts.user_id
			JOIN props ON forecasts.prop_id = props.id
			LEFT JOIN categories ON props.category_id = categories.id
			LEFT JOIN resolutions ON props.id = resolutions.prop_id
			LEFT JOIN competitions ON props.competition_id = competitions.id;
	`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
	// Return the views to their original states.
	await db.schema.dropView('v_props').execute();
	await db.schema.dropView('v_forecasts').execute();
	await sql<void>`CREATE VIEW v_props WITH (security_barrier, security_invoker) AS
		SELECT categories.id AS category_id,
			categories.name AS category_name,
			props.id AS prop_id,
			props.text AS prop_text,
			props.notes AS prop_notes,
			props.user_id as prop_user_id,
			props.competition_id,
			competitions.name AS competition_name,
			competitions.forecasts_due_date AS competition_forecasts_due_date,
			resolutions.id AS resolution_id,
			resolutions.resolution,
			resolutions.notes AS resolution_notes,
			resolutions.user_id as resolution_user_id
		FROM props
			JOIN categories ON props.category_id = categories.id
			LEFT JOIN resolutions ON props.id = resolutions.prop_id
			LEFT JOIN competitions ON props.competition_id = competitions.id;
	`.execute(db);
	await sql<void>`CREATE VIEW v_forecasts WITH (security_barrier, security_invoker) AS
		SELECT users.id AS user_id,
			users.name AS user_name,
			categories.id AS category_id,
			categories.name AS category_name,
			competitions.forecasts_due_date AS competition_forecasts_due_date,
			props.id AS prop_id,
			props.text AS prop_text,
			props.notes AS prop_notes,
			props.user_id as prop_user_id,
			props.competition_id,
			competitions.name AS competition_name,
			forecasts.id AS forecast_id,
			forecasts.forecast,
			resolutions.id AS resolution_id,
			resolutions.resolution,
			resolutions.notes AS resolution_notes,
			resolutions.user_id AS resolution_user_id,
			power(resolutions.resolution::integer::double precision - forecasts.forecast, 2::double precision) AS score
		FROM users
			JOIN forecasts ON users.id = forecasts.user_id
			JOIN props ON forecasts.prop_id = props.id
			JOIN categories ON props.category_id = categories.id
			LEFT JOIN resolutions ON props.id = resolutions.prop_id
			LEFT JOIN competitions ON props.competition_id = competitions.id;
	`.execute(db);
	// Drop the constraint.
	await db.schema
		.alterTable('props')
		.dropConstraint('at_least_one_of_user_id_and_category_id')
		.execute();
	// Re-enforce non-nullability on the column.
	await db.schema.alterTable('props')
		.alterColumn('category_id', (ac) => ac.setNotNull())
		.execute();
}