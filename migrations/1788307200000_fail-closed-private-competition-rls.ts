import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Fail-closed private-competition RLS.
 *
 * Postgres applies row-level security to the relations referenced *inside* a
 * policy expression, evaluated as the querying role. Every "is this competition
 * private?" test in the visibility policies was written as a negation:
 *
 *     competition_id IS NULL
 *     OR NOT EXISTS (SELECT 1 FROM competitions c
 *                     WHERE c.id = <t>.competition_id AND c.is_private = TRUE)
 *
 * and `view_competitions` hides private competitions from non-members. So for a
 * non-member — or an anonymous caller — that sub-select finds nothing, the
 * NOT EXISTS is TRUE, and the row qualifies under the "public" branch. The
 * negation failed *open*: every private competition's props, forecasts,
 * resolutions and per-option rows were readable by anyone.
 *
 * The positive form fails closed under exactly the same filtering:
 *
 *     competition_id IS NULL
 *     OR EXISTS (SELECT 1 FROM competitions c
 *                 WHERE c.id = <t>.competition_id AND c.is_private = FALSE)
 *
 * A row naming a competition the caller cannot see no longer passes the public
 * branch. Genuinely public props still pass, because `view_competitions` shows
 * public competitions to everyone including anonymous callers (`is_private =
 * FALSE` is its first branch, needing no membership and no session user).
 * Members and system admins are unaffected: they reach these rows through
 * `is_competition_member()` / `is_current_user_admin()`, which are SECURITY
 * DEFINER and therefore never RLS-filtered.
 *
 * All eight affected policies are rewritten together — the five parents from
 * 1769364811701_private_competitions_rls_views (`view_props`, `create_props`,
 * `view_resolutions`, `view_forecasts`, `create_forecasts`) and the three
 * option-table children from 1788220800000_add-choice-props
 * (`view_prop_options`, `view_forecast_options`, `view_resolution_options`) —
 * because closing only the children would leave the prop text and the binary
 * forecasts exposed. Every other policy on these tables (`update_props`,
 * `delete_props`, `manage_resolutions`, `update_own_forecasts`, `manage_*` on
 * the option tables) is untouched: none of them ever used the negation.
 *
 * Nothing but those eight sub-selects changes; the policy text is otherwise
 * identical to what the two earlier migrations created, and `down()` restores
 * it verbatim. Behaviour is covered by
 * tests/integration/choice-props-rls.integration.test.ts, which exercises the
 * policies through a non-owner role.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // ---- props ------------------------------------------------------------
  await sql`DROP POLICY view_props ON props`.execute(db);
  await sql`
    CREATE POLICY view_props ON props
    FOR SELECT
    USING (
      -- Personal props: owner only
      (user_id IS NOT NULL AND user_id = current_user_id())
      -- Public props (no user, and a competition everyone can see)
      OR (
        user_id IS NULL
        AND (
          competition_id IS NULL
          OR EXISTS (
            SELECT 1 FROM competitions c
            WHERE c.id = props.competition_id AND c.is_private = FALSE
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
    )`.execute(db);

  await sql`DROP POLICY create_props ON props`.execute(db);
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
        AND EXISTS (
          SELECT 1 FROM competitions c
          WHERE c.id = props.competition_id AND c.is_private = FALSE
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
    )`.execute(db);

  // ---- resolutions ------------------------------------------------------
  await sql`DROP POLICY view_resolutions ON resolutions`.execute(db);
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
            OR EXISTS (
              SELECT 1 FROM competitions c
              WHERE c.id = p.competition_id AND c.is_private = FALSE
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
    )`.execute(db);

  // ---- forecasts --------------------------------------------------------
  await sql`DROP POLICY view_forecasts ON forecasts`.execute(db);
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
                OR EXISTS (
                  SELECT 1 FROM competitions c
                  WHERE c.id = p.competition_id AND c.is_private = FALSE
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
    )`.execute(db);

  await sql`DROP POLICY create_forecasts ON forecasts`.execute(db);
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
                OR EXISTS (
                  SELECT 1 FROM competitions c
                  WHERE c.id = p.competition_id AND c.is_private = FALSE
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
    )`.execute(db);

  // ---- prop_options -----------------------------------------------------
  await sql`DROP POLICY view_prop_options ON prop_options`.execute(db);
  await sql`
    CREATE POLICY view_prop_options ON prop_options
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM props p
        WHERE p.id = prop_options.prop_id
          AND (
            (p.user_id IS NOT NULL AND p.user_id = current_user_id())
            OR (
              p.user_id IS NULL
              AND (
                p.competition_id IS NULL
                OR EXISTS (
                  SELECT 1 FROM competitions c
                  WHERE c.id = p.competition_id AND c.is_private = FALSE
                )
              )
            )
            OR (p.competition_id IS NOT NULL AND is_competition_member(p.competition_id))
            OR is_current_user_admin()
          )
      )
    )`.execute(db);

  // ---- forecast_options -------------------------------------------------
  await sql`DROP POLICY view_forecast_options ON forecast_options`.execute(db);
  await sql`
    CREATE POLICY view_forecast_options ON forecast_options
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM forecasts f
        WHERE f.id = forecast_options.forecast_id
          AND (
            f.user_id = current_user_id()
            OR EXISTS (
              SELECT 1 FROM props p
              WHERE p.id = f.prop_id
                AND (
                  (p.user_id IS NOT NULL AND p.user_id = current_user_id())
                  OR (
                    p.user_id IS NULL
                    AND (
                      p.competition_id IS NULL
                      OR EXISTS (
                        SELECT 1 FROM competitions c
                        WHERE c.id = p.competition_id AND c.is_private = FALSE
                      )
                    )
                  )
                  OR (p.competition_id IS NOT NULL AND is_competition_member(p.competition_id))
                )
            )
          )
      )
      OR is_current_user_admin()
    )`.execute(db);

  // ---- resolution_options -----------------------------------------------
  await sql`DROP POLICY view_resolution_options ON resolution_options`.execute(
    db,
  );
  await sql`
    CREATE POLICY view_resolution_options ON resolution_options
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM resolutions r
        WHERE r.id = resolution_options.resolution_id
          AND (
            (r.user_id IS NOT NULL AND r.user_id = current_user_id())
            OR EXISTS (
              SELECT 1 FROM props p
              WHERE p.id = r.prop_id
                AND p.user_id IS NULL
                AND (
                  p.competition_id IS NULL
                  OR EXISTS (
                    SELECT 1 FROM competitions c
                    WHERE c.id = p.competition_id AND c.is_private = FALSE
                  )
                )
            )
            OR EXISTS (
              SELECT 1 FROM props p
              WHERE p.id = r.prop_id
                AND p.competition_id IS NOT NULL
                AND is_competition_member(p.competition_id)
            )
            OR is_current_user_admin()
          )
      )
    )`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Restores the fail-open text verbatim: the `NOT EXISTS (… is_private =
  // TRUE)` form from 1769364811701 and 1788220800000.
  await sql`DROP POLICY view_resolution_options ON resolution_options`.execute(
    db,
  );
  await sql`
    CREATE POLICY view_resolution_options ON resolution_options
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM resolutions r
        WHERE r.id = resolution_options.resolution_id
          AND (
            (r.user_id IS NOT NULL AND r.user_id = current_user_id())
            OR EXISTS (
              SELECT 1 FROM props p
              WHERE p.id = r.prop_id
                AND p.user_id IS NULL
                AND (
                  p.competition_id IS NULL
                  OR NOT EXISTS (
                    SELECT 1 FROM competitions c
                    WHERE c.id = p.competition_id AND c.is_private = TRUE
                  )
                )
            )
            OR EXISTS (
              SELECT 1 FROM props p
              WHERE p.id = r.prop_id
                AND p.competition_id IS NOT NULL
                AND is_competition_member(p.competition_id)
            )
            OR is_current_user_admin()
          )
      )
    )`.execute(db);

  await sql`DROP POLICY view_forecast_options ON forecast_options`.execute(db);
  await sql`
    CREATE POLICY view_forecast_options ON forecast_options
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM forecasts f
        WHERE f.id = forecast_options.forecast_id
          AND (
            f.user_id = current_user_id()
            OR EXISTS (
              SELECT 1 FROM props p
              WHERE p.id = f.prop_id
                AND (
                  (p.user_id IS NOT NULL AND p.user_id = current_user_id())
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
                  OR (p.competition_id IS NOT NULL AND is_competition_member(p.competition_id))
                )
            )
          )
      )
      OR is_current_user_admin()
    )`.execute(db);

  await sql`DROP POLICY view_prop_options ON prop_options`.execute(db);
  await sql`
    CREATE POLICY view_prop_options ON prop_options
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM props p
        WHERE p.id = prop_options.prop_id
          AND (
            (p.user_id IS NOT NULL AND p.user_id = current_user_id())
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
            OR (p.competition_id IS NOT NULL AND is_competition_member(p.competition_id))
            OR is_current_user_admin()
          )
      )
    )`.execute(db);

  await sql`DROP POLICY create_forecasts ON forecasts`.execute(db);
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
    )`.execute(db);

  await sql`DROP POLICY view_forecasts ON forecasts`.execute(db);
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
    )`.execute(db);

  await sql`DROP POLICY view_resolutions ON resolutions`.execute(db);
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
    )`.execute(db);

  await sql`DROP POLICY create_props ON props`.execute(db);
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
    )`.execute(db);

  await sql`DROP POLICY view_props ON props`.execute(db);
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
    )`.execute(db);
}
