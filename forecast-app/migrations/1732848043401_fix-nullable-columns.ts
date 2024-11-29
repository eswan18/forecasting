import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	// Columns to switch from nullable to non-nullable
	// users:
	// - name, character varying
	// - is_admin, boolean
	// logins:
	// - is_salted, boolean
	// categories:
	// - name, character varying
	// forecasts:
	// - prop_id, integer
	// - user_id, integer
	// - forecast, double precision
	// props:
	// - category_id, integer
	// - text, character varying
	// - year, integer
	// resolutions:
	// - prop_id, integer
	// - resolution, boolean
	await db.schema.alterTable('users')
		.alterColumn('name', (ac) => ac.setNotNull())
		.alterColumn('is_admin', (ac) => ac.setNotNull())
		.execute()
	await db.schema.alterTable('logins')
		.alterColumn('is_salted', (ac) => ac.setNotNull())
		.execute()
	await db.schema.alterTable('categories')
		.alterColumn('name', (ac) => ac.setNotNull())
		.execute()
	await db.schema.alterTable('forecasts')
		.alterColumn('prop_id', (ac) => ac.setNotNull())
		.alterColumn('user_id', (ac) => ac.setNotNull())
		.alterColumn('forecast', (ac) => ac.setNotNull())
		.execute()
	await db.schema.alterTable('props')
		.alterColumn('category_id', (ac) => ac.setNotNull())
		.alterColumn('text', (ac) => ac.setNotNull())
		.alterColumn('year', (ac) => ac.setNotNull())
		.execute()
	await db.schema.alterTable('resolutions')
		.alterColumn('prop_id', (ac) => ac.setNotNull())
		.alterColumn('resolution', (ac) => ac.setNotNull())
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.alterTable('resolutions')
		.alterColumn('prop_id', (ac) => ac.dropNotNull())
		.alterColumn('resolution', (ac) => ac.dropNotNull())
		.execute()
	await db.schema.alterTable('props')
		.alterColumn('category_id', (ac) => ac.dropNotNull())
		.alterColumn('text', (ac) => ac.dropNotNull())
		.alterColumn('year', (ac) => ac.dropNotNull())
		.execute()
	await db.schema.alterTable('forecasts')
		.alterColumn('prop_id', (ac) => ac.dropNotNull())
		.alterColumn('user_id', (ac) => ac.dropNotNull())
		.alterColumn('forecast', (ac) => ac.dropNotNull())
		.execute()
	await db.schema.alterTable('categories')
		.alterColumn('name', (ac) => ac.dropNotNull())
		.execute()
	await db.schema.alterTable('logins')
		.alterColumn('is_salted', (ac) => ac.dropNotNull())
		.execute()
	await db.schema.alterTable('users')
		.alterColumn('name', (ac) => ac.dropNotNull())
		.alterColumn('is_admin', (ac) => ac.dropNotNull())
		.execute()
}
