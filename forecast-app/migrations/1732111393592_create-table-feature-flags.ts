import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	// The feature_flags table.
	await db.schema
		.createTable('feature_flags')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('user_id', 'integer', (col) => col.references('users.id'))
		.addColumn('enabled', 'boolean', (col) => col.notNull().defaultTo(false))
		.execute()
	// Insert a feature flag for 2025 forecasts, disabled by default.
	await db.insertInto('feature_flags').values([
		{ name: '2025-forecasts', user_id: null, enabled: false },
	]).execute()
	// The v_feature_flags view is feature_flags joined with users.
	await db.schema
		.createView('v_feature_flags').orReplace().as(
			db.selectFrom('feature_flags')
				.leftJoin('users', 'feature_flags.user_id', 'users.id')
				.select([
					'feature_flags.id', 'feature_flags.name', 'feature_flags.user_id', 'feature_flags.enabled',
					'users.name as user_name', 'users.email as user_email',
					'users.login_id as user_login_id', 'users.is_admin as user_is_admin',
				])
		)
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropView('v_feature_flags').ifExists().execute()
	await db.schema.dropTable('feature_flags').execute()
}
