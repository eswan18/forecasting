import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Choice props: props whose forecast is a probability per option.
 * See docs/superpowers/specs/2026-09-01-choice-props-design.md §2.
 *
 * Header rows stay one-per-(user, prop) in forecasts and one-per-prop in
 * resolutions; per-option values live in forecast_options / resolution_options
 * keyed to prop_options. v_forecasts.score becomes the per-prop score for
 * every kind so AVG(score) keeps meaning "average over props".
 */
export async function up(db: Kysely<any>): Promise<void> {
  // ---- props.kind -------------------------------------------------------
  await sql`ALTER TABLE props ADD COLUMN kind text NOT NULL DEFAULT 'binary'`.execute(
    db,
  );
  await sql`ALTER TABLE props ADD CONSTRAINT props_kind_check CHECK (kind IN ('binary', 'one_of', 'any_of'))`.execute(
    db,
  );

  // ---- prop_options -----------------------------------------------------
  // The (prop_id, text) uniqueness is DEFERRABLE INITIALLY DEFERRED because
  // label edits are legal permutations: swapping two options' labels rewrites
  // them one row at a time, and a non-deferrable unique is checked per row
  // even within a single statement, so the first UPDATE would collide with a
  // label that has not been rewritten yet. Deferring moves the check to
  // commit, by which point the set of labels is unique again.
  await sql`
    CREATE TABLE prop_options (
      id serial PRIMARY KEY,
      prop_id integer NOT NULL REFERENCES props(id) ON DELETE CASCADE,
      text text NOT NULL,
      position integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT prop_options_prop_position_unique UNIQUE (prop_id, position),
      CONSTRAINT prop_options_prop_text_unique UNIQUE (prop_id, text) DEFERRABLE INITIALLY DEFERRED,
      CONSTRAINT prop_options_id_prop_unique UNIQUE (id, prop_id)
    )`.execute(db);
  await sql`CREATE TRIGGER set_updated_at BEFORE INSERT OR UPDATE ON prop_options FOR EACH ROW EXECUTE FUNCTION set_updated_at()`.execute(
    db,
  );

  // ---- forecasts --------------------------------------------------------
  await sql`ALTER TABLE forecasts ALTER COLUMN forecast DROP NOT NULL`.execute(
    db,
  );
  await sql`ALTER TABLE forecasts ADD CONSTRAINT forecasts_id_prop_unique UNIQUE (id, prop_id)`.execute(
    db,
  );

  await sql`
    CREATE TABLE forecast_options (
      forecast_id integer NOT NULL,
      prop_id integer NOT NULL,
      option_id integer NOT NULL,
      probability double precision NOT NULL CHECK (probability >= 0 AND probability <= 1),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (forecast_id, option_id),
      CONSTRAINT forecast_options_forecast_fk FOREIGN KEY (forecast_id, prop_id) REFERENCES forecasts(id, prop_id) ON DELETE CASCADE,
      CONSTRAINT forecast_options_option_fk FOREIGN KEY (option_id, prop_id) REFERENCES prop_options(id, prop_id)
    )`.execute(db);
  // The primary key leads with forecast_id, so nothing indexes prop_id on its
  // own; deleting a prop cascades through prop_options, whose FK target is
  // (option_id, prop_id), and per-prop reads filter on prop_id directly.
  await sql`CREATE INDEX forecast_options_prop_id_idx ON forecast_options (prop_id)`.execute(
    db,
  );
  await sql`CREATE TRIGGER set_updated_at BEFORE INSERT OR UPDATE ON forecast_options FOR EACH ROW EXECUTE FUNCTION set_updated_at()`.execute(
    db,
  );

  // ---- resolutions ------------------------------------------------------
  // resolved_at is gone from production (see docs/schema.png, types/db_types.ts)
  // but the test bootstrap still creates it NOT NULL, which breaks every
  // app-path insert in the container tests. No-op where it is already gone.
  await sql`ALTER TABLE resolutions DROP COLUMN IF EXISTS resolved_at`.execute(
    db,
  );
  await sql`ALTER TABLE resolutions ALTER COLUMN resolution DROP NOT NULL`.execute(
    db,
  );
  await sql`ALTER TABLE resolutions ADD CONSTRAINT resolutions_prop_unique UNIQUE (prop_id)`.execute(
    db,
  );
  await sql`ALTER TABLE resolutions ADD CONSTRAINT resolutions_id_prop_unique UNIQUE (id, prop_id)`.execute(
    db,
  );

  await sql`
    CREATE TABLE resolution_options (
      resolution_id integer NOT NULL,
      prop_id integer NOT NULL,
      option_id integer NOT NULL,
      outcome boolean NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (resolution_id, option_id),
      CONSTRAINT resolution_options_resolution_fk FOREIGN KEY (resolution_id, prop_id) REFERENCES resolutions(id, prop_id) ON DELETE CASCADE,
      CONSTRAINT resolution_options_option_fk FOREIGN KEY (option_id, prop_id) REFERENCES prop_options(id, prop_id)
    )`.execute(db);
  await sql`CREATE TRIGGER set_updated_at BEFORE INSERT OR UPDATE ON resolution_options FOR EACH ROW EXECUTE FUNCTION set_updated_at()`.execute(
    db,
  );

  // ---- kind-consistency triggers ---------------------------------------
  await sql`
    CREATE FUNCTION prop_kind_of(p_id integer) RETURNS text AS $$
      SELECT kind FROM props WHERE id = p_id
    $$ LANGUAGE sql STABLE SECURITY DEFINER`.execute(db);

  await sql`
    CREATE FUNCTION check_forecast_matches_prop_kind() RETURNS trigger AS $$
    BEGIN
      IF (prop_kind_of(NEW.prop_id) = 'binary') <> (NEW.forecast IS NOT NULL) THEN
        RAISE EXCEPTION 'forecasts.forecast must be set for binary props and null for choice props (prop %)', NEW.prop_id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER`.execute(db);
  await sql`CREATE TRIGGER enforce_forecast_kind BEFORE INSERT OR UPDATE ON forecasts FOR EACH ROW EXECUTE FUNCTION check_forecast_matches_prop_kind()`.execute(
    db,
  );

  await sql`
    CREATE FUNCTION check_resolution_matches_prop_kind() RETURNS trigger AS $$
    BEGIN
      IF (prop_kind_of(NEW.prop_id) = 'binary') <> (NEW.resolution IS NOT NULL) THEN
        RAISE EXCEPTION 'resolutions.resolution must be set for binary props and null for choice props (prop %)', NEW.prop_id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER`.execute(db);
  await sql`CREATE TRIGGER enforce_resolution_kind BEFORE INSERT OR UPDATE ON resolutions FOR EACH ROW EXECUTE FUNCTION check_resolution_matches_prop_kind()`.execute(
    db,
  );

  await sql`
    CREATE FUNCTION forbid_prop_kind_change() RETURNS trigger AS $$
    BEGIN
      IF NEW.kind IS DISTINCT FROM OLD.kind THEN
        RAISE EXCEPTION 'props.kind cannot be changed after creation (prop %)', OLD.id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql`.execute(db);
  await sql`CREATE TRIGGER enforce_prop_kind_immutable BEFORE UPDATE ON props FOR EACH ROW EXECUTE FUNCTION forbid_prop_kind_change()`.execute(
    db,
  );

  // ---- row-level security ----------------------------------------------
  await sql`ALTER TABLE prop_options ENABLE ROW LEVEL SECURITY`.execute(db);
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
  await sql`
    CREATE POLICY manage_prop_options ON prop_options
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM props p
        WHERE p.id = prop_options.prop_id
          AND (
            (p.user_id IS NOT NULL AND p.user_id = current_user_id())
            OR (p.competition_id IS NOT NULL AND is_competition_admin(p.competition_id))
          )
      )
      OR is_current_user_admin()
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM props p
        WHERE p.id = prop_options.prop_id
          AND (
            (p.user_id IS NOT NULL AND p.user_id = current_user_id())
            OR (p.competition_id IS NOT NULL AND is_competition_admin(p.competition_id))
          )
      )
      OR is_current_user_admin()
    )`.execute(db);

  await sql`ALTER TABLE forecast_options ENABLE ROW LEVEL SECURITY`.execute(db);
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
  await sql`
    CREATE POLICY manage_forecast_options ON forecast_options
    FOR ALL
    USING (
      EXISTS (SELECT 1 FROM forecasts f WHERE f.id = forecast_options.forecast_id AND f.user_id = current_user_id())
      OR is_current_user_admin()
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM forecasts f WHERE f.id = forecast_options.forecast_id AND f.user_id = current_user_id())
      OR is_current_user_admin()
    )`.execute(db);

  await sql`ALTER TABLE resolution_options ENABLE ROW LEVEL SECURITY`.execute(
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
  await sql`
    CREATE POLICY manage_resolution_options ON resolution_options
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM resolutions r
        WHERE r.id = resolution_options.resolution_id
          AND (
            (r.user_id IS NOT NULL AND r.user_id = current_user_id())
            OR EXISTS (
              SELECT 1 FROM props p
              WHERE p.id = r.prop_id
                AND p.competition_id IS NOT NULL
                AND is_competition_admin(p.competition_id)
            )
            OR is_current_user_admin()
          )
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM resolutions r
        WHERE r.id = resolution_options.resolution_id
          AND (
            (r.user_id IS NOT NULL AND r.user_id = current_user_id())
            OR EXISTS (
              SELECT 1 FROM props p
              WHERE p.id = r.prop_id
                AND p.competition_id IS NOT NULL
                AND is_competition_admin(p.competition_id)
            )
            OR is_current_user_admin()
          )
      )
    )`.execute(db);

  // ---- views ------------------------------------------------------------
  await db.schema.dropView("v_forecasts").execute();
  await db.schema.dropView("v_props").execute();

  await sql`
    CREATE VIEW v_props WITH (security_barrier, security_invoker) AS
    SELECT categories.id AS category_id, categories.name AS category_name,
      props.id AS prop_id, props.text AS prop_text, props.notes AS prop_notes,
      props.kind AS prop_kind,
      props.user_id AS prop_user_id, props.competition_id,
      props.forecasts_due_date AS prop_forecasts_due_date,
      props.resolution_due_date AS prop_resolution_due_date,
      props.created_by_user_id AS prop_created_by_user_id,
      competitions.name AS competition_name, competitions.is_private AS competition_is_private,
      COALESCE(props.forecasts_due_date, competitions.forecasts_close_date) AS competition_forecasts_close_date,
      COALESCE(props.forecasts_due_date, competitions.forecasts_open_date) AS competition_forecasts_open_date,
      resolutions.id AS resolution_id, resolutions.resolution,
      resolutions.notes AS resolution_notes, resolutions.user_id AS resolution_user_id
    FROM props
      LEFT JOIN categories ON props.category_id = categories.id
      LEFT JOIN resolutions ON props.id = resolutions.prop_id
      LEFT JOIN competitions ON props.competition_id = competitions.id`.execute(
    db,
  );

  // The score is the per-prop Brier score on the 0–1 scale for every kind:
  // binary is (outcome − p)², one_of is half the multi-category Brier, any_of
  // is the mean of the per-option Briers. NULLIF guards the any_of divisor:
  // the subquery matches no rows while the prop is unresolved, and 1.0/0 is a
  // hard error in postgres rather than NULL, which would break every read of
  // this view as soon as an unresolved any_of prop had a forecast.
  await sql`
    CREATE VIEW v_forecasts WITH (security_barrier, security_invoker) AS
    SELECT users.id AS user_id, users.name AS user_name,
      categories.id AS category_id, categories.name AS category_name,
      COALESCE(props.forecasts_due_date, competitions.forecasts_close_date) AS competition_forecasts_close_date,
      COALESCE(props.forecasts_due_date, competitions.forecasts_open_date) AS competition_forecasts_open_date,
      props.id AS prop_id, props.text AS prop_text, props.notes AS prop_notes,
      props.kind AS prop_kind,
      props.user_id AS prop_user_id, props.competition_id,
      props.forecasts_due_date AS prop_forecasts_due_date,
      props.resolution_due_date AS prop_resolution_due_date,
      props.created_by_user_id AS prop_created_by_user_id,
      competitions.name AS competition_name, competitions.is_private AS competition_is_private,
      forecasts.id AS forecast_id, forecasts.forecast,
      forecasts.created_at AS forecast_created_at, forecasts.updated_at AS forecast_updated_at,
      resolutions.id AS resolution_id, resolutions.resolution,
      resolutions.notes AS resolution_notes,
      resolutions.created_at AS resolution_created_at, resolutions.updated_at AS resolution_updated_at,
      resolutions.user_id AS resolution_user_id,
      CASE props.kind
        WHEN 'binary' THEN power(resolutions.resolution::integer::double precision - forecasts.forecast, 2::double precision)
        ELSE (
          SELECT SUM(power(ro.outcome::integer::double precision - fo.probability, 2::double precision))
                 * CASE props.kind WHEN 'one_of' THEN 0.5 ELSE 1.0 / NULLIF(COUNT(*), 0) END
          FROM forecast_options fo
          JOIN resolution_options ro
            ON ro.option_id = fo.option_id AND ro.resolution_id = resolutions.id
          WHERE fo.forecast_id = forecasts.id
        )
      END AS score
    FROM users
      JOIN forecasts ON users.id = forecasts.user_id
      JOIN props ON forecasts.prop_id = props.id
      LEFT JOIN categories ON props.category_id = categories.id
      LEFT JOIN resolutions ON props.id = resolutions.prop_id
      LEFT JOIN competitions ON props.competition_id = competitions.id`.execute(
    db,
  );

  await sql`
    CREATE VIEW v_prop_options WITH (security_barrier, security_invoker) AS
    SELECT po.id AS option_id, po.prop_id, po.text AS option_text, po.position,
           ro.outcome
    FROM prop_options po
    LEFT JOIN resolutions r ON r.prop_id = po.prop_id
    LEFT JOIN resolution_options ro ON ro.resolution_id = r.id AND ro.option_id = po.id`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  // Pre-launch only: the SET NOT NULL restores below fail once any choice
  // forecast or resolution exists, because those rows hold a null header value.
  await db.schema.dropView("v_prop_options").execute();
  await db.schema.dropView("v_forecasts").execute();
  await db.schema.dropView("v_props").execute();

  // Recreate the pre-migration views (verbatim from 1769364811701).
  await sql`
    CREATE VIEW v_props WITH (security_barrier, security_invoker) AS
    SELECT categories.id AS category_id, categories.name AS category_name,
      props.id AS prop_id, props.text AS prop_text, props.notes AS prop_notes,
      props.user_id AS prop_user_id, props.competition_id,
      props.forecasts_due_date AS prop_forecasts_due_date,
      props.resolution_due_date AS prop_resolution_due_date,
      props.created_by_user_id AS prop_created_by_user_id,
      competitions.name AS competition_name, competitions.is_private AS competition_is_private,
      COALESCE(props.forecasts_due_date, competitions.forecasts_close_date) AS competition_forecasts_close_date,
      COALESCE(props.forecasts_due_date, competitions.forecasts_open_date) AS competition_forecasts_open_date,
      resolutions.id AS resolution_id, resolutions.resolution,
      resolutions.notes AS resolution_notes, resolutions.user_id AS resolution_user_id
    FROM props
      LEFT JOIN categories ON props.category_id = categories.id
      LEFT JOIN resolutions ON props.id = resolutions.prop_id
      LEFT JOIN competitions ON props.competition_id = competitions.id`.execute(
    db,
  );

  await sql`
    CREATE VIEW v_forecasts WITH (security_barrier, security_invoker) AS
    SELECT users.id AS user_id, users.name AS user_name,
      categories.id AS category_id, categories.name AS category_name,
      COALESCE(props.forecasts_due_date, competitions.forecasts_close_date) AS competition_forecasts_close_date,
      COALESCE(props.forecasts_due_date, competitions.forecasts_open_date) AS competition_forecasts_open_date,
      props.id AS prop_id, props.text AS prop_text, props.notes AS prop_notes,
      props.user_id AS prop_user_id, props.competition_id,
      props.forecasts_due_date AS prop_forecasts_due_date,
      props.resolution_due_date AS prop_resolution_due_date,
      props.created_by_user_id AS prop_created_by_user_id,
      competitions.name AS competition_name, competitions.is_private AS competition_is_private,
      forecasts.id AS forecast_id, forecasts.forecast,
      forecasts.created_at AS forecast_created_at, forecasts.updated_at AS forecast_updated_at,
      resolutions.id AS resolution_id, resolutions.resolution,
      resolutions.notes AS resolution_notes,
      resolutions.created_at AS resolution_created_at, resolutions.updated_at AS resolution_updated_at,
      resolutions.user_id AS resolution_user_id,
      power(resolutions.resolution::integer::double precision - forecasts.forecast, 2::double precision) AS score
    FROM users
      JOIN forecasts ON users.id = forecasts.user_id
      JOIN props ON forecasts.prop_id = props.id
      LEFT JOIN categories ON props.category_id = categories.id
      LEFT JOIN resolutions ON props.id = resolutions.prop_id
      LEFT JOIN competitions ON props.competition_id = competitions.id`.execute(
    db,
  );

  await sql`DROP TRIGGER enforce_prop_kind_immutable ON props`.execute(db);
  await sql`DROP FUNCTION forbid_prop_kind_change()`.execute(db);
  await sql`DROP TRIGGER enforce_resolution_kind ON resolutions`.execute(db);
  await sql`DROP FUNCTION check_resolution_matches_prop_kind()`.execute(db);
  await sql`DROP TRIGGER enforce_forecast_kind ON forecasts`.execute(db);
  await sql`DROP FUNCTION check_forecast_matches_prop_kind()`.execute(db);
  await sql`DROP FUNCTION prop_kind_of(integer)`.execute(db);

  await sql`DROP TABLE resolution_options`.execute(db);
  await sql`DROP INDEX forecast_options_prop_id_idx`.execute(db);
  await sql`DROP TABLE forecast_options`.execute(db);
  await sql`DROP TABLE prop_options`.execute(db);

  await sql`ALTER TABLE resolutions DROP CONSTRAINT resolutions_id_prop_unique`.execute(
    db,
  );
  await sql`ALTER TABLE resolutions DROP CONSTRAINT resolutions_prop_unique`.execute(
    db,
  );
  // resolved_at is deliberately not restored: production has not had it for a
  // long time, so recreating it (NOT NULL, no default) would break inserts.
  await sql`ALTER TABLE resolutions ALTER COLUMN resolution SET NOT NULL`.execute(
    db,
  );
  await sql`ALTER TABLE forecasts DROP CONSTRAINT forecasts_id_prop_unique`.execute(
    db,
  );
  await sql`ALTER TABLE forecasts ALTER COLUMN forecast SET NOT NULL`.execute(
    db,
  );
  await sql`ALTER TABLE props DROP CONSTRAINT props_kind_check`.execute(db);
  await sql`ALTER TABLE props DROP COLUMN kind`.execute(db);
}
