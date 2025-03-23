"use server";
import { getUserFromCookies } from "../get-user";
import { db } from '@/lib/database';

export async function getCategories(): Promise<{ id: number, name: string }[]> {
  const currentUser = await getUserFromCookies();
  if (!currentUser) {
    throw new Error('Unauthorized');
  }
  return await db.selectFrom('categories').selectAll().execute();
}