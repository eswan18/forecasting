import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Private Competitions Feature - Schema Changes
 *
 * This migration adds support for private competitions with:
 * - Explicit membership (admin/forecaster roles)
 * - Per-prop dates instead of competition-level dates
 * - Constraints to prevent invalid states
 */
export async function up(db: Kysely<any>): Promise<void> {
  // ============================================
  // 1. Update competitions table
  // ============================================

  // Add is_private column with default FALSE
  await db.schema
    .alterTable("competitions")
    .addColumn("is_private", "boolean", (col) => col.notNull().defaultTo(false))
    .execute();

  // Add created_by_user_id column
  await db.schema
    .alterTable("competitions")
    .addColumn("created_by_user_id", "integer", (col) =>
      col.references("users.id")
    )
    .execute();

  // Make date columns nullable for private competitions
  await sql`ALTER TABLE competitions ALTER COLUMN forecasts_open_date DROP NOT NULL`.execute(
    db
  );
  await sql`ALTER TABLE competitions ALTER COLUMN forecasts_close_date DROP NOT NULL`.execute(
    db
  );
  await sql`ALTER TABLE competitions ALTER COLUMN end_date DROP NOT NULL`.execute(
    db
  );

  // Add constraint: public competitions must have dates
  await db.schema
    .alterTable("competitions")
    .addCheckConstraint(
      "public_competitions_require_dates",
      sql<boolean>`is_private = TRUE OR (forecasts_open_date IS NOT NULL AND forecasts_close_date IS NOT NULL AND end_date IS NOT NULL)`
    )
    .execute();

  // Add constraint: private competitions must NOT have competition-level dates
  await db.schema
    .alterTable("competitions")
    .addCheckConstraint(
      "private_competitions_no_dates",
      sql<boolean>`is_private = FALSE OR (forecasts_open_date IS NULL AND forecasts_close_date IS NULL AND end_date IS NULL)`
    )
    .execute();

  // ============================================
  // 2. Create competition_members table
  // ============================================

  await db.schema
    .createTable("competition_members")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("competition_id", "integer", (col) =>
      col.notNull().references("competitions.id").onDelete("cascade")
    )
    .addColumn("user_id", "integer", (col) =>
      col.notNull().references("users.id").onDelete("cascade")
    )
    .addColumn("role", "varchar(20)", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Add unique constraint for competition_id + user_id
  await db.schema
    .alterTable("competition_members")
    .addUniqueConstraint("competition_members_unique", [
      "competition_id",
      "user_id",
    ])
    .execute();

  // Add check constraint for role values
  await db.schema
    .alterTable("competition_members")
    .addCheckConstraint(
      "competition_members_role_check",
      sql<boolean>`role IN ('admin', 'forecaster')`
    )
    .execute();

  // Add indexes for common queries
  await db.schema
    .createIndex("idx_competition_members_competition_id")
    .on("competition_members")
    .column("competition_id")
    .execute();

  await db.schema
    .createIndex("idx_competition_members_user_id")
    .on("competition_members")
    .column("user_id")
    .execute();

  // ============================================
  // 3. Create helper functions
  // ============================================

  // Function to check if current user is a member of a competition
  await sql`
    CREATE FUNCTION is_competition_member(comp_id INTEGER) RETURNS BOOLEAN AS $$
      SELECT EXISTS (
        SELECT 1 FROM competition_members
        WHERE competition_id = comp_id AND user_id = current_user_id()
      );
    $$ LANGUAGE sql STABLE SECURITY DEFINER;
  `.execute(db);

  // Function to check if current user is an admin of a competition
  await sql`
    CREATE FUNCTION is_competition_admin(comp_id INTEGER) RETURNS BOOLEAN AS $$
      SELECT EXISTS (
        SELECT 1 FROM competition_members
        WHERE competition_id = comp_id
          AND user_id = current_user_id()
          AND role = 'admin'
      );
    $$ LANGUAGE sql STABLE SECURITY DEFINER;
  `.execute(db);

  // ============================================
  // 4. Add trigger to prevent members on public competitions
  // ============================================

  await sql`
    CREATE FUNCTION check_competition_is_private() RETURNS TRIGGER AS $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM competitions
        WHERE id = NEW.competition_id AND is_private = TRUE
      ) THEN
        RAISE EXCEPTION 'Cannot add members to public competitions';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `.execute(db);

  await sql`
    CREATE TRIGGER enforce_private_competition_members
    BEFORE INSERT ON competition_members
    FOR EACH ROW
    EXECUTE FUNCTION check_competition_is_private();
  `.execute(db);

  // ============================================
  // 5. Update props table with per-prop dates
  // ============================================

  await db.schema
    .alterTable("props")
    .addColumn("forecasts_due_date", "timestamptz")
    .execute();

  await db.schema
    .alterTable("props")
    .addColumn("resolution_due_date", "timestamptz")
    .execute();

  await db.schema
    .alterTable("props")
    .addColumn("created_by_user_id", "integer", (col) =>
      col.references("users.id")
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // ============================================
  // 1. Remove props columns
  // ============================================

  await db.schema
    .alterTable("props")
    .dropColumn("created_by_user_id")
    .execute();

  await db.schema
    .alterTable("props")
    .dropColumn("resolution_due_date")
    .execute();

  await db.schema
    .alterTable("props")
    .dropColumn("forecasts_due_date")
    .execute();

  // ============================================
  // 2. Remove trigger and helper functions
  // ============================================

  await sql`DROP TRIGGER IF EXISTS enforce_private_competition_members ON competition_members`.execute(
    db
  );
  await sql`DROP FUNCTION IF EXISTS check_competition_is_private()`.execute(db);
  await sql`DROP FUNCTION IF EXISTS is_competition_admin(INTEGER)`.execute(db);
  await sql`DROP FUNCTION IF EXISTS is_competition_member(INTEGER)`.execute(db);

  // ============================================
  // 3. Drop competition_members table
  // ============================================

  await db.schema.dropTable("competition_members").execute();

  // ============================================
  // 4. Restore competitions table
  // ============================================

  // Drop the constraints
  await db.schema
    .alterTable("competitions")
    .dropConstraint("private_competitions_no_dates")
    .execute();

  await db.schema
    .alterTable("competitions")
    .dropConstraint("public_competitions_require_dates")
    .execute();

  // Make date columns NOT NULL again
  await sql`ALTER TABLE competitions ALTER COLUMN forecasts_open_date SET NOT NULL`.execute(
    db
  );
  await sql`ALTER TABLE competitions ALTER COLUMN forecasts_close_date SET NOT NULL`.execute(
    db
  );
  await sql`ALTER TABLE competitions ALTER COLUMN end_date SET NOT NULL`.execute(
    db
  );

  // Drop columns
  await db.schema
    .alterTable("competitions")
    .dropColumn("created_by_user_id")
    .execute();

  await db.schema.alterTable("competitions").dropColumn("is_private").execute();
}
