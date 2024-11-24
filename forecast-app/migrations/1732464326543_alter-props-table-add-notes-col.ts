import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('props')
		.addColumn('notes', 'text')
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('props')
		.dropColumn('notes')
		.execute()
}
