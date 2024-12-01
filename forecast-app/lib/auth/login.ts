"use server";

import argon2 from 'argon2';
import { db } from '@/lib/database';
import jwt from 'jsonwebtoken';
import { getLoginByUsername } from '@/lib/db_actions';
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache';
import { getUserFromCookies } from '../get-user';

const JWT_SECRET = process.env.JWT_SECRET;
const SALT = process.env.ARGON2_SALT;

export async function login({ username, password }: { username: string, password: string }) {
  // Fetch the user from the database
  const login = await getLoginByUsername(username);
  if (!login) {
    throw new Error('Invalid username or password.');
  }

  // Verify the password
  const isValid = await argon2.verify(login.password_hash, SALT + password);
  if (!isValid) {
    throw new Error('Invalid username or password.');
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
  revalidatePath('/');
}

export async function loginViaImpersonation(username: string) {
  const user = await getUserFromCookies();
  if (!user || !user.is_admin) {
    throw new Error('Not authorized.');
  }

  const login = await getLoginByUsername(username);
  if (!login) {
    throw new Error('Invalid username.');
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
  revalidatePath('/');
}