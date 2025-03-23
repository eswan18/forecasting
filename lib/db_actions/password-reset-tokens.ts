"use server";

import { randomBytes } from "crypto";
import { db } from '@/lib/database';
import { headers } from 'next/headers'
import { sendEmail } from "../email";
import { updateLoginPasswordFromResetToken } from "../auth";

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
    console.log(`Attempted password reset for non-existent user "${username}". No email sent.`);
    return;
  }
  if (!user.login_id) {
    console.log('Attempted password reset for user without login_id:', username);
    return;
  }
  // Create a random token.
  const token = randomBytes(32).toString("hex");
  const initatedTime = new Date();
  const expirationTime = new Date(initatedTime.getTime() + PASSWORD_RESET_TOKEN_LIFESPAN_MINUTES * 60 * 1000);
  const record = { login_id: user.login_id, token, initiated_at: initatedTime, expires_at: expirationTime };
  // Save the token to the database.
  console.log(`Creating password reset token record: ${JSON.stringify(record)}`);
  await db
    .insertInto('password_reset_tokens')
    .values(record)
    .returning('id')
    .executeTakeFirst();
  console.log('Password reset token saved successfully');


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

export async function executePasswordReset({ username, token, password }: { username: string; token: string; password: string }) {
  await updateLoginPasswordFromResetToken({ username, token, password }).then(() => {
    console.log('Password reset successfully');
  }).catch((error) => {
    // Suppress details of errors to avoid leaking information.
    console.error('Error resetting password:', error);
    throw new Error('Error resetting password');
  });
}