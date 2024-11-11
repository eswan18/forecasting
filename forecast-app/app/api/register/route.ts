import { NextRequest, NextResponse } from 'next/server';
import argon2 from 'argon2';

import * as dotenv from 'dotenv';
import { createLogin, createUser, getLoginByUsername } from '@/lib/db_actions';
dotenv.config({ path: '.env.local' });

const REGISTRATION_SECRET = process.env.REGISTRATION_SECRET;
const SALT = process.env.ARGON2_SALT;

/// Create a new user.
export async function POST(req: NextRequest) {
  const { username, password, name, email, registration_secret: registrationSecret } = await req.json();

  // The "registrationSecret" is a secret key that is required to register a new user.
  if (registrationSecret !== REGISTRATION_SECRET) {
    return NextResponse.json(
      { error: 'Incorrect registration_secret.' },
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
  const existingLogin = await getLoginByUsername(username);

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

  // Create the login
  const passwordHash = await argon2.hash(SALT + password, { type: argon2.argon2id });
  const login = { username, password_hash: passwordHash, is_salted: true };
  const loginId = await createLogin({login});

  const user = { name, email, login_id: loginId, is_admin: false }
  await createUser({ user });

  return NextResponse.json({ message: 'User registered successfully.' }, { status: 201 });
}
