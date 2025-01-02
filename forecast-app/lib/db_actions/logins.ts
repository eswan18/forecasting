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

type UpdateLoginResponseSuccess = {
  success: true;
}
type UpdateLoginResponseError = {
  success: false;
  error: string;
}
export type UpdateLoginResponse = UpdateLoginResponseSuccess | UpdateLoginResponseError;

export async function updateLogin({ id, login }: { id: number, login: LoginUpdate }): Promise<UpdateLoginResponse> {
  // Check that the user is who they say they are.
  const currentUser = await getUserFromCookies();
  if (!currentUser || currentUser.login_id !== id) {
    console.log(`Attempted to update login_id ${id} without permission`);
    return { success: false, error: 'Unauthorized' };
  }
  // Users can only change their username with this function.
  // If they try to change anything else, throw an error.
  if (Object.keys(login).some(key => !['username'].includes(key))) {
    console.log(`Attempted to update a field other than "username" for login_id ${id}`);
    return { success: false, error: 'Not authorized to update login fields other than "username"' };
  }
  await db
    .updateTable('logins')
    .set(login)
    .where('id', '=', id)
    .execute();
  console.log(`Updated login_id ${id} with new value ${JSON.stringify(login)}`);
  return { success: true };
}

