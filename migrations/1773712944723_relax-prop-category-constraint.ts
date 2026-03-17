import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Drop the old constraint that required user_id OR category_id.
  await db.schema
    .alterTable("props")
    .dropConstraint("at_least_one_of_user_id_and_category_id")
    .execute();
  // Add a relaxed constraint: competition props are allowed to have no category.
  // Application-level validation still enforces category for public competition props.
  await db.schema
    .alterTable("props")
    .addCheckConstraint(
      "at_least_one_of_user_id_category_id_competition_id",
      sql<boolean>`user_id IS NOT NULL OR category_id IS NOT NULL OR competition_id IS NOT NULL`,
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("props")
    .dropConstraint("at_least_one_of_user_id_category_id_competition_id")
    .execute();
  await db.schema
    .alterTable("props")
    .addCheckConstraint(
      "at_least_one_of_user_id_and_category_id",
      sql<boolean>`user_id IS NOT NULL OR category_id IS NOT NULL`,
    )
    .execute();
}
