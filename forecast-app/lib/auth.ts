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
    const decoded = jwt.verify(token, JWT_SECRET) as { loginId: number };
    const user: User | undefined = await db
      .selectFrom('logins')
      .innerJoin('users', 'logins.id', 'users.login_id')
      .select(['users.id', 'users.name', 'users.email', 'users.login_id'])
      .where('logins.id', '=', decoded.loginId)
      .executeTakeFirst();
    return user || null;
  } catch {
    return null;
  }
}

/*export async function getCurrentUser() {
  console.log('getCurrentUser');
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', decoded.userId)
      .executeTakeFirst();
    return user;
  } catch {
    return null;
  }
}*/