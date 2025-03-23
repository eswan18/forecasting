"use server";

import argon2 from 'argon2';
import { db } from '@/lib/database';
const SALT = process.env.ARGON2_SALT;

type UpdateLoginPasswordResponseSuccess = {
  success: true;
};
type UpdateLoginPasswordResponseError = {
  success: false;
  error: string;
};
export type UpdateLoginPasswordResponse = UpdateLoginPasswordResponseSuccess | UpdateLoginPasswordResponseError

export async function updateLoginPassword({ id, currentPassword, newPassword }: { id: number, currentPassword: string, newPassword: string }): Promise<UpdateLoginPasswordResponse> {
  // Validate the current password.
  const login = await db
    .selectFrom('logins')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
  const isValid = await argon2.verify(login.password_hash, SALT + currentPassword);
  if (!isValid) {
    console.log(`Attempted password update for login_id ${id} with invalid current password`);
    return { success: false, error: 'Incorrect current password' };
  }
  // Update the password.
  const newHash = await argon2.hash(SALT + newPassword, { type: argon2.argon2id });
  await db
    .updateTable('logins')
    .set({ password_hash: newHash })
    .where('id', '=', id)
    .execute();
  return { success: true };
}

export async function updateLoginPasswordFromResetToken({ username, token, password }: { username: string, token: string, password: string }) {
  // Get the login_id for the user.
  const user = await db
    .selectFrom('v_users')
    .selectAll()
    .where('username', '=', username)
    .executeTakeFirst();
  if (!user) throw new Error('Attempted password reset for non-existent user');
  if (!user.login_id) throw new Error('Attempted password reset for user without login_id');
  // Validate the token.
  const tokenRecord = await db
    .selectFrom('password_reset_tokens')
    .selectAll()
    .where('login_id', '=', user.login_id)
    .where('token', '=', token)
    .executeTakeFirst();
  if (!tokenRecord) throw new Error('Attempted password reset with invalid token');
  if (tokenRecord.expires_at < new Date()) throw new Error('Attempted password reset with expired token');
  // Update the password.
  const newHash = await argon2.hash(SALT + password, { type: argon2.argon2id });
  await db
    .updateTable('logins')
    .set({ password_hash: newHash })
    .where('id', '=', user.login_id)
    .execute();
  // Delete the now-used token.
  await db
    .deleteFrom('password_reset_tokens')
    .where('id', '=', tokenRecord.id)
    .execute();
}