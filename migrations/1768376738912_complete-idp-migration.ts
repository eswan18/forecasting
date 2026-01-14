import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Complete IDP migration: removes all password/login-related tables and views.
 *
 * This migration:
 * - Drops password_reset_tokens, invite_tokens, and logins tables
 * - Removes login_id foreign key from users table
 * - Updates all views that depended on login data
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Drop views that depend on logins table or token tables
  await db.schema.dropView("v_password_reset_tokens").execute();
  await db.schema.dropView("v_feature_flags").ifExists().execute();
  await db.schema.dropView("v_suggested_props").ifExists().execute();
  await db.schema.dropView("v_users").execute();

  // Drop token tables
  await db.schema.dropTable("password_reset_tokens").execute();
  await db.schema.dropTable("invite_tokens").execute();

  // Drop login_id foreign key column from users table
  await db.schema.alterTable("users").dropColumn("login_id").execute();

  // Drop the logins table entirely
  await db.schema.dropTable("logins").execute();

  // Recreate v_users without logins join (no more username or login_id)
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
      ]),
    )
    .execute();

  // Set security options on v_users
  await sql`ALTER VIEW v_users SET (security_barrier = true, security_invoker = true)`.execute(
    db,
  );

  // Recreate v_suggested_props without login_id and username
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

  // Recreate v_feature_flags without user_login_id
  await db.schema
    .createView("v_feature_flags")
    .as(
      db
        .selectFrom("feature_flags")
        .leftJoin("users", "feature_flags.user_id", "users.id")
        .select([
          "feature_flags.id",
          "feature_flags.name",
          "feature_flags.user_id",
          "feature_flags.enabled",
          "users.name as user_name",
          "users.email as user_email",
          "users.is_admin as user_is_admin",
        ]),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop updated views
  await db.schema.dropView("v_feature_flags").ifExists().execute();
  await db.schema.dropView("v_suggested_props").ifExists().execute();
  await db.schema.dropView("v_users").execute();

  // Recreate logins table
  await db.schema
    .createTable("logins")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("username", "varchar", (col) => col.notNull().unique())
    .addColumn("password_hash", "varchar", (col) => col.notNull())
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  // Add login_id column back to users
  await db.schema
    .alterTable("users")
    .addColumn("login_id", "integer", (col) => col.references("logins.id"))
    .execute();

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

  // Recreate v_users with logins join
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

  await sql`ALTER VIEW v_users SET (security_barrier = true, security_invoker = true)`.execute(
    db,
  );

  // Recreate v_suggested_props with login_id and username
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

  // Recreate v_feature_flags with user_login_id
  await db.schema
    .createView("v_feature_flags")
    .as(
      db
        .selectFrom("feature_flags")
        .leftJoin("users", "feature_flags.user_id", "users.id")
        .select([
          "feature_flags.id",
          "feature_flags.name",
          "feature_flags.user_id",
          "feature_flags.enabled",
          "users.name as user_name",
          "users.email as user_email",
          "users.login_id as user_login_id",
          "users.is_admin as user_is_admin",
        ]),
    )
    .execute();

  // Recreate v_password_reset_tokens view
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
