"use server";
import { Category } from "@/types/db_types";
import { getUserFromCookies } from "../get-user";
import { db } from '@/lib/database';

export async function getCategories(): Promise<Category[]> {
  const currentUser = await getUserFromCookies();
  if (!currentUser) {
    throw new Error('Unauthorized');
  }
  return await db.selectFrom('categories').selectAll().execute();
}