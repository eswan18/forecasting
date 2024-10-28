import { NextRequest, NextResponse } from 'next/server';
import argon2 from 'argon2';
import { db } from '@/lib/database';

/// Create a new user.
export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

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