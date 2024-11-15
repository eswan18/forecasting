"use server";

import { db } from '@/lib/database';
import { Login, NewLogin, LoginUpdate } from '@/types/db_types';
import { getUserFromCookies } from '@/lib/get-user';

export async function getLoginByUsername(username: string): Promise<Login | undefined> {
  return await db
    .selectFrom('logins')
    .selectAll()
    .where('username', '=', username)
    .executeTakeFirst();
}

export async function createLogin({ login }: { login: NewLogin }): Promise<number> {
  const { id } = await db
    .insertInto('logins')
    .values(login)
    .returning('id')
    .executeTakeFirstOrThrow();
  return id;
}

export async function updateLogin({ id, login }: { id: number, login: LoginUpdate }) {
  // Check that the user is who they say they are.
  const currentUser = await getUserFromCookies();
  if (!currentUser || currentUser.login_id !== id) {
    throw new Error('Unauthorized');
  }
  // Users can only change their username with this function.
  // If they try to change anything else, throw an error.
  if (Object.keys(login).some(key => !['username'].includes(key))) {
    throw new Error('Unauthorized');
  }
  await db
    .updateTable('logins')
    .set(login)
    .where('id', '=', id)
    .execute();
}

