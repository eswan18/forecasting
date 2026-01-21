import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Add picture_url column to users table.
 *
 * This stores the avatar URL from the external IDP locally for display purposes.
 * The picture_url is updated on each login to stay in sync with the IDP.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Drop views that depend on v_users first
  await db.schema.dropView("v_suggested_props").execute();
  await db.schema.dropView("v_users").execute();

  // Add picture_url column to users table (nullable for users without avatars)
  await db.schema
    .alterTable("users")
    .addColumn("picture_url", "varchar")
    .execute();

  // Recreate v_users with picture_url
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

  // Remove picture_url column from users table
  await db.schema.alterTable("users").dropColumn("picture_url").execute();

  // Recreate v_users without picture_url
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
