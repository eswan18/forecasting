import type { Kysely } from 'kysely'
import { sql } from 'kysely';

// This is all first-class entities in the DB. It excludes invite_tokens and
// password_reset_tokens, since those are strictly created once and are consumed on use.
const TABLES = [
	"categories", "competitions", "feature_flags", "forecasts", "logins", "props",
	"resolutions", "suggested_props", "users",
]

export async function up(db: Kysely<any>): Promise<void> {
	// Create a function we can use as a trigger to set the updated_at column on every update.
	await sql<void>`
		CREATE OR REPLACE FUNCTION set_updated_at()
		RETURNS TRIGGER AS $$
		BEGIN
			NEW.updated_at = now();
			RETURN NEW;
		END;
		$$ LANGUAGE plpgsql;
	`.execute(db);

	for (const table of TABLES) {
		// Create the updated_at and created_at columns.
		await db.schema.alterTable(table)
			.addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
			.addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
			.execute();
		// Add a trigger to set the updated_at column on every update.
		await sql<void>`
			CREATE TRIGGER set_updated_at
			BEFORE INSERT OR UPDATE ON ${sql.id(table)}
			FOR EACH ROW
			EXECUTE FUNCTION set_updated_at();
		`.execute(db);
	}
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
	for (const table of TABLES) {
		// Drop the new columns.
		await db.schema.alterTable(table)
			.dropColumn('created_at')
			.dropColumn('updated_at')
			.execute();
		// Drop the trigger.
		await sql<void>`
			DROP TRIGGER set_updated_at ON ${sql.id(table)};
		`.execute(db);
	}
	// Drop the function.
	await sql<void>`
		DROP FUNCTION set_updated_at();
	`.execute(db);
}
