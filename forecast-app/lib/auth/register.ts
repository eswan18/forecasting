"use server";

import argon2 from 'argon2';
import { createLogin, createUser, getLoginByUsername } from '@/lib/db_actions';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const REGISTRATION_SECRET = process.env.REGISTRATION_SECRET;
const SALT = process.env.ARGON2_SALT;

/// Create a new user.
export async function registerNewUser(
  { username, password, name, email, registrationSecret }:
    { username: string, password: string, name: string, email: string, registrationSecret: string }
) {
  // The "registrationSecret" is a secret key that is required to register a new user.
  if (registrationSecret !== REGISTRATION_SECRET) {
    throw new Error('Incorrect registration_secret.');
  }

  if (!username || !password) {
    throw new Error('Username and password are required.');
  }

  // Check if the username already exists
  const existingLogin = await getLoginByUsername(username);

  if (existingLogin) {
    throw new Error('Username already exists.');
  }

  // Make sure the password is valid: at least 8 characters
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  // Create the login
  const passwordHash = await argon2.hash(SALT + password, { type: argon2.argon2id });
  const login = { username, password_hash: passwordHash, is_salted: true };
  const loginId = await createLogin({ login });

  const user = { name, email, login_id: loginId, is_admin: false }
  await createUser({ user });
}
