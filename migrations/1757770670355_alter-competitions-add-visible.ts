import type { Kysely } from "kysely";

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  // Overview:
  // 1. Add a `visible` column to the `competitions` table with default value `true`.
  // 2. Insert a new competition: "2026 Public Competition".

  // 1. Add the `visible` column to the competitions table.
  await db.schema
    .alterTable("competitions")
    .addColumn("visible", "boolean", (col) => col.notNull().defaultTo(true))
    .execute();

  // 2. Insert the 2026 competition.
  await db
    .insertInto("competitions")
    .values({
      name: "2026 Public Competition",
      forecasts_due_date: new Date("2026-01-01T00:00:00Z"),
      end_date: new Date("2027-01-01T00:00:00Z"),
      visible: false,
    })
    .execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  // Overview:
  // 1. Delete the 2026 competition record.
  // 2. Drop the `visible` column from the competitions table.

  // 1. Delete the 2026 competition.
  await db
    .deleteFrom("competitions")
    .where("name", "=", "2026 Public Competition")
    .execute();

  // 2. Drop the `visible` column.
  await db.schema.alterTable("competitions").dropColumn("visible").execute();
}
