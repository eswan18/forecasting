"use server";

import { db } from '@/lib/database';
import { sql } from 'kysely';
import { getUserFromCookies } from '../get-user';
import { NewFeatureFlag } from '@/types/db_types';
import { revalidatePath } from 'next/cache';

export async function hasFeatureEnabled({ featureName, userId }: { featureName: string, userId: number }): Promise<boolean> {
  // Make sure the user is who they say they are.
  const user = await getUserFromCookies();
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized');
  }
  const { enabled } = await db
    .selectFrom('feature_flags')
    .select('enabled')
    .where('name', '=', featureName)
    .where((eb) => eb('user_id', '=', userId).or('user_id', 'is', null))
    // By putting nulls last, we allow a blanket toggle for all users to be overriden by a specific user's setting.
    .orderBy(sql`user_id nulls last`)
    .executeTakeFirstOrThrow();
  return enabled;
}

export async function getFeatureFlags() {
  // Only allow admins to view all feature flags.
  const user = await getUserFromCookies();
  if (!user?.is_admin) {
    throw new Error('Unauthorized: only admins can get all feature flags');
  }
  return await db.selectFrom('v_feature_flags').selectAll().execute();
}

export async function createFeatureFlag({ featureFlag }: { featureFlag: NewFeatureFlag }) {
  const user = await getUserFromCookies();
  if (!user?.is_admin) {
    throw new Error('Unauthorized: only admins can create feature flags');
  }
  const { id } = await db
    .insertInto('feature_flags')
    .values(featureFlag)
    .returning('id')
    .executeTakeFirstOrThrow();
  revalidatePath('/feature-flags');
  return id;
}

export async function updateFeatureFlag({ id, enabled }: { id: number, enabled: boolean }) {
  const user = await getUserFromCookies();
  if (!user?.is_admin) {
    throw new Error('Unauthorized: only admins can update feature flags');
  }
  await db
    .updateTable('feature_flags')
    .set('enabled', enabled)
    .where('id', '=', id)
    .execute();
  revalidatePath('/feature-flags');
}