import { sql, type Kysely } from "kysely";

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  // Create new column
  await db.schema
    .alterTable("resolutions")
    .addColumn("notes", "text")
    .execute();
  // Update v_forecasts to include the new column.
  await db.schema.dropView("v_forecasts").execute();
  await db.schema
    .createView("v_forecasts")
    .as(
      db
        .selectFrom("users")
        .innerJoin("forecasts", "users.id", "forecasts.user_id")
        .innerJoin("props", "forecasts.prop_id", "props.id")
        .innerJoin("categories", "props.category_id", "categories.id")
        .leftJoin("resolutions", "props.id", "resolutions.prop_id")
        .select([
          "users.id as user_id",
          "users.name as user_name",
          "categories.id as category_id",
          "categories.name as category_name",
          "props.id as prop_id",
          "props.text as prop_text",
          "props.notes as prop_notes",
          "props.year",
          "forecasts.id as forecast_id",
          "forecasts.forecast",
          "resolutions.id as resolution_id",
          "resolutions.resolution",
          "resolutions.notes as resolution_notes", // Include the new notes column
          sql<number>`power(resolutions.resolution::integer - forecasts.forecast, 2)`.as(
            "score",
          ),
        ]),
    )
    .execute();
  // Update v_props to include the new column.
  await db.schema.dropView("v_props").execute();
  await db.schema
    .createView("v_props")
    .as(
      db
        .selectFrom("props")
        .innerJoin("categories", "props.category_id", "categories.id")
        .leftJoin("resolutions", "props.id", "resolutions.prop_id")
        .select([
          "categories.id as category_id",
          "categories.name as category_name",
          "props.id as prop_id",
          "props.text as prop_text",
          "props.notes as prop_notes",
          "props.year",
          "resolutions.id as resolution_id", // Include the resolution ID
          "resolutions.resolution",
          "resolutions.notes as resolution_notes", // Include the new notes column
        ]),
    )
    .execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  // Update v_forecasts to remove the column.
  await db.schema.dropView("v_forecasts").execute();
  await db.schema
    .createView("v_forecasts")
    .as(
      db
        .selectFrom("users")
        .innerJoin("forecasts", "users.id", "forecasts.user_id")
        .innerJoin("props", "forecasts.prop_id", "props.id")
        .innerJoin("categories", "props.category_id", "categories.id")
        .leftJoin("resolutions", "props.id", "resolutions.prop_id")
        .select([
          "users.id as user_id",
          "users.name as user_name",
          "categories.id as category_id",
          "categories.name as category_name",
          "props.id as prop_id",
          "props.text as prop_text",
          "props.notes as prop_notes",
          "props.year",
          "forecasts.id as forecast_id",
          "forecasts.forecast",
          "resolutions.id as resolution_id",
          "resolutions.resolution",
          sql<number>`power(resolutions.resolution::integer - forecasts.forecast, 2)`.as(
            "score",
          ),
        ]),
    )
    .execute();
  // Update v_props to remove the column.
  await db.schema.dropView("v_props").execute();
  await db.schema
    .createView("v_props")
    .as(
      db
        .selectFrom("props")
        .innerJoin("categories", "props.category_id", "categories.id")
        .leftJoin("resolutions", "props.id", "resolutions.prop_id")
        .select([
          "categories.id as category_id",
          "categories.name as category_name",
          "props.id as prop_id",
          "props.text as prop_text",
          "props.notes as prop_notes",
          "props.year",
          "resolutions.resolution",
        ]),
    )
    .execute();
  await db.schema.alterTable("resolutions").dropColumn("notes").execute();
}
