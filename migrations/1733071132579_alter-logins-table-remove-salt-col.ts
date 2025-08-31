import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Remove v_users and the views that depend on it.
  await db.schema.dropView("v_password_reset_tokens").execute();
  await db.schema.dropView("v_suggested_props").execute();
  await db.schema.dropView("v_users").execute();

  // Remove the is_salted column from the underlying logins table.
  await db.schema.alterTable("logins").dropColumn("is_salted").execute();

  // Recreate v_users without the is_salted column.
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
          "logins.id as login_id",
          "logins.username",
        ]),
    )
    .execute();
  // Recreate v_suggested_props and v_password_resets.
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
  // Down migration is simpler: just re-add the column and update the v_users view.
  await db.schema
    .alterTable("logins")
    .addColumn("is_salted", "boolean", (c) => c.defaultTo(false))
    .execute();
  await db.updateTable("logins").set({ is_salted: true }).execute();
  // Update the v_users view to include the salt column.
  // By using "orReplace", we can avoid dropping the view (and updating dependents) and recreating it.
  await db.schema
    .createView("v_users")
    .orReplace()
    .as(
      db
        .selectFrom("users")
        .leftJoin("logins", "users.login_id", "logins.id")
        .select([
          "users.id",
          "users.name",
          "users.email",
          "users.is_admin",
          "logins.id as login_id",
          "logins.username",
          "logins.is_salted",
        ]),
    )
    .execute();
}
