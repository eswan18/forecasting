import { User } from '@/types/db_types';
import { db } from './database';

export async function getUsers(): Promise<User[]> {
  return await db.selectFrom('users').selectAll().execute();
}