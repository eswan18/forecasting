import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable('feature_flags')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('name', 'text', (col) => col.notNull().unique())
		.addColumn('user_id', 'integer', (col) => col.notNull().references('users.id'))
		.addColumn('enabled', 'boolean', (col) => col.notNull().defaultTo(false))
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	db.schema.dropTable('feature_flags').execute()
}
