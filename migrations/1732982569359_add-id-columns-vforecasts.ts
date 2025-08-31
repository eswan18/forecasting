import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Add forecast_id and resolution_id columns to the v_forecasts view.
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
}

export async function down(db: Kysely<any>): Promise<void> {
  // Restore the previous state of the view.
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
          "forecasts.forecast",
          "resolutions.resolution",
          sql<number>`power(resolutions.resolution::integer - forecasts.forecast, 2)`.as(
            "score",
          ),
        ]),
    )
    .execute();
}
