import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Overview:
  // 1. Create a new `competitions` table.
  // 2. Insert two competitions: "2024 Public Competition" and "2025 Public Competition".
  // 3. Update the `props` to add a `competition_id` column that references the `competitions` table.
  // 4. Update existing props with year = 2024 to have competition_id = 1, and year = 2025 to
  //    have competition_id = 2. That makes the year column redundant.
  // 5. Update views that user `year` to use `competition_id` and `competition_name` instead.
  // 6. Drop the year column from props.
  // 7. Add a constraint to `props`, ensuring that `competition_id` and `user_id` are
  //    never both non-null.

  // 1. Create the new table.
  await db.schema
    .createTable("competitions")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar", (col) => col.notNull())
    .addColumn("forecasts_due_date", "timestamptz", (col) => col.notNull())
    .addColumn("end_date", "timestamptz", (col) => col.notNull())
    .addUniqueConstraint("name_unique", ["name"], (builder) =>
      builder.nullsNotDistinct(),
    )
    .execute();
  // 2. Insert two competitions: "2024 Public Competition" and "2025 Public Competition".
  await db
    .insertInto("competitions")
    .values([
      {
        name: "2024 Public Competition",
        forecasts_due_date: new Date("2024-01-01T00:00:00Z"),
        end_date: new Date("2025-01-01T00:00:00Z"),
      },
      {
        name: "2025 Public Competition",
        forecasts_due_date: new Date("2025-01-01T00:00:00Z"),
        end_date: new Date("2026-01-01T00:00:00Z"),
      },
    ])
    .execute();
  // 3. Update `props` to add a `competition_id` column referencing `competitions`.
  await db.schema
    .alterTable("props")
    .addColumn("competition_id", "integer", (col) =>
      col.references("competitions.id"),
    )
    .execute();
  // 4. Update the props with year = 2024 to have competition_id = 1, and year = 2025 to
  // have competition_id = 2. That makes the year column redundant.
  await db
    .updateTable("props")
    .set({ competition_id: 1 })
    .where("year", "=", 2024)
    .execute();
  await db
    .updateTable("props")
    .set({ competition_id: 2 })
    .where("year", "=", 2025)
    .execute();
  // 5. Update views that user `year` to use `competition_id` and `competition_name` instead.
  await db.schema.dropView("v_props").execute();
  await db.schema.dropView("v_forecasts").execute();
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
  // 6. Drop the year column from props.
  await db.schema.alterTable("props").dropColumn("year").execute();
  // 7. Add a constraint to `props`, ensuring that `competition_id` and `user_id` are
  //    never both non-null.
  await db.schema
    .alterTable("props")
    .addCheckConstraint(
      "never_both_competition_id_and_user_id_set",
      sql<boolean>`competition_id IS NULL OR user_id IS NULL`,
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Overview:
  // 1. Drop the 'never_both_competition_id_and_user_id_set' constraint on props.
  // 2. Re-add the year column.
  // 3. Set it to 2024 for competition_id = 1 and 2025 for competition_id = 2.
  // 4. Reset v_props and v_forecasts to use year instead of competition_id.
  // 5. Drop the foreign key from props.
  // 6. Finally, drop the competitions table.

  // 1. Drop the 'never_both_competition_id_and_user_id_set' constraint on props.
  await db.schema
    .alterTable("props")
    .dropConstraint("never_both_competition_id_and_user_id_set")
    .execute();
  // 2. Re-add the year column.
  await db.schema.alterTable("props").addColumn("year", "integer").execute();
  // 3. Set it to 2024 for competition_id = 1 and 2025 for competition_id = 2.
  await db
    .updateTable("props")
    .set({ year: 2024 })
    .where("competition_id", "=", 1)
    .execute();
  await db
    .updateTable("props")
    .set({ year: 2025 })
    .where("competition_id", "=", 2)
    .execute();

  // 4. Reset v_props and v_forecasts to use year instead of competition_id.
  await db.schema.dropView("v_props").execute();
  await db.schema.dropView("v_forecasts").execute();
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
  await sql<void>`CREATE VIEW v_forecasts WITH (security_barrier, security_invoker) AS
		SELECT users.id AS user_id,
			users.name AS user_name,
			categories.id AS category_id,
			categories.name AS category_name,
			props.id AS prop_id,
			props.text AS prop_text,
			props.notes AS prop_notes,
			props.year,
			props.user_id as prop_user_id,
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

  // 5. Drop the foreign key from props.
  await db.schema.alterTable("props").dropColumn("competition_id").execute();
  // 6. Finally, drop the competitions table.
  await db.schema.dropTable("competitions").execute();
}
