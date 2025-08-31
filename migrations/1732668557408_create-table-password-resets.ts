import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
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
  // The v_password_reset_tokens view is password_reset_tokens joined with v_users.
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

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropView("v_password_reset_tokens").execute();
  await db.schema.dropTable("password_reset_tokens").execute();
}
