'use server';

import { NewForecast, VForecast } from '@/types/db_types';
import { db } from '@/lib/database';
import { getUserFromCookies } from '@/lib/get-user';
import { revalidatePath } from 'next/cache';

export async function getForecasts(
  { userId, year }: { userId?: number, year?: number } = {}
): Promise<VForecast[]> {
  const currentUser = await getUserFromCookies();
  if (!currentUser) {
    throw new Error('Unauthorized');
  }
  let query = db.selectFrom('v_forecasts').selectAll();
  if (userId !== undefined) {
    query = query.where('user_id', '=', userId);
  }
  if (year !== undefined) {
    query = query.where('year', '=', year);
  }
  return await query.execute();
}

export async function createForecast({ forecast }: { forecast: NewForecast }): Promise<number> {
  const { id } = await db
    .insertInto('forecasts')
    .values(forecast)
    .returning('id')
    .executeTakeFirstOrThrow();
  revalidatePath('/forecasts');
  return id;
}