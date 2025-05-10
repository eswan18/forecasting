'use server';

import { OrderByExpression, OrderByModifiers } from 'kysely';
import { db } from '@/lib/database';
import { VUser, NewUser, UserUpdate, Database } from '@/types/db_types';
import { getUserFromCookies } from '@/lib/get-user';

type Sort = {
  expr: OrderByExpression<Database, 'v_users', VUser>,
  modifiers?: OrderByModifiers
}

export async function getUsers({ sort }: { sort?: Sort } = {}): Promise<VUser[]> {
  const user = await getUserFromCookies();
  if (!user) {
    throw new Error('Unauthorized');
  }
  let query = db.selectFrom('v_users').selectAll();
  if (sort) {
    query = query.orderBy(sort.expr, sort.modifiers);
  }
  return await query.execute();
}

export async function getUserById(id: number): Promise<VUser | undefined> {
  const user = await getUserFromCookies();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return await db
    .selectFrom('v_users')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
}

export async function createUser({ user }: { user: NewUser }) {
  const { id } = await db
    .insertInto('users')
    .values(user)
    .returning('id')
    .executeTakeFirstOrThrow();
  return id;
}

export async function updateUser({ id, user }: { id: number, user: UserUpdate }) {
  // Check that the user is who they say they are.
  const currentUser = await getUserFromCookies();
  if (!currentUser || currentUser.id !== id) {
    throw new Error('Unauthorized');
  }
  // Users can only change a couple of fields: name and email.
  // If they try to change anything else, throw an error.
  if (Object.keys(user).some(key => !['name', 'email'].includes(key))) {
    throw new Error('Unauthorized');
  }
  await db
    .updateTable('users')
    .set(user)
    .where('id', '=', id)
    .execute();
}