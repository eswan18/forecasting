import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema.createView('v_suggested_props').orReplace().as(
		db.selectFrom('suggested_props')
			.innerJoin('users', 'suggested_props.suggester_user_id', 'users.id')
			.select(['suggested_props.id', 'prop', 'suggester_user_id as user_id', 'users.name', 'users.email'])
	).execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropView('v_suggested_props').ifExists().execute()
}
