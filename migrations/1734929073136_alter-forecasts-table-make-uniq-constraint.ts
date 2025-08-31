import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("forecasts")
    .addUniqueConstraint(
      "prop_user_unique",
      ["prop_id", "user_id"],
      (builder) => builder.nullsNotDistinct(),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("forecasts")
    .dropConstraint("prop_user_unique")
    .execute();
}
