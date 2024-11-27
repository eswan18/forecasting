"use server";
/// Log in a user.

import argon2 from 'argon2';
import { db } from '@/lib/database';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { getLoginByUsername } from '@/lib/db_actions';
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET;
const SALT = process.env.ARGON2_SALT;

export async function login({username, password}: {username: string, password: string}) {
  // Fetch the user from the database
  const login = await getLoginByUsername(username);

  if (!login) {
    throw new Error('Invalid username or password.');
  }

  // Verify the password
  // Legacy users didn't have salted passwords, so we check before salting.
  const passwordToVerify = login.is_salted ? SALT + password : password;
  const isValid = await argon2.verify(login.password_hash, passwordToVerify);

  if (!isValid) {
    throw new Error('Invalid username or password.');
  }

  ////////////////////////////////////////
  // Temporary patch: fix unsalted users
  ////////////////////////////////////////
  if (!login.is_salted) {
    const newPasswordHash = await argon2.hash(SALT + password, { type: argon2.argon2id });
    await db
      .updateTable('logins')
      .set({'password_hash': newPasswordHash, is_salted: true})
      .where('id', '=', login.id)
      .execute();
  }

  // Create a JWT token
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set.');
  }
  const token = jwt.sign({ loginId: login.id }, JWT_SECRET, { expiresIn: '3h' });

  // Set the token in an HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 108000, // 3 hours
    path: '/',
  });
}