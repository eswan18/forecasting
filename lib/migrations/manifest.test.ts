import { promises as fs } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  MANIFEST_PATH,
  readMigrationNames,
  renderManifest,
} from "@/scripts/generate-migration-manifest";

import { MIGRATION_MANIFEST } from "./manifest";

describe("migration manifest", () => {
  it("is byte-for-byte what the generator produces from migrations/", async () => {
    // The manifest is committed rather than built, so this is what keeps it
    // from drifting: regenerate it from the real directory and compare. If it
    // fails, run `npx tsx scripts/generate-migration-manifest.ts`.
    const onDisk = await fs.readFile(MANIFEST_PATH, "utf8");
    const regenerated = renderManifest(await readMigrationNames());

    expect(onDisk).toBe(regenerated);
  });

  it("exports exactly the migration names in migrations/", async () => {
    // Independent of the rendering above: whatever the file text looks like,
    // the value the startup check reads has to be the real migration list.
    expect([...MIGRATION_MANIFEST]).toEqual(await readMigrationNames());
  });

  it("is non-empty and sorted, with no duplicates", () => {
    expect(MIGRATION_MANIFEST.length).toBeGreaterThan(0);
    expect([...MIGRATION_MANIFEST]).toEqual([...MIGRATION_MANIFEST].sort());
    expect(new Set(MIGRATION_MANIFEST).size).toBe(MIGRATION_MANIFEST.length);
  });

  it("holds migration names, not filenames", () => {
    // kysely records the filename minus its extension; a manifest full of
    // `.ts` names would never match the database.
    for (const name of MIGRATION_MANIFEST) {
      expect(name.endsWith(".ts")).toBe(false);
    }
  });
});
