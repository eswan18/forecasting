'use server';

import { NewSuggestedProp } from '@/types/db_types';
import { db } from '@/lib/database';
import { getUserFromCookies } from '@/lib/get-user';

export async function getSuggestedProps() {
  const user = await getUserFromCookies();
  if (!user?.is_admin) {
    throw new Error('Unauthorized: only admins can view suggested props');
  }
  return db.selectFrom('v_suggested_props').selectAll().execute();
}

export async function createSuggestedProp({ prop }: { prop: NewSuggestedProp }) {
  const user = await getUserFromCookies();
  if (!user) {
    throw new Error('Unauthorized');
  }
  // Make sure the user is suggesting a prop with their own user ID.
  if (prop.suggester_user_id !== user.id) {
    throw new Error('Unauthorized');
  }
  const { id } = await db
    .insertInto('suggested_props')
    .values(prop)
    .returning('id')
    .executeTakeFirstOrThrow();
  return id;
}