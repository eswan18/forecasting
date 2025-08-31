import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("resolutions")
    .addColumn("user_id", "integer", (col) => col.references("users.id"))
    .execute();
  // Update v_props and v_forecasts to include resolutions.user_id as resolution_user_id.
  await db.schema.dropView("v_props").execute();
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
			resolutions.notes AS resolution_notes,
			resolutions.user_id as resolution_user_id
		FROM props
			JOIN categories ON props.category_id = categories.id
			LEFT JOIN resolutions ON props.id = resolutions.prop_id;
	`.execute(db);
  await db.schema.dropView("v_forecasts").execute();
  await sql<void>`CREATE VIEW v_forecasts WITH (security_barrier, security_invoker) AS
		SELECT users.id AS user_id,
			users.name AS user_name,
			categories.id AS category_id,
			categories.name AS category_name,
			props.id AS prop_id,
			props.text AS prop_text,
			props.notes AS prop_notes,
			props.year,
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
			LEFT JOIN resolutions ON props.id = resolutions.prop_id;
	`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Revert v_props and v_forecasts to exclude resolutions.user_id.
  await db.schema.dropView("v_props").execute();
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
	`.execute(db);
  await db.schema.dropView("v_forecasts").execute();
  await sql<void>`CREATE VIEW v_forecasts WITH (security_barrier, security_invoker) AS
		SELECT users.id AS user_id,
			users.name AS user_name,
			categories.id AS category_id,
			categories.name AS category_name,
			props.id AS prop_id,
			props.text AS prop_text,
			props.notes AS prop_notes,
			props.year,
			forecasts.id AS forecast_id,
			forecasts.forecast,
			resolutions.id AS resolution_id,
			resolutions.resolution,
			resolutions.notes AS resolution_notes,
			power(resolutions.resolution::integer::double precision - forecasts.forecast, 2::double precision) AS score
		FROM users
			JOIN forecasts ON users.id = forecasts.user_id
			JOIN props ON forecasts.prop_id = props.id
			JOIN categories ON props.category_id = categories.id
			LEFT JOIN resolutions ON props.id = resolutions.prop_id;
	`.execute(db);
  // Drop the user_id column from the underlying resolutions table.
  await db.schema.alterTable("resolutions").dropColumn("user_id").execute();
}
