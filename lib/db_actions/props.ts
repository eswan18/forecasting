"use server";
import { getUserFromCookies } from "../get-user";
import { revalidatePath } from "next/cache";
import { db } from '@/lib/database';
import { VProp, PropUpdate, NewProp, NewResolution } from "@/types/db_types";
import { sql } from 'kysely';

export async function getProps(
  { competitionId, userId }:
    { competitionId?: (number | null)[] | number | null, userId?: (number | null)[] | number | null }
): Promise<VProp[]> {
  // Clients can pass a single user ID (or null) or a single competition ID (or null) or
  // an array of IDs.
  // Standardize the input to an array of IDs.
  if (typeof userId === 'number') {
    userId = [userId];
  } else if (userId === null) {
    userId = [null];
  }
  if (typeof competitionId === 'number') {
    competitionId = [competitionId];
  } else if (competitionId === null) {
    competitionId = [null];
  }

  // Build and execute the query.
  const user = await getUserFromCookies();
  return db.transaction().execute(async (trx) => {
    await trx.executeQuery(sql`SELECT set_config('app.current_user_id', ${user?.id}, true);`.compile(db));
    let query = trx.selectFrom('v_props').orderBy('prop_id asc').selectAll();

    if (competitionId !== undefined) {
      // Add filters for competitions, if requested.
      const nonNullCompetitionIds = competitionId ? competitionId.filter(id => id !== null) : [];
      query = query.where((eb) => {
        const ors = [];
        if (nonNullCompetitionIds.length > 0) {
          ors.push(eb('competition_id', 'in', nonNullCompetitionIds));
        }
        if (competitionId && competitionId.find(id => id === null) !== undefined) {
          // If null is in the array, include rows where competition_id is null.
          ors.push(eb('competition_id', 'is', null));
        }
        return eb.or(ors);
      });
    }

    if (userId !== undefined) {
      // Add filters for users, if requested.
      const nonNullUserIds = userId ? userId.filter(id => id !== null) : [];
      query = query.where((eb) => {
        const ors = [];
        if (nonNullUserIds.length > 0) {
          ors.push(eb('prop_user_id', 'in', nonNullUserIds));
        }
        if (userId && userId.find(id => id === null) !== undefined) {
          // If null is in the array, we want to include public props (where prop_user_id is null).
          ors.push(eb('prop_user_id', 'is', null));
        }
        return eb.or(ors);
      });
    }
    return await query.execute();
  });
}

export async function resolveProp(
  { propId, resolution, notes, userId, overwrite = false }:
    { propId: number, resolution: boolean, notes?: string, userId: number | null, overwrite?: boolean }
): Promise<void> {
  const user = await getUserFromCookies();
  await db.transaction().execute(async (trx) => {
    await trx.executeQuery(sql`SELECT set_config('app.current_user_id', ${user?.id}, true);`.compile(db));

    // first check that this prop doesn't already have a resolution
    const existingResolution = await trx
      .selectFrom('resolutions')
      .where('prop_id', '=', propId)
      .select('resolution')
      .executeTakeFirst();
    if (!!existingResolution && !overwrite) {
      throw new Error(`Proposition ${propId} already has a resolution`);
    }

    if (existingResolution) {
      // Update the existing record.
      await trx
        .updateTable('resolutions')
        .set({ resolution, notes })
        .where('prop_id', '=', propId)
        .execute();
    } else {
      // Insert a new record.
      const record: NewResolution = { prop_id: propId, resolution, user_id: userId, notes }
      await trx.insertInto('resolutions').values(record).execute();
    }
  });
  revalidatePath('/props');
}

export async function unresolveProp({ propId }: { propId: number }): Promise<void> {
  const user = await getUserFromCookies();
  await db.transaction().execute(async (trx) => {
    await trx.executeQuery(sql`SELECT set_config('app.current_user_id', ${user?.id}, true);`.compile(db));
    await trx.deleteFrom('resolutions').where('prop_id', '=', propId).execute();
  });
  revalidatePath('/props');
}

export async function updateProp({ id, prop }: { id: number, prop: PropUpdate }) {
  const user = await getUserFromCookies();
  await db.transaction().execute(async (trx) => {
    await trx.executeQuery(sql`SELECT set_config('app.current_user_id', ${user?.id}, true);`.compile(db));
    await trx
      .updateTable('props')
      .set(prop)
      .where('id', '=', id)
      .execute();
  }
  );
  revalidatePath('/props');
}

export async function createProp({ prop }: { prop: NewProp }) {
  const user = await getUserFromCookies();
  await db.transaction().execute(async (trx) => {
    await trx.executeQuery(sql`SELECT set_config('app.current_user_id', ${user?.id}, true);`.compile(db));
    await trx
      .insertInto('props')
      .values(prop)
      .execute();
  });
  revalidatePath('/props');
}