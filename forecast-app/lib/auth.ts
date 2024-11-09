import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database';
import { sql } from 'kysely';

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface UserWithUsername {
  id: number,
  name: string,
  email: string,
  login_id: number,
  username: string,
  is_admin: boolean,
}

export async function getUserFromRequest(req: NextRequest): Promise<UserWithUsername | null> {
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return null;
  }
  return await getUserFromToken(token);
}

export async function getUserFromCookies(): Promise<UserWithUsername | null> {
  const token = (await cookies()).get('token')?.value;
  if (!token) {
    return null;
  }
  return await getUserFromToken(token);
}

export async function getUserFromToken(token: string): Promise<UserWithUsername | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { loginId: number };
    const user = await db
      .selectFrom('logins')
      .innerJoin('users', 'logins.id', 'users.login_id')
      .select([
        'users.id', 'users.name', 'users.email', sql<number>`logins.id`.as("login_id"), 'users.is_admin', 'logins.username'
      ])
      .where('logins.id', '=', decoded.loginId)
      .executeTakeFirstOrThrow();
    return user;
  } catch {
    return null;
  }
}