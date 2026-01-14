import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Drop the view first since it depends on password_reset_tokens table
  await db.schema.dropView("v_password_reset_tokens").execute();
  // Drop both token tables
  await db.schema.dropTable("password_reset_tokens").execute();
  await db.schema.dropTable("invite_tokens").execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Recreate invite_tokens table
  await db.schema
    .createTable("invite_tokens")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("token", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) => col.notNull())
    .addColumn("used_at", "timestamptz")
    .addColumn("notes", "text")
    .addUniqueConstraint("token_unique", ["token"], (builder) =>
      builder.nullsNotDistinct(),
    )
    .execute();

  // Recreate password_reset_tokens table
  await db.schema
    .createTable("password_reset_tokens")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("login_id", "integer", (col) =>
      col.notNull().references("logins.id"),
    )
    .addColumn("token", "text", (col) => col.notNull())
    .addColumn("initiated_at", "timestamptz", (col) => col.notNull())
    .addColumn("expires_at", "timestamptz", (col) => col.notNull())
    .execute();

  // Recreate the view
  await db.schema
    .createView("v_password_reset_tokens")
    .as(
      db
        .selectFrom("password_reset_tokens")
        .innerJoin(
          "v_users",
          "password_reset_tokens.login_id",
          "v_users.login_id",
        )
        .select([
          "password_reset_tokens.id",
          "password_reset_tokens.login_id",
          "password_reset_tokens.token",
          "password_reset_tokens.initiated_at",
          "password_reset_tokens.expires_at",
          "v_users.username",
          "v_users.id as user_id",
          "v_users.name",
          "v_users.email",
        ]),
    )
    .execute();
}
