import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("props")
    .addColumn("user_id", "integer", (col) => col.references("users.id"))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("props").dropColumn("user_id").execute();
}
