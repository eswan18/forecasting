import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.dropView("v_competition_members").execute();

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
      u.username AS user_username,
      u.picture_url AS user_picture_url
    FROM competition_members cm
      JOIN competitions c ON cm.competition_id = c.id
      JOIN users u ON cm.user_id = u.id;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropView("v_competition_members").execute();

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
