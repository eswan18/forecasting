import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Create core tables that are required by later migrations
  
  // Categories table
  await db.schema
    .createTable("categories")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar", (col) => col.notNull().unique())
    .execute();

  // Logins table (with is_salted that gets removed later)
  await db.schema
    .createTable("logins")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("username", "varchar", (col) => col.notNull().unique())
    .addColumn("password_hash", "varchar", (col) => col.notNull())
    .addColumn("is_salted", "boolean", (col) => col.notNull().defaultTo(true))
    .execute();

  // Users table
  await db.schema
    .createTable("users")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar", (col) => col.notNull())
    .addColumn("email", "varchar", (col) => col.notNull().unique())
    .addColumn("login_id", "integer", (col) => col.references("logins.id"))
    .addColumn("is_admin", "boolean", (col) => col.notNull().defaultTo(false))
    .execute();

  // Props table (matching the expected structure)
  await db.schema
    .createTable("props")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("text", "text", (col) => col.notNull())
    .addColumn("title", "varchar", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("category_id", "integer", (col) => col.references("categories.id"))
    .addColumn("year", "integer")
    .execute();

  // Forecasts table (expected to have 'forecast' column not 'probability')
  await db.schema
    .createTable("forecasts")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("user_id", "integer", (col) => col.notNull().references("users.id"))
    .addColumn("prop_id", "integer", (col) => col.notNull().references("props.id"))
    .addColumn("forecast", "decimal", (col) => col.notNull())
    .execute();

  // Resolutions table
  await db.schema
    .createTable("resolutions")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("prop_id", "integer", (col) => col.notNull().references("props.id"))
    .addColumn("resolution", "boolean", (col) => col.notNull())
    .addColumn("resolved_at", "timestamptz", (col) => col.notNull())
    .execute();

  // Note: invite_tokens table is created by migration 1732993480596_create-table-invite-secrets.ts

  // Insert basic categories
  await db.insertInto("categories")
    .values([
      { name: "politics" },
      { name: "technology" }, 
      { name: "economics" },
      { name: "sports" },
      { name: "science" }
    ])
    .execute();

  // Insert foundational users that other migrations expect
  // Create a basic login first
  const loginResult = await db
    .insertInto("logins")
    .values({
      username: "admin",
      password_hash: "$argon2id$v=19$m=65536,t=3,p=4$placeholder_hash",
      is_salted: true
    })
    .returning("id")
    .executeTakeFirst();

  // Create the admin user with ID 1 that migrations expect
  await db
    .insertInto("users")
    .values({
      name: "System Admin",
      email: "admin@system.local",
      login_id: loginResult!.id,
      is_admin: true
    })
    .execute();

  // Create initial v_users view (with is_salted)
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
          "logins.is_salted"
        ])
    )
    .execute();

  // Create initial v_props view (simple version before competitions exist)
  await db.schema
    .createView("v_props")  
    .as(
      db
        .selectFrom("props")
        .leftJoin("categories", "props.category_id", "categories.id")
        .leftJoin("resolutions", "props.id", "resolutions.prop_id")
        .select([
          "categories.id as category_id",
          "categories.name as category_name", 
          "props.id as prop_id",
          "props.text as prop_text",
          "props.title as prop_title",
          "props.description as prop_description",
          "props.year",
          "resolutions.id as resolution_id",
          "resolutions.resolution",
          "resolutions.resolved_at"
        ])
    )
    .execute();

  // Create initial v_forecasts view (simple version, timestamps added later)
  await db.schema
    .createView("v_forecasts")
    .as(
      db
        .selectFrom("forecasts")
        .innerJoin("users", "forecasts.user_id", "users.id")
        .innerJoin("props", "forecasts.prop_id", "props.id")
        .leftJoin("categories", "props.category_id", "categories.id") 
        .leftJoin("resolutions", "props.id", "resolutions.prop_id")
        .select([
          "forecasts.id as forecast_id",
          "forecasts.forecast",
          "users.id as user_id",
          "users.name as user_name",
          "props.id as prop_id", 
          "props.text as prop_text",
          "props.title as prop_title",
          "props.year",
          "categories.id as category_id",
          "categories.name as category_name",
          "resolutions.id as resolution_id", 
          "resolutions.resolution",
          "resolutions.resolved_at"
        ])
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop views first
  await db.schema.dropView("v_forecasts").ifExists().execute();
  await db.schema.dropView("v_props").ifExists().execute();
  await db.schema.dropView("v_users").ifExists().execute();
  
  // Drop tables in reverse order to handle foreign keys
  await db.schema.dropTable("forecasts").ifExists().execute();
  await db.schema.dropTable("resolutions").ifExists().execute();
  await db.schema.dropTable("props").ifExists().execute();
  await db.schema.dropTable("users").ifExists().execute();
  await db.schema.dropTable("logins").ifExists().execute();
  await db.schema.dropTable("categories").ifExists().execute();
}