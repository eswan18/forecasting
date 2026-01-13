import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Add idp_user_id column to users table.
  // This is the UUID from the external Identity Provider.
  // NULL means the user is on legacy login (or has no login at all).
  // NOT NULL means the user has been migrated to IDP.
  await db.schema
    .alterTable("users")
    .addColumn("idp_user_id", "uuid")
    .execute();

  // Add index for IDP user lookup
  await db.schema
    .createIndex("idx_users_idp_user_id")
    .on("users")
    .column("idp_user_id")
    .execute();

  // Update v_users view to include the new column.
  // First drop dependent views, then v_users, then recreate all.
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
          "users.idp_user_id",
          "logins.id as login_id",
          "logins.username",
        ]),
    )
    .execute();

  // Set security options on v_users (matching the pattern from 1743088073468)
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
          "login_id as user_login_id",
          "name as user_name",
          "email as user_email",
          "username as user_username",
        ]),
    )
    .execute();

  // Recreate v_password_reset_tokens
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
  // Drop dependent views and v_users
  await db.schema.dropView("v_password_reset_tokens").ifExists().execute();
  await db.schema.dropView("v_suggested_props").ifExists().execute();
  await db.schema.dropView("v_users").execute();

  // Drop the index
  await db.schema.dropIndex("idx_users_idp_user_id").execute();

  // Drop the idp_user_id column
  await db.schema.alterTable("users").dropColumn("idp_user_id").execute();

  // Recreate v_users without the idp_user_id column
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

  // Set security options
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
          "login_id as user_login_id",
          "name as user_name",
          "email as user_email",
          "username as user_username",
        ]),
    )
    .execute();

  // Recreate v_password_reset_tokens
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
