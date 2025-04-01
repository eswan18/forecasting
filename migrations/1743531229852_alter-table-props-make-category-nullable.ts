import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema.alterTable('props')
		.alterColumn('category_id', (ac) => ac.dropNotNull())
		.execute()
	// Even though we're allowing props without categories, we don't want that to be
	// allowed for public props, at least for now. So we add a check to mandate that props
	// without a `user_id` must have a `category_id`.
	await db.schema
		.alterTable('props')
		.addCheckConstraint(
			'at_least_one_of_user_id_and_category_id',
			sql<boolean>`user_id IS NOT NULL OR category_id IS NOT NULL`,
		)
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	// Drop the constraint.
	await db.schema
		.alterTable('props')
		.dropConstraint('at_least_one_of_user_id_and_category_id')
		.execute();
	// Re-enforce non-nullability on the column.
	await db.schema.alterTable('props')
		.alterColumn('category_id', (ac) => ac.setNotNull())
		.execute();
}