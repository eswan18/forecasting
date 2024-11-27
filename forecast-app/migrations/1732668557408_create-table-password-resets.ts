import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable('password_resets')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('login_id', 'integer', (col) => col.notNull().references('logins.id'))
		.addColumn('token', 'text', (col) => col.notNull())
		.addColumn('initiated_at', 'timestamp', (col) => col.notNull())
		.addColumn('expires_at', 'timestamp', (col) => col.notNull())
		.execute()
	// The v_password_resets view is password_resets joined with logins.
	await db.schema
		.createView('v_password_resets').as(
			db.selectFrom('password_resets')
				.innerJoin('logins', 'password_resets.login_id', 'logins.id')
				.select([
					'password_resets.id', 'password_resets.login_id', 'password_resets.token',
					'password_resets.initiated_at', 'password_resets.expires_at', 'logins.username',
				])
		)
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropView('v_password_resets').execute()
	await db.schema.dropTable('password_resets').execute()
}
