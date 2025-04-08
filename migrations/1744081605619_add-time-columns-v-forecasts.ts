import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	// Add the updated_at and created_at columns from both props and forecasts tables.
	await db.schema.dropView('v_forecasts').execute();
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
			forecasts.created_at AS forecast_created_at,
			forecasts.updated_at AS forecast_updated_at,
			resolutions.id AS resolution_id,
			resolutions.resolution,
			resolutions.notes AS resolution_notes,
			resolutions.created_at AS resolution_created_at,
			resolutions.updated_at AS resolution_updated_at,
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

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
	// Return the view to its original state.
	await db.schema.dropView('v_forecasts').execute();
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
