/**
 * Script to merge a duplicate user into another user.
 * Updates all references to the old user_id to point to the new user_id,
 * then deletes the old user.
 *
 * Usage:
 *   npx tsx scripts/merge-duplicate-user.ts [env-file]
 *
 * Example:
 *   npx tsx scripts/merge-duplicate-user.ts .env.prod
 */

import dotenv from "dotenv";
import path from "path";
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { Database } from "@/types/db_types";

// Configuration - change these as needed
const OLD_USER_ID = 19;
const NEW_USER_ID = 24;

// Load environment file
const envFile = process.argv[2] || ".env.id-dev";
const envPath = path.resolve(process.cwd(), envFile);
console.log(`Loading environment from: ${envPath}`);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error(`Error loading ${envFile}:`, result.error.message);
  process.exit(1);
}

if (!process.env.ADMIN_DATABASE_URL) {
  console.error("Error: DATABASE_URL must be set");
  process.exit(1);
}

// Initialize database connection
const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new pg.Pool({
      connectionString: process.env.ADMIN_DATABASE_URL,
    }),
  }),
});

async function main() {
  console.log(`\nMerging user ${OLD_USER_ID} into user ${NEW_USER_ID}...\n`);

  // First, verify both users exist
  const oldUser = await db
    .selectFrom("users")
    .selectAll()
    .where("id", "=", OLD_USER_ID)
    .executeTakeFirst();

  const newUser = await db
    .selectFrom("users")
    .selectAll()
    .where("id", "=", NEW_USER_ID)
    .executeTakeFirst();

  if (!oldUser) {
    console.error(`Error: User ${OLD_USER_ID} not found`);
    process.exit(1);
  }

  if (!newUser) {
    console.error(`Error: User ${NEW_USER_ID} not found`);
    process.exit(1);
  }

  console.log(`Old user: ${oldUser.name} (${oldUser.email})`);
  console.log(`New user: ${newUser.name} (${newUser.email})\n`);

  // Update forecasts
  const forecastsResult = await db
    .updateTable("forecasts")
    .set({ user_id: NEW_USER_ID })
    .where("user_id", "=", OLD_USER_ID)
    .executeTakeFirst();
  console.log(`Updated ${forecastsResult.numUpdatedRows} forecasts`);

  // Update props (user_id is the creator)
  const propsResult = await db
    .updateTable("props")
    .set({ user_id: NEW_USER_ID })
    .where("user_id", "=", OLD_USER_ID)
    .executeTakeFirst();
  console.log(`Updated ${propsResult.numUpdatedRows} props`);

  // Update resolutions (user_id is who resolved it)
  const resolutionsResult = await db
    .updateTable("resolutions")
    .set({ user_id: NEW_USER_ID })
    .where("user_id", "=", OLD_USER_ID)
    .executeTakeFirst();
  console.log(`Updated ${resolutionsResult.numUpdatedRows} resolutions`);

  // Update suggested_props
  const suggestedPropsResult = await db
    .updateTable("suggested_props")
    .set({ suggester_user_id: NEW_USER_ID })
    .where("suggester_user_id", "=", OLD_USER_ID)
    .executeTakeFirst();
  console.log(`Updated ${suggestedPropsResult.numUpdatedRows} suggested_props`);

  // Update feature_flags
  const featureFlagsResult = await db
    .updateTable("feature_flags")
    .set({ user_id: NEW_USER_ID })
    .where("user_id", "=", OLD_USER_ID)
    .executeTakeFirst();
  console.log(`Updated ${featureFlagsResult.numUpdatedRows} feature_flags`);

  // Delete the old user
  const deleteUserResult = await db
    .deleteFrom("users")
    .where("id", "=", OLD_USER_ID)
    .executeTakeFirst();
  console.log(`Deleted ${deleteUserResult.numDeletedRows} user(s)`);

  console.log("\n" + "=".repeat(50));
  console.log("Merge complete!");
  console.log("=".repeat(50));

  await db.destroy();
}

main().catch((error) => {
  console.error("Merge failed:", error);
  process.exit(1);
});
