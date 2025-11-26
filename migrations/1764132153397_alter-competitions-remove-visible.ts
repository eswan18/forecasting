import type { Kysely } from "kysely";

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  // Drop the `visible` column from the competitions table.
  // Note: No views reference this column, so we don't need to recreate any views.
  await db.schema.alterTable("competitions").dropColumn("visible").execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  // Add the `visible` column back to the competitions table with default value `true`.
  await db.schema
    .alterTable("competitions")
    .addColumn("visible", "boolean", (col) => col.notNull().defaultTo(true))
    .execute();
}
