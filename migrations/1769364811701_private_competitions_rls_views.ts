import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Private Competitions Feature - RLS Policies and Views
 *
 * This migration adds:
 * - RLS policies for competitions, competition_members, props, resolutions, forecasts
 * - Updated views with new columns
 * - New v_competition_members view
 */
export async function up(db: Kysely<any>): Promise<void> {
  // ============================================
  // 1. Enable RLS on competitions table
  // ============================================

  await sql`ALTER TABLE competitions ENABLE ROW LEVEL SECURITY`.execute(db);

  // Policy: View competitions
  // - Public competitions: everyone can see
  // - Private competitions: only members can see
  // - System admins see all
  await sql`
    CREATE POLICY view_competitions ON competitions
    FOR SELECT
    USING (
      is_private = FALSE
      OR is_competition_member(id)
      OR is_current_user_admin()
    );
  `.execute(db);

  // Policy: Create competitions (any authenticated user)
  await sql`
    CREATE POLICY create_competitions ON competitions
    FOR INSERT
    WITH CHECK (current_user_id() IS NOT NULL);
  `.execute(db);

  // Policy: Update competitions
  // - Private: only competition admins
  // - Public: only system admins
  await sql`
    CREATE POLICY update_competitions ON competitions
    FOR UPDATE
    USING (
      (is_private = TRUE AND is_competition_admin(id))
      OR is_current_user_admin()
    )
    WITH CHECK (
      (is_private = TRUE AND is_competition_admin(id))
      OR is_current_user_admin()
    );
  `.execute(db);

  // Policy: Delete competitions (system admins or competition admins for private)
  await sql`
    CREATE POLICY delete_competitions ON competitions
    FOR DELETE
    USING (
      (is_private = TRUE AND is_competition_admin(id))
      OR is_current_user_admin()
    );
  `.execute(db);

  // ============================================
  // 2. Enable RLS on competition_members table
  // ============================================

  await sql`ALTER TABLE competition_members ENABLE ROW LEVEL SECURITY`.execute(
    db
  );

  // Policy: View members (competition members and system admins)
  await sql`
    CREATE POLICY view_competition_members ON competition_members
    FOR SELECT
    USING (
      is_competition_member(competition_id)
      OR is_current_user_admin()
    );
  `.execute(db);

  // Policy: Manage members (competition admins and system admins)
  await sql`
    CREATE POLICY manage_competition_members ON competition_members
    FOR ALL
    USING (
      is_competition_admin(competition_id)
      OR is_current_user_admin()
    )
    WITH CHECK (
      is_competition_admin(competition_id)
      OR is_current_user_admin()
    );
  `.execute(db);

  // ============================================
  // 3. Update RLS on props table
  // ============================================

  // Drop existing policies
  await sql`DROP POLICY IF EXISTS "users_own_records" ON props`.execute(db);
  await sql`DROP POLICY IF EXISTS admin_all_access ON props`.execute(db);

  // Policy: View props based on ownership and competition membership
  await sql`
    CREATE POLICY view_props ON props
    FOR SELECT
    USING (
      -- Personal props: owner only
      (user_id IS NOT NULL AND user_id = current_user_id())
      -- Public props (no user, no private competition)
      OR (
        user_id IS NULL
        AND (
          competition_id IS NULL
          OR NOT EXISTS (
            SELECT 1 FROM competitions c
            WHERE c.id = props.competition_id AND c.is_private = TRUE
          )
        )
      )
      -- Private competition props: members only
      OR (
        competition_id IS NOT NULL
        AND is_competition_member(competition_id)
      )
      -- System admins see all
      OR is_current_user_admin()
    );
  `.execute(db);

  // Policy: Create props
  await sql`
    CREATE POLICY create_props ON props
    FOR INSERT
    WITH CHECK (
      -- Personal props
      (user_id IS NOT NULL AND user_id = current_user_id())
      -- Public competition props (system admin only for now)
      OR (
        user_id IS NULL
        AND competition_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM competitions c
          WHERE c.id = props.competition_id AND c.is_private = TRUE
        )
        AND is_current_user_admin()
      )
      -- Private competition props: competition admins only
      OR (
        competition_id IS NOT NULL
        AND is_competition_admin(competition_id)
      )
      -- System admins
      OR is_current_user_admin()
    );
  `.execute(db);

  // Policy: Update props
  await sql`
    CREATE POLICY update_props ON props
    FOR UPDATE
    USING (
      (user_id IS NOT NULL AND user_id = current_user_id())
      OR (competition_id IS NOT NULL AND is_competition_admin(competition_id))
      OR is_current_user_admin()
    )
    WITH CHECK (
      (user_id IS NOT NULL AND user_id = current_user_id())
      OR (competition_id IS NOT NULL AND is_competition_admin(competition_id))
      OR is_current_user_admin()
    );
  `.execute(db);

  // Policy: Delete props
  await sql`
    CREATE POLICY delete_props ON props
    FOR DELETE
    USING (
      (user_id IS NOT NULL AND user_id = current_user_id())
      OR (competition_id IS NOT NULL AND is_competition_admin(competition_id))
      OR is_current_user_admin()
    );
  `.execute(db);

  // ============================================
  // 4. Update RLS on resolutions table
  // ============================================

  await sql`DROP POLICY IF EXISTS "users_own_records" ON resolutions`.execute(
    db
  );
  await sql`DROP POLICY IF EXISTS admin_all_access ON resolutions`.execute(db);

  // Policy: View resolutions based on prop visibility
  await sql`
    CREATE POLICY view_resolutions ON resolutions
    FOR SELECT
    USING (
      -- Personal prop resolutions
      (resolutions.user_id IS NOT NULL AND resolutions.user_id = current_user_id())
      -- Public resolutions (via prop visibility)
      OR EXISTS (
        SELECT 1 FROM props p
        WHERE p.id = resolutions.prop_id
          AND p.user_id IS NULL
          AND (
            p.competition_id IS NULL
            OR NOT EXISTS (
              SELECT 1 FROM competitions c
              WHERE c.id = p.competition_id AND c.is_private = TRUE
            )
          )
      )
      -- Private competition resolutions: must be a member
      OR EXISTS (
        SELECT 1 FROM props p
        WHERE p.id = resolutions.prop_id
          AND p.competition_id IS NOT NULL
          AND is_competition_member(p.competition_id)
      )
      -- System admins
      OR is_current_user_admin()
    );
  `.execute(db);

  // Policy: Manage resolutions
  await sql`
    CREATE POLICY manage_resolutions ON resolutions
    FOR ALL
    USING (
      -- Personal prop owner
      (resolutions.user_id IS NOT NULL AND resolutions.user_id = current_user_id())
      -- Private competition admin
      OR EXISTS (
        SELECT 1 FROM props p
        WHERE p.id = resolutions.prop_id
          AND p.competition_id IS NOT NULL
          AND is_competition_admin(p.competition_id)
      )
      -- System admins
      OR is_current_user_admin()
    )
    WITH CHECK (
      (resolutions.user_id IS NOT NULL AND resolutions.user_id = current_user_id())
      OR EXISTS (
        SELECT 1 FROM props p
        WHERE p.id = resolutions.prop_id
          AND p.competition_id IS NOT NULL
          AND is_competition_admin(p.competition_id)
      )
      OR is_current_user_admin()
    );
  `.execute(db);

  // ============================================
  // 5. Update RLS on forecasts table
  // ============================================

  await sql`DROP POLICY IF EXISTS everyone_sees_all ON forecasts`.execute(db);
  await sql`DROP POLICY IF EXISTS admin_all_access ON forecasts`.execute(db);

  // Policy: View forecasts based on prop visibility
  await sql`
    CREATE POLICY view_forecasts ON forecasts
    FOR SELECT
    USING (
      -- Own forecasts
      forecasts.user_id = current_user_id()
      -- Forecasts on visible props
      OR EXISTS (
        SELECT 1 FROM props p
        WHERE p.id = forecasts.prop_id
          AND (
            -- Personal prop
            (p.user_id IS NOT NULL AND p.user_id = current_user_id())
            -- Public prop
            OR (
              p.user_id IS NULL
              AND (
                p.competition_id IS NULL
                OR NOT EXISTS (
                  SELECT 1 FROM competitions c
                  WHERE c.id = p.competition_id AND c.is_private = TRUE
                )
              )
            )
            -- Private competition member
            OR (
              p.competition_id IS NOT NULL
              AND is_competition_member(p.competition_id)
            )
          )
      )
      -- System admins
      OR is_current_user_admin()
    );
  `.execute(db);

  // Policy: Create forecasts on visible props
  await sql`
    CREATE POLICY create_forecasts ON forecasts
    FOR INSERT
    WITH CHECK (
      forecasts.user_id = current_user_id()
      AND EXISTS (
        SELECT 1 FROM props p
        WHERE p.id = forecasts.prop_id
          AND (
            -- Personal prop owner
            (p.user_id IS NOT NULL AND p.user_id = current_user_id())
            -- Public prop
            OR (
              p.user_id IS NULL
              AND (
                p.competition_id IS NULL
                OR NOT EXISTS (
                  SELECT 1 FROM competitions c
                  WHERE c.id = p.competition_id AND c.is_private = TRUE
                )
              )
            )
            -- Private competition member (any role can forecast)
            OR (
              p.competition_id IS NOT NULL
              AND is_competition_member(p.competition_id)
            )
          )
      )
    );
  `.execute(db);

  // Policy: Update own forecasts
  await sql`
    CREATE POLICY update_own_forecasts ON forecasts
    FOR UPDATE
    USING (forecasts.user_id = current_user_id())
    WITH CHECK (forecasts.user_id = current_user_id());
  `.execute(db);

  // Policy: System admin full access
  await sql`
    CREATE POLICY admin_all_access ON forecasts
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());
  `.execute(db);

  // ============================================
  // 6. Update views
  // ============================================

  // Drop existing views
  await db.schema.dropView("v_props").execute();
  await db.schema.dropView("v_forecasts").execute();

  // Recreate v_props with new columns
  await sql`
    CREATE VIEW v_props WITH (security_barrier, security_invoker) AS
    SELECT
      categories.id AS category_id,
      categories.name AS category_name,
      props.id AS prop_id,
      props.text AS prop_text,
      props.notes AS prop_notes,
      props.user_id AS prop_user_id,
      props.competition_id,
      props.forecasts_due_date AS prop_forecasts_due_date,
      props.resolution_due_date AS prop_resolution_due_date,
      props.created_by_user_id AS prop_created_by_user_id,
      competitions.name AS competition_name,
      competitions.is_private AS competition_is_private,
      COALESCE(props.forecasts_due_date, competitions.forecasts_close_date) AS competition_forecasts_close_date,
      COALESCE(props.forecasts_due_date, competitions.forecasts_open_date) AS competition_forecasts_open_date,
      resolutions.id AS resolution_id,
      resolutions.resolution,
      resolutions.notes AS resolution_notes,
      resolutions.user_id AS resolution_user_id
    FROM props
      LEFT JOIN categories ON props.category_id = categories.id
      LEFT JOIN resolutions ON props.id = resolutions.prop_id
      LEFT JOIN competitions ON props.competition_id = competitions.id;
  `.execute(db);

  // Recreate v_forecasts with new columns
  await sql`
    CREATE VIEW v_forecasts WITH (security_barrier, security_invoker) AS
    SELECT
      users.id AS user_id,
      users.name AS user_name,
      categories.id AS category_id,
      categories.name AS category_name,
      COALESCE(props.forecasts_due_date, competitions.forecasts_close_date) AS competition_forecasts_close_date,
      COALESCE(props.forecasts_due_date, competitions.forecasts_open_date) AS competition_forecasts_open_date,
      props.id AS prop_id,
      props.text AS prop_text,
      props.notes AS prop_notes,
      props.user_id AS prop_user_id,
      props.competition_id,
      props.forecasts_due_date AS prop_forecasts_due_date,
      props.resolution_due_date AS prop_resolution_due_date,
      props.created_by_user_id AS prop_created_by_user_id,
      competitions.name AS competition_name,
      competitions.is_private AS competition_is_private,
      forecasts.id AS forecast_id,
      forecasts.forecast,
      forecasts.created_at AS forecast_created_at,
      forecasts.updated_at AS forecast_updated_at,
      resolutions.id AS resolution_id,
      resolutions.resolution,
      resolutions.notes AS resolution_notes,
      resolutions.created_at AS resolution_created_at,
      resolutions.updated_at AS resolution_updated_at,
      resolutions.user_id AS resolution_user_id,
      power(resolutions.resolution::integer::double precision - forecasts.forecast, 2::double precision) AS score
    FROM users
      JOIN forecasts ON users.id = forecasts.user_id
      JOIN props ON forecasts.prop_id = props.id
      LEFT JOIN categories ON props.category_id = categories.id
      LEFT JOIN resolutions ON props.id = resolutions.prop_id
      LEFT JOIN competitions ON props.competition_id = competitions.id;
  `.execute(db);

  // Create new v_competition_members view
  await sql`
    CREATE VIEW v_competition_members WITH (security_barrier, security_invoker) AS
    SELECT
      cm.id AS membership_id,
      cm.competition_id,
      cm.user_id,
      cm.role,
      cm.created_at AS membership_created_at,
      cm.updated_at AS membership_updated_at,
      c.name AS competition_name,
      c.is_private AS competition_is_private,
      u.name AS user_name,
      u.email AS user_email,
      u.username AS user_username
    FROM competition_members cm
      JOIN competitions c ON cm.competition_id = c.id
      JOIN users u ON cm.user_id = u.id;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // ============================================
  // 1. Drop new view and restore original views
  // ============================================

  await db.schema.dropView("v_competition_members").execute();
  await db.schema.dropView("v_props").execute();
  await db.schema.dropView("v_forecasts").execute();

  await sql`
    CREATE VIEW v_props WITH (security_barrier, security_invoker) AS
    SELECT
      categories.id AS category_id,
      categories.name AS category_name,
      props.id AS prop_id,
      props.text AS prop_text,
      props.notes AS prop_notes,
      props.user_id AS prop_user_id,
      props.competition_id,
      competitions.name AS competition_name,
      competitions.forecasts_close_date AS competition_forecasts_close_date,
      competitions.forecasts_open_date AS competition_forecasts_open_date,
      resolutions.id AS resolution_id,
      resolutions.resolution,
      resolutions.notes AS resolution_notes,
      resolutions.user_id AS resolution_user_id
    FROM props
      LEFT JOIN categories ON props.category_id = categories.id
      LEFT JOIN resolutions ON props.id = resolutions.prop_id
      LEFT JOIN competitions ON props.competition_id = competitions.id;
  `.execute(db);

  await sql`
    CREATE VIEW v_forecasts WITH (security_barrier, security_invoker) AS
    SELECT
      users.id AS user_id,
      users.name AS user_name,
      categories.id AS category_id,
      categories.name AS category_name,
      competitions.forecasts_close_date AS competition_forecasts_close_date,
      competitions.forecasts_open_date AS competition_forecasts_open_date,
      props.id AS prop_id,
      props.text AS prop_text,
      props.notes AS prop_notes,
      props.user_id AS prop_user_id,
      props.competition_id,
      competitions.name AS competition_name,
      forecasts.id AS forecast_id,
      forecasts.forecast,
      forecasts.created_at AS forecast_created_at,
      forecasts.updated_at AS forecast_updated_at,
      resolutions.id AS resolution_id,
      resolutions.resolution,
      resolutions.notes AS resolution_notes,
      resolutions.created_at AS resolution_created_at,
      resolutions.updated_at AS resolution_updated_at,
      resolutions.user_id AS resolution_user_id,
      power(resolutions.resolution::integer::double precision - forecasts.forecast, 2::double precision) AS score
    FROM users
      JOIN forecasts ON users.id = forecasts.user_id
      JOIN props ON forecasts.prop_id = props.id
      LEFT JOIN categories ON props.category_id = categories.id
      LEFT JOIN resolutions ON props.id = resolutions.prop_id
      LEFT JOIN competitions ON props.competition_id = competitions.id;
  `.execute(db);

  // ============================================
  // 2. Restore original forecasts RLS
  // ============================================

  await sql`DROP POLICY IF EXISTS admin_all_access ON forecasts`.execute(db);
  await sql`DROP POLICY IF EXISTS update_own_forecasts ON forecasts`.execute(
    db
  );
  await sql`DROP POLICY IF EXISTS create_forecasts ON forecasts`.execute(db);
  await sql`DROP POLICY IF EXISTS view_forecasts ON forecasts`.execute(db);

  await sql`
    CREATE POLICY everyone_sees_all ON forecasts
    FOR SELECT
    USING (true);
  `.execute(db);

  await sql`
    CREATE POLICY admin_all_access ON forecasts
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());
  `.execute(db);

  // ============================================
  // 3. Restore original resolutions RLS
  // ============================================

  await sql`DROP POLICY IF EXISTS manage_resolutions ON resolutions`.execute(
    db
  );
  await sql`DROP POLICY IF EXISTS view_resolutions ON resolutions`.execute(db);

  await sql`
    CREATE POLICY "users_own_records" ON resolutions
    USING (resolutions.user_id IS NULL OR current_user_id() = resolutions.user_id)
    WITH CHECK (resolutions.user_id IS NOT NULL AND current_user_id() = resolutions.user_id);
  `.execute(db);

  await sql`
    CREATE POLICY admin_all_access ON resolutions
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());
  `.execute(db);

  // ============================================
  // 4. Restore original props RLS
  // ============================================

  await sql`DROP POLICY IF EXISTS delete_props ON props`.execute(db);
  await sql`DROP POLICY IF EXISTS update_props ON props`.execute(db);
  await sql`DROP POLICY IF EXISTS create_props ON props`.execute(db);
  await sql`DROP POLICY IF EXISTS view_props ON props`.execute(db);

  await sql`
    CREATE POLICY "users_own_records" ON props
    USING (props.user_id IS NULL OR current_user_id() = props.user_id)
    WITH CHECK (props.user_id IS NOT NULL AND current_user_id() = props.user_id);
  `.execute(db);

  await sql`
    CREATE POLICY admin_all_access ON props
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());
  `.execute(db);

  // ============================================
  // 5. Drop competition_members RLS
  // ============================================

  await sql`DROP POLICY IF EXISTS manage_competition_members ON competition_members`.execute(
    db
  );
  await sql`DROP POLICY IF EXISTS view_competition_members ON competition_members`.execute(
    db
  );
  await sql`ALTER TABLE competition_members DISABLE ROW LEVEL SECURITY`.execute(
    db
  );

  // ============================================
  // 6. Drop competitions RLS
  // ============================================

  await sql`DROP POLICY IF EXISTS delete_competitions ON competitions`.execute(
    db
  );
  await sql`DROP POLICY IF EXISTS update_competitions ON competitions`.execute(
    db
  );
  await sql`DROP POLICY IF EXISTS create_competitions ON competitions`.execute(
    db
  );
  await sql`DROP POLICY IF EXISTS view_competitions ON competitions`.execute(
    db
  );
  await sql`ALTER TABLE competitions DISABLE ROW LEVEL SECURITY`.execute(db);
}
