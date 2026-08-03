import { Kysely, PostgresDialect, sql } from "kysely";
import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";

import { MIGRATION_TABLE, readAppliedMigrations, verifyMigrations } from "./check";
import { MIGRATION_MANIFEST } from "./manifest";

const useContainers = process.env.TEST_USE_CONTAINERS === "true";

// tests/helpers/migrator.ts prepends this migration, which does not live in
// `migrations/` — it recreates the pre-migrations baseline schema that the real
// production database already had. So the test database's expected set is the
// manifest plus this one name.
//
// Production cannot pick up a stray row like this: kysely's `Migrator` refuses
// to run ("corrupted migrations") when the migration table holds a name its
// provider doesn't know, so `npm exec kysely migrate up` would have failed long
// before anything reached the database.
const HARNESS_BOOTSTRAP = "00000000_bootstrap";

describe.skipIf(!useContainers)("migration check against a real database", () => {
  const extraConnections: Kysely<unknown>[] = [];

  afterAll(async () => {
    await Promise.all(extraConnections.map((db) => db.destroy()));
  });

  /** A connection to another database on the same test container. */
  function connectTo(databaseName: string): Kysely<unknown> {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    url.pathname = `/${databaseName}`;
    const db = new Kysely<unknown>({
      dialect: new PostgresDialect({
        pool: new Pool({ connectionString: url.toString(), max: 1, ssl: false }),
      }),
    });
    extraConnections.push(db);
    return db;
  }

  async function testDb() {
    const { getTestDb } = await import("@/tests/helpers/testDatabase");
    return (await getTestDb()) as unknown as Kysely<unknown>;
  }

  it("records applied migrations in a table named kysely_migration", async () => {
    // Confirms the table name against a live database rather than trusting
    // kysely's documented default: if kysely ever changed it, or if the
    // constant were wrong, every comparison below would silently pass against
    // a read that never returns anything. The literal is spelled out here on
    // purpose so this fails if MIGRATION_TABLE is edited.
    const db = await testDb();

    const tables = await sql<{ table_name: string }>`
      select table_name from information_schema.tables
      where table_schema = 'public' and table_name = 'kysely_migration'
    `.execute(db);

    expect(tables.rows.map((row) => row.table_name)).toEqual([
      "kysely_migration",
    ]);
    expect(MIGRATION_TABLE).toBe("kysely_migration");
    expect((await readAppliedMigrations(db)).length).toBeGreaterThan(0);
  });

  it("stores exactly the manifest's names, plus the harness bootstrap", async () => {
    // The end-to-end proof that the manifest is in kysely's own vocabulary:
    // these rows were written by a real `Migrator` run over `migrations/`.
    const db = await testDb();

    const applied = await readAppliedMigrations(db);

    expect(applied).toEqual([HARNESS_BOOTSTRAP, ...MIGRATION_MANIFEST].sort());
  });

  it("passes on a fully migrated database", async () => {
    const db = await testDb();

    const result = await verifyMigrations(db, [
      HARNESS_BOOTSTRAP,
      ...MIGRATION_MANIFEST,
    ]);

    expect(result).toEqual({ ok: true });
  });

  it("fails on a real database that is behind the build", async () => {
    const db = await testDb();

    const result = await verifyMigrations(db, [
      HARNESS_BOOTSTRAP,
      ...MIGRATION_MANIFEST,
      "9999999999999_a-migration-this-database-has-never-seen",
    ]);

    expect(result.ok).toBe(false);
    const message = result.ok ? "" : result.message;
    expect(message).toContain("behind this build");
    expect(message).toContain(
      "9999999999999_a-migration-this-database-has-never-seen",
    );
  });

  it("fails on a real database that is ahead of the build", async () => {
    const db = await testDb();

    const result = await verifyMigrations(db, MIGRATION_MANIFEST.slice(0, -1));

    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.message).toContain("ahead of this build");
  });

  it(`fails with a usable error when ${MIGRATION_TABLE} does not exist`, async () => {
    // The container's maintenance database has never been migrated — the same
    // shape as a brand-new Neon branch that nobody has run migrations against.
    const db = connectTo("postgres");

    const result = await verifyMigrations(db);

    expect(result.ok).toBe(false);
    const message = result.ok ? "" : result.message;
    expect(message).toContain(MIGRATION_TABLE);
    expect(message).toContain("npm exec kysely migrate up");
  });
});
