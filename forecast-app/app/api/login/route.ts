/// Log in a user.

import { NextRequest, NextResponse } from 'next/server';
import argon2 from 'argon2';
import { db } from '@/lib/database';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username and password are required.' },
      { status: 400 }
    );
  }

  // Fetch the user from the database
  const login = await db
    .selectFrom('logins')
    .selectAll()
    .where('username', '=', username)
    .executeTakeFirst();

  if (!login) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  }

  // Verify the password
  const isValid = await argon2.verify(login.password_hash, password);

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  }

  // Create a JWT token
  const token = jwt.sign({ userId: login.id }, JWT_SECRET, { expiresIn: '1h' });

  // Set the token in an HTTP-only cookie
  const cookie = serialize('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600,
    path: '/',
    sameSite: 'strict',
  });

  return new NextResponse(
    JSON.stringify({ message: 'Login successful.' }),
    {
      status: 200,
      headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' },
    }
  );
}