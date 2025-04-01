import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema.alterTable('props')
		.alterColumn('category_id', (ac) => ac.dropNotNull())
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.alterTable('props')
		.alterColumn('category_id', (ac) => ac.setNotNull())
		.execute()
}