import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const viewsToUpdate = ['v_feature_flags', 'v_password_reset_tokens', 'v_suggested_props', 'v_users']

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
	for (const view of viewsToUpdate) {
		await sql<void>`ALTER VIEW ${sql.id(view)} SET (security_barrier = true, security_invoker = true)`.execute(db);
	}
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
	for (const view of viewsToUpdate) {
		await sql<void>`ALTER VIEW ${sql.id(view)} RESET (security_barrier, security_invoker)`.execute(db);
	}
}
