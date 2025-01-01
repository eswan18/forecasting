'use server';

import { ForecastUpdate, NewForecast, VForecast, VProp } from '@/types/db_types';
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
  // Only allow creating forecasts for future years.
  const thisYear = new Date().getUTCFullYear();
  console.log(thisYear);
  /*const prop = await db
    .selectFrom('props')
    .where('id', '=', forecast.prop_id)
    .select('year')
    .executeTakeFirstOrThrow();
  if (prop.year <= thisYear) {
    throw new Error('Cannot create forecasts for the current year');
  }*/
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
  if (!user) throw new Error('Unauthorized');
  // Don't let users change any column except the forecast.
  if (Object.keys(forecast).length !== 1 || !('forecast' in forecast)) {
    console.log(`Attempted update with invalid columns: ${Object.keys(forecast)}`);
    throw new Error('Unauthorized');
  }
  // Only allow updates to forecasts for future years, and for the current user.
  const existingForecast = await db
    .selectFrom('v_forecasts')
    .where('forecast_id', '=', id)
    .select(['year', 'user_id'])
    .executeTakeFirstOrThrow();
  const thisYear = new Date().getUTCFullYear();
  /*if (existingForecast.year <= thisYear) {
    throw new Error('Cannot update forecasts for the current year');
  }*/
  if (existingForecast.user_id !== user.id) {
    throw new Error('Unauthorized');
  }
  await db
    .updateTable('forecasts')
    .set(forecast)
    .where('id', '=', id)
    .execute();
  revalidatePath('/forecasts');
}

export async function getUnforecastedProps({ year, userId }: { year: number, userId: number }): Promise<VProp[]> {
  // Make sure the user is who they say they, or an admin.
  const user = await getUserFromCookies();
  if (!user) throw new Error('Unauthorized');
  if (user.id !== userId && !user.is_admin) throw new Error('Unauthorized')
  // Fetch props without a corresponding entry in the forecasts table for that user.
  const propsForYear = await db.
    selectFrom('v_props')
    .selectAll()
    .where('year', '=', year)
    .where(({ not, exists, selectFrom }) => not(exists(
      selectFrom('forecasts')
        .select("id")
        .where('user_id', '=', userId)
        .whereRef('forecasts.prop_id', '=', 'v_props.prop_id')
    )
    ))
    .execute();
  return propsForYear;
}