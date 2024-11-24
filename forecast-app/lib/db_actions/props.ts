"use server";
import { getUserFromCookies } from "../get-user";
import { revalidatePath } from "next/cache";
import { db } from '@/lib/database';
import { VProp, PropUpdate, NewProp } from "@/types/db_types";

export async function getProps({ year }: { year?: number | number[] }): Promise<VProp[]> {
  let query = db.selectFrom('v_props').selectAll();
  if (year) {
    const yearClause = Array.isArray(year) ? year : [year];
    query = query.where('year', 'in', yearClause);
  }
  return await query.execute();
}

export async function resolveProp({ propId, resolution }: { propId: number, resolution: boolean }): Promise<void> {
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
  if (!!existingResolution) {
    throw new Error(`Proposition ${propId} already has a resolution`);
  }

  await db.insertInto('resolutions').values({ prop_id: propId, resolution }).execute();
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
