// migrator.ts
import {
  Kysely,
  Migrator,
  type Migration,
  type MigrationProvider,
} from "kysely";
import { FileMigrationProvider } from "kysely";
import * as path from "path";
import { promises as fs } from "fs";

// Custom provider that prepends one bootstrap migration.
class BootstrapThenFilesProvider implements MigrationProvider {
  constructor(
    private readonly bootstrap: {
      name: string;
      loader: () => Promise<Migration>;
    },
    private readonly migrationFolder: string,
  ) {}

  async getMigrations() {
    // Load the normal file-based migrations.
    const fileProvider = new FileMigrationProvider({
      fs,
      path,
      migrationFolder: this.migrationFolder,
    });

    const files = await fileProvider.getMigrations();

    // Load the bootstrap migration and merge it in.
    const bootstrapMigration = await this.bootstrap.loader();

    // Return a single object; Migrator will sort by key (name).
    return {
      [this.bootstrap.name]: bootstrapMigration,
      ...files,
    };
  }
}

// --- usage ---
export function createMigrator(db: Kysely<any>) {
  const provider = new BootstrapThenFilesProvider(
    {
      name: "00000000_bootstrap", // ensure it sorts first
      loader: async () => {
        // Your bootstrap file can live anywhere outside migrations/
        // It should export { up, down } that match Kysely’s Migration.
        const mod = await import("./000000000000_create-initial-schema");
        // If you exported default, use mod.default
        return mod as unknown as Migration;
      },
    },
    path.join(process.cwd(), "migrations"), // your normal folder
  );

  return new Migrator({ db, provider });
}
