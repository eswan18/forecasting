import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database';
import { User } from '@/types/db_types';

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function getUserFromRequest(req: NextRequest): Promise<User | null> {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user: User | undefined = await db
      .selectFrom('logins')
      .innerJoin('users', 'logins.id', 'users.id')
      .select(['users.id', 'users.name', 'users.email', 'users.login_id'])
      .where('id', '=', decoded.userId)
      .executeTakeFirst();
    return user || null;
  } catch {
    return null;
  }
}