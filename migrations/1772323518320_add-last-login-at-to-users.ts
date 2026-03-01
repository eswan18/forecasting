import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Add last_login_at column to users table.
 *
 * Tracks when the user last logged in via the IDP.
 * Updated on each login in syncUserFromIdp / createUserFromIdp.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Drop views that depend on v_users first
  await db.schema.dropView("v_suggested_props").execute();
  await db.schema.dropView("v_users").execute();

  // Add last_login_at column (nullable – null means never logged in or pre-existing user)
  await db.schema
    .alterTable("users")
    .addColumn("last_login_at", "timestamptz")
    .execute();

  // Recreate v_users with last_login_at
  await db.schema
    .createView("v_users")
    .as(
      db.selectFrom("users").select([
        "users.id",
        "users.name",
        "users.email",
        "users.is_admin",
        "users.deactivated_at",
        "users.created_at",
        "users.updated_at",
        "users.idp_user_id",
        "users.username",
        "users.picture_url",
        "users.last_login_at",
      ]),
    )
    .execute();

  // Set security options on v_users
  await sql`ALTER VIEW v_users SET (security_barrier = true, security_invoker = true)`.execute(
    db,
  );

  // Recreate v_suggested_props
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
          "name as user_name",
          "email as user_email",
        ]),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop views that depend on v_users first
  await db.schema.dropView("v_suggested_props").execute();
  await db.schema.dropView("v_users").execute();

  // Remove last_login_at column
  await db.schema.alterTable("users").dropColumn("last_login_at").execute();

  // Recreate v_users without last_login_at
  await db.schema
    .createView("v_users")
    .as(
      db.selectFrom("users").select([
        "users.id",
        "users.name",
        "users.email",
        "users.is_admin",
        "users.deactivated_at",
        "users.created_at",
        "users.updated_at",
        "users.idp_user_id",
        "users.username",
        "users.picture_url",
      ]),
    )
    .execute();

  await sql`ALTER VIEW v_users SET (security_barrier = true, security_invoker = true)`.execute(
    db,
  );

  // Recreate v_suggested_props
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
          "name as user_name",
          "email as user_email",
        ]),
    )
    .execute();
}
