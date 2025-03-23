import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema.createView('v_suggested_props').orReplace().as(
		db.selectFrom('suggested_props')
			.innerJoin('v_users', 'suggested_props.suggester_user_id', 'v_users.id')
			.select([
				'suggested_props.id', 'prop as prop_text', 'suggester_user_id as user_id', 'login_id as user_login_id',
				'name as user_name', 'email as user_email', 'username as user_username',
			])
	).execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropView('v_suggested_props').ifExists().execute()
}
