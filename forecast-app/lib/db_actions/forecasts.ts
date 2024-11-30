'use server';

import { ForecastUpdate, NewForecast, VForecast } from '@/types/db_types';
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
  // Make sure the user is who they say they.
  const user = await getUserFromCookies();
  if (!user || user.id !== forecast.user_id) {
    throw new Error('Unauthorized');
  }
  const { id } = await db
    .insertInto('forecasts')
    .values(forecast)
    .returning('id')
    .executeTakeFirstOrThrow();
  revalidatePath('/forecasts');
  return id;
}

export async function updateForecast({ id, forecast }: { id: number, forecast: ForecastUpdate }): Promise<void> {
  // Make sure the user is who they say they.
  const user = await getUserFromCookies();
  if (!user || user.id !== forecast.user_id) {
    console.log(`Attempted update by user '${user?.id}' on forecast ${id} for user ${forecast.user_id}`);
    throw new Error('Unauthorized');
  }
  // Don't let users change any column except the forecast.
  if (Object.keys(forecast).length !== 1 || !('forecast' in forecast)) {
    console.log(`Attempted update with invalid columns: ${Object.keys(forecast)}`);
    throw new Error('Unauthorized');
  }
  // Don't let users update forecasts for the current year.
  const existingForecast = await db
    .selectFrom('v_forecasts')
    .where('forecast_id', '=', id)
    .select('year')
    .executeTakeFirstOrThrow();
  const thisYear = new Date().getFullYear();
  if (existingForecast.year <= thisYear) {
    throw new Error('Cannot update forecasts for the current year');
  }
  await db
    .updateTable('forecasts')
    .set(forecast)
    .where('id', '=', id)
    .execute();
  revalidatePath('/forecasts');
}
