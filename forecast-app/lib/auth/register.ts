"use server";

import argon2 from 'argon2';
import { createLogin, createUser, getLoginByUsername } from '@/lib/db_actions';
import * as dotenv from 'dotenv';
import { getUserFromCookies } from '../get-user';
import { consumeInviteToken, inviteTokenIsValid } from '../db_actions/invite-tokens';
import { request } from 'http';
dotenv.config({ path: '.env.local' });

const SALT = process.env.ARGON2_SALT;

/// Create a new user.
export async function registerNewUser(
  { username, password, name, email, inviteToken }:
    { username: string, password: string, name: string, email: string, inviteToken?: string }
) {
  const requestingUser = await getUserFromCookies();
  // The user must be an admin OR provide a valid invite token.
  if (requestingUser?.is_admin) {
    console.log('User is an admin.');
  } else {
    if (!inviteToken) {
      throw new Error('No invite token provided.');
    }
    // Check if the invite token is valid
    const tokenIsValid = await inviteTokenIsValid(inviteToken);
    if (!tokenIsValid) {
      throw new Error('Invalid invite token.');
    }
    console.log('Confirmed valid invite token.');
  }

  if (!username || !password) {
    throw new Error('Username and password are required.');
  }

  // Check if the username already exists.
  const existingLogin = await getLoginByUsername(username);
  if (existingLogin) {
    throw new Error('Username already exists.');
  }

  // Make sure the password is valid: at least 8 characters.
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  // Create the login.
  const passwordHash = await argon2.hash(SALT + password, { type: argon2.argon2id });
  const login = { username, password_hash: passwordHash, is_salted: true };
  const loginId = await createLogin({ login });

  // Create the user.
  const user = { name, email, login_id: loginId, is_admin: false }
  await createUser({ user });
  console.log(`User ${username} created.`);

  // Consume the invite token, if one was provided.
  if (inviteToken) {
    await consumeInviteToken(inviteToken);
  }
}
