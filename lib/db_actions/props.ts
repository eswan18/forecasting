"use server";
import { getUserFromCookies } from "../get-user";
import { revalidatePath } from "next/cache";
import { db } from '@/lib/database';
import { VProp, PropUpdate, NewProp } from "@/types/db_types";
import { sql } from 'kysely';

export async function getProps({ year }: { year?: number | number[] }): Promise<VProp[]> {
  const user = await getUserFromCookies();
  return db.transaction().execute(async (trx) => {
    await trx.executeQuery(sql`SELECT set_config('app.current_user_id', ${user?.id}, true);`.compile(db));
    let query = trx.selectFrom('v_props').orderBy('prop_id asc').selectAll();
    if (year) {
      const yearClause = Array.isArray(year) ? year : [year];
      query = query.where('year', 'in', yearClause);
    }
    return await query.execute();
  });
}

export async function resolveProp(
  { propId, resolution, notes, overwrite = false }:
    { propId: number, resolution: boolean, notes?: string, overwrite?: boolean }
): Promise<void> {
  // Verify the user is an admin
  const user = await getUserFromCookies();
  if (!user || !user.is_admin) {
    throw new Error('Unauthorized');
  }

  // first check that this prop doesn't already have a resolution
  const existingResolution = await db
    .selectFrom('resolutions')
    .where('prop_id', '=', propId)
    .select('resolution')
    .executeTakeFirst();
  if (!!existingResolution && !overwrite) {
    throw new Error(`Proposition ${propId} already has a resolution`);
  }

  if (existingResolution) {
    // Update the existing record.
    await db
      .updateTable('resolutions')
      .set({ resolution, notes })
      .where('prop_id', '=', propId)
      .execute();
  } else {
    // Insert a new record.
    await db.insertInto('resolutions').values({ prop_id: propId, resolution, notes }).execute();
  }
  revalidatePath('/props');
}

export async function unresolveProp({ propId }: { propId: number }): Promise<void> {
  // Verify the user is an admin
  const user = await getUserFromCookies();
  if (!user || !user.is_admin) {
    throw new Error('Unauthorized');
  }

  await db.deleteFrom('resolutions').where('prop_id', '=', propId).execute();
  revalidatePath('/props');
}

export async function getPropYears(): Promise<number[]> {
  const rows = await db.selectFrom('v_props').select('year').distinct().orderBy('year', 'desc').execute();
  return rows.map(row => row.year);
}

export async function updateProp({ id, prop }: { id: number, prop: PropUpdate }) {
  // Check that the user is an admin.
  const currentUser = await getUserFromCookies();
  if (!currentUser || !currentUser.is_admin) {
    throw new Error('Unauthorized: only admins can update props');
  }
  await db
    .updateTable('props')
    .set(prop)
    .where('id', '=', id)
    .execute();
  revalidatePath('/props');
}

export async function createProp({ prop }: { prop: NewProp }) {
  // Check that the user is an admin.
  const currentUser = await getUserFromCookies();
  if (!currentUser || !currentUser.is_admin) {
    throw new Error('Unauthorized: only admins can create props');
  }
  await db
    .insertInto('props')
    .values(prop)
    .execute();
  revalidatePath('/props');
}