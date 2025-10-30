import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // 1) Start by dropping the views
  await db.schema.dropView("v_props").execute();
  await db.schema.dropView("v_forecasts").execute();

  // 1) Rename competitions.forecasts_due_date -> competitions.forecasts_close_date
  await db.schema
    .alterTable("competitions")
    .renameColumn("forecasts_due_date", "forecasts_close_date")
    .execute();

  // 3) Add competitions.forecasts_open_date (non-null, default to Unix epoch)
  await db.schema
    .alterTable("competitions")
    .addColumn("forecasts_open_date", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`to_timestamp(0)`),
    )
    .execute();

  // 4) Recreate views that reference competitions.* to use the new column name
  await sql<void>`CREATE VIEW v_props WITH (security_barrier, security_invoker) AS
		SELECT categories.id AS category_id,
			categories.name AS category_name,
			props.id AS prop_id,
			props.text AS prop_text,
			props.notes AS prop_notes,
			props.user_id as prop_user_id,
			props.competition_id,
			competitions.name AS competition_name,
			competitions.forecasts_close_date AS competition_forecasts_close_date,
			competitions.forecasts_open_date AS competition_forecasts_open_date,
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
			competitions.forecasts_close_date AS competition_forecasts_close_date,
			competitions.forecasts_open_date AS competition_forecasts_open_date,
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

export async function down(db: Kysely<any>): Promise<void> {
  // 1) Drop the views
  await db.schema.dropView("v_props").execute();
  await db.schema.dropView("v_forecasts").execute();

  // 1) Update the tables.
  await db.schema
    .alterTable("competitions")
    .dropColumn("forecasts_open_date")
    .execute();
  await db.schema
    .alterTable("competitions")
    .renameColumn("forecasts_close_date", "forecasts_due_date")
    .execute();

  // 3) Recreate the views
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
