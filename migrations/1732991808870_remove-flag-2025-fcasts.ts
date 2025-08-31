import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Remove the feature flag for 2025-forecasts now that it's been fully released.
  await db
    .deleteFrom("feature_flags")
    .where("name", "=", "2025-forecasts")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db
    .insertInto("feature_flags")
    .values({ name: "2025-forecasts", user_id: null, enabled: true })
    .execute();
}
