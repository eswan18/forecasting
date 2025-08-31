import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("suggested_props")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("suggester_user_id", "integer", (col) =>
      col.notNull().references("users.id"),
    )
    .addColumn("prop", "text", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("suggested_props").execute();
}
