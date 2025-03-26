import type { Kysely } from 'kysely'

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
	await db
		.insertInto('feature_flags')
		.values({ name: 'personal-props', user_id: 1, enabled: true })
		.execute()
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
	await db
		.deleteFrom('feature_flags')
		.where('name', '=', 'personal-props')
		.execute()
}
