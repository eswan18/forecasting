import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Add a `deactivated_at` column to the `users` table.
  // This column will be nullable and represents when a user was deactivated.
  // NULL means the user is active, a timestamp means they were deactivated at that time.
  await db.schema
    .alterTable("users")
    .addColumn("deactivated_at", "timestamptz")
    .execute();

  // Update the v_users view to include the new deactivated_at column
  // First drop the view and any dependent views
  await db.schema.dropView("v_password_reset_tokens").ifExists().execute();
  await db.schema.dropView("v_suggested_props").ifExists().execute();
  await db.schema.dropView("v_users").execute();

  // Recreate v_users with the new column
  await db.schema
    .createView("v_users")
    .as(
      db
        .selectFrom("users")
        .leftJoin("logins", "users.login_id", "logins.id")
        .select([
          "users.id",
          "users.name",
          "users.email",
          "users.is_admin",
          "users.deactivated_at",
          "users.created_at",
          "users.updated_at",
          "logins.id as login_id",
          "logins.username",
        ]),
    )
    .execute();

  // Recreate dependent views
  await db.schema
    .createView("v_suggested_props")
    .as(
      db
        .selectFrom("suggested_props")
        .innerJoin("v_users", "suggested_props.suggester_user_id", "v_users.id")
        .select([
          "suggested_props.id",
          "prop as prop_text",
          "suggester_user_id as user_id",
          "login_id as user_login_id",
          "name as user_name",
          "email as user_email",
          "username as user_username",
        ]),
    )
    .execute();

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
  // First drop all dependent views and v_users
  await db.schema.dropView("v_password_reset_tokens").ifExists().execute();
  await db.schema.dropView("v_suggested_props").ifExists().execute();
  await db.schema.dropView("v_users").execute();

  // Drop the deactivated_at column
  await db.schema.alterTable("users").dropColumn("deactivated_at").execute();

  // Recreate v_users without the deactivated_at column
  await db.schema
    .createView("v_users")
    .as(
      db
        .selectFrom("users")
        .leftJoin("logins", "users.login_id", "logins.id")
        .select([
          "users.id",
          "users.name",
          "users.email",
          "users.is_admin",
          "users.created_at",
          "users.updated_at",
          "logins.id as login_id",
          "logins.username",
        ]),
    )
    .execute();

  // Recreate dependent views
  await db.schema
    .createView("v_suggested_props")
    .as(
      db
        .selectFrom("suggested_props")
        .innerJoin("v_users", "suggested_props.suggester_user_id", "v_users.id")
        .select([
          "suggested_props.id",
          "prop as prop_text",
          "suggester_user_id as user_id",
          "login_id as user_login_id",
          "name as user_name",
          "email as user_email",
          "username as user_username",
        ]),
    )
    .execute();

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
