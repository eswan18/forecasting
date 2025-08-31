import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("invite_tokens")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("token", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) => col.notNull())
    .addColumn("used_at", "timestamptz")
    .addUniqueConstraint("token_unique", ["token"], (builder) =>
      builder.nullsNotDistinct(),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("invite_tokens").execute();
}
