"use server";

import { getUserFromCookies } from "../get-user";
import { randomBytes } from "crypto";
import { db } from '@/lib/database';


export async function generateInviteToken({ notes }: { notes?: string }) {
  const user = await getUserFromCookies();
  if (!user?.is_admin) {
    throw new Error('Unauthorized');
  }
  // Create the token.
  const token = randomBytes(16).toString("hex");
  // Save it to the db.
  await db
    .insertInto('invite_tokens')
    .values({ token, created_at: new Date, notes })
    .execute();
  return token;
}

export async function inviteTokenIsValid(token: string) {
  const invite = await db
    .selectFrom('invite_tokens')
    .selectAll()
    .where('token', '=', token)
    .executeTakeFirst();
  if (invite === undefined) {
    console.log('Invite token does not exist.');
    return false;
  };
  if (invite.used_at !== null) {
    console.log('Invite token has already been used.');
    return false;
  }
  return true;
}

export async function consumeInviteToken(token: string) {
  const invite = await db
    .updateTable('invite_tokens')
    .where('token', '=', token)
    .set({ used_at: new Date })
    .returning('token')
    .execute();
  if (!invite) {
    throw new Error('Invalid invite token.');
  }
}