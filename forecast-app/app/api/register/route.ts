import { NextRequest, NextResponse } from 'next/server';
import argon2 from 'argon2';
import { db } from '@/lib/database';

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const REGISTER_SECRET = process.env.REGISTER_SECRET;

/// Create a new user.
export async function POST(req: NextRequest) {
  const { username, password, register_secret: registerSecret } = await req.json();

  // The "registerSecret" is a secret key that is required to register a new user.
  if (registerSecret !== REGISTER_SECRET) {
    return NextResponse.json(
      { error: 'Incorrect register_secret.' },
      { status: 401 }
    );
  }

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username and password are required.' },
      { status: 400 }
    );
  }

  // Check if the username already exists
  const existingLogin = await db
    .selectFrom('logins')
    .select('id')
    .where('username', '=', username)
    .executeTakeFirst();

  if (existingLogin) {
    return NextResponse.json({ error: 'Username already exists.' }, { status: 400 });
  }

  // Make sure the password is valid: at least 8 characters
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters long.' },
      { status: 400 }
    );
  }

  // Hash the password using Argon2
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  // Insert the new user into the database
  await db
    .insertInto('logins')
    .values({
      username,
      password_hash: passwordHash,
    })
    .execute();

  return NextResponse.json({ message: 'User registered successfully.' }, { status: 201 });
}