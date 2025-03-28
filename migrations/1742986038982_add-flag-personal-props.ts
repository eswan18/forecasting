import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db
		.insertInto('feature_flags')
		.values({ name: 'personal-props', user_id: 1, enabled: true })
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db
		.deleteFrom('feature_flags')
		.where('name', '=', 'personal-props')
		.execute()
}
