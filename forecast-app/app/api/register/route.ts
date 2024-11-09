import { NextRequest, NextResponse } from 'next/server';
import argon2 from 'argon2';
import { db } from '@/lib/database';
import { NewUser } from '@/types/db_types';

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const REGISTER_SECRET = process.env.REGISTER_SECRET;

/// Create a new user.
export async function POST(req: NextRequest) {
  const { username, password, name, email, register_secret: registerSecret } = await req.json();

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

  const loginId = await createLogin({ username, password });
  const user = { name, email, login_id: loginId, is_admin: false }
  await createUser({ user });

  return NextResponse.json({ message: 'User registered successfully.' }, { status: 201 });
}

async function createLogin({ username, password }: { username: string, password: string }) {
  // Hash the password using Argon2
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  // Insert the new user into the database
  const rows = await db
    .insertInto('logins')
    .values({
      username,
      password_hash: passwordHash,
    })
    .returning('id')
    .execute();
  const id = rows[0].id;

  return id;
}

async function createUser({ user }: { user: NewUser }) {
  const rows = await db
    .insertInto('users')
    .values(user)
    .returning('id')
    .execute();
  const id = rows[0].id;
  return id;
}