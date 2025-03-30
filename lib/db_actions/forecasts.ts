'use server';

import { ForecastUpdate, NewForecast, VForecast, VProp } from '@/types/db_types';
import { db } from '@/lib/database';
import { getUserFromCookies } from '@/lib/get-user';
import { revalidatePath } from 'next/cache';

export async function getForecasts(
  { userId, competitionId }: { userId?: number, competitionId?: number } = {}
): Promise<VForecast[]> {
  const currentUser = await getUserFromCookies();
  if (!currentUser) {
    throw new Error('Unauthorized');
  }
  let query = db.selectFrom('v_forecasts').selectAll();
  if (userId !== undefined) {
    query = query.where('user_id', '=', userId);
  }
  if (competitionId !== undefined) {
    query = query.where('competition_id', '=', competitionId);
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
  const prop = await db
    .selectFrom('v_props')
    .where('prop_id', '=', forecast.prop_id)
    .select('competition_forecasts_due_date')
    .executeTakeFirst();
  const dueDate = prop?.competition_forecasts_due_date;
  if (dueDate && dueDate <= new Date()) {
    throw new Error('Cannot create forecasts past the due date');
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
  if (!user) throw new Error('Unauthorized');
  // Don't let users change any column except the forecast.
  if (Object.keys(forecast).length !== 1 || !('forecast' in forecast)) {
    console.log(`Attempted update with invalid columns: ${Object.keys(forecast)}`);
    throw new Error('Unauthorized');
  }
  // Only allow creating forecasts for future years.
  const prop = await db
    .selectFrom('v_props')
    .where('prop_id', '=', id)
    .select('competition_forecasts_due_date')
    .executeTakeFirst();
  const dueDate = prop?.competition_forecasts_due_date;
  if (dueDate && dueDate <= new Date()) {
    throw new Error('Cannot create forecasts past the due date');
  }
  await db
    .updateTable('forecasts')
    .set(forecast)
    .where('id', '=', id)
    .execute();
  revalidatePath('/forecasts');
}

export async function getUnforecastedProps(
  { competitionId, userId }:
    { competitionId: number, userId: number }
): Promise<VProp[]> {
  // Make sure the user is who they say they, or an admin.
  const user = await getUserFromCookies();
  if (!user) throw new Error('Unauthorized');
  if (user.id !== userId && !user.is_admin) throw new Error('Unauthorized')
  // Fetch props without a corresponding entry in the forecasts table for that user.
  const propsForYear = await db.
    selectFrom('v_props')
    .selectAll()
    .where('competition_id', '=', competitionId)
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