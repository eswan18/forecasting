"use server";

import { randomBytes } from "crypto";
import { db } from '@/lib/database';
import { getLoginByUsername } from "./logins";
import { headers } from 'next/headers'
import { sendEmail } from "../email";

const PASSWORD_RESET_TOKEN_LIFESPAN_MINUTES = 15;

export async function initiatePasswordReset({ username }: { username: string }) {
  // We need the hostname in order to build the password reset link.
  const headerValues = await headers();
  const host = headerValues.get('host');
  if (!host) {
    throw new Error('Host header is missing');
  }
  // Get the login_id for the user.
  const user = await db.selectFrom('v_users').selectAll().where('username', '=', username).executeTakeFirst();
  // Return silently if the user doesn't exist to avoid leaking information.
  if (!user) {
    console.log('Attempted password reset for non-existent user:', username);
    return;
  }
  if (!user.login_id) {
    console.log('Attempted password reset for user without login_id:', username);
    return;
  }
  // Create a random token.
  const token = randomBytes(32).toString("hex");
  const initatedTime = new Date();
  console.log('initiatedTime:', initatedTime);
  const expirationTime = new Date(initatedTime.getTime() + PASSWORD_RESET_TOKEN_LIFESPAN_MINUTES * 60 * 1000);
  // Save the token to the database.
  await db
    .insertInto('password_reset_tokens')
    .values({ login_id: user.login_id, token, initiated_at: initatedTime, expires_at: expirationTime })
    .returning('id')
    .executeTakeFirst();


  // Send an email with the reset link.
  let link = `${host}/reset-password?username=${username}&token=${token}`;
  if (!link.startsWith('http')) {
    if (link.startsWith('localhost')) {
      link = `http://${link}`;
    } else {
      link = `https://${link}`;
    }
  }
  await sendEmail({
    to: user.email,
    subject: 'Forecasting: Password Reset Link',
    text: `Click here to reset your password: ${link}`,
    html: `Click <a href="${link}">here</a> to reset your password.`,
  });
}