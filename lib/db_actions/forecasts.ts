'use server';

import { Database, ForecastUpdate, NewForecast, VForecast, VProp } from '@/types/db_types';
import { db } from '@/lib/database';
import { getUserFromCookies } from '@/lib/get-user';
import { revalidatePath } from 'next/cache';
import { OrderByExpression, OrderByModifiers, sql } from 'kysely';

export type VForecastsOrderByExpression = OrderByExpression<Database, 'v_forecasts', {}>
type Sort = {
  expr: VForecastsOrderByExpression,
  modifiers?: OrderByModifiers
}

export async function getForecasts(
  { userId, competitionId, resolution, sort }:
    { userId?: number, competitionId?: number | null, resolution?: (boolean | null)[], sort?: Sort }
): Promise<VForecast[]> {
  const currentUser = await getUserFromCookies();
  return db.transaction().execute(async (trx) => {
    await trx.executeQuery(sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(db));
    let query = trx.selectFrom('v_forecasts').selectAll();
    if (userId !== undefined) {
      query = query.where('user_id', '=', userId);
    }
    if (typeof competitionId === 'number') {
      // If competitionID is a number, we want to filter down to that competition.
      query = query.where('competition_id', '=', competitionId);
    } else if (competitionId === null) {
      // If competitionID is null, we want to filter down to forecasts that are not in a competition.
      query = query.where('competition_id', 'is', null);
    }
    if (resolution !== undefined) {
      const nonNullResolutions = resolution.filter(res => res !== null);
      query = query.where((eb) => {
        const ors = [];
        if (nonNullResolutions.length > 0) {
          ors.push(eb('resolution', 'in', nonNullResolutions));
        }
        if (resolution && resolution.find(r => r === null) !== undefined) {
          // If null is in the array, include rows where resolution is null.
          ors.push(eb('resolution', 'is', null));
        }
        return eb.or(ors);
      });
    }
    if (sort) {
      query = query.orderBy(sort.expr, sort.modifiers);
    }
    return await query.execute();
  });
}

export async function createForecast({ forecast }: { forecast: NewForecast }): Promise<number> {
  const currentUser = await getUserFromCookies();
  // Check that the competition hasn't ended already.
  await db.transaction().execute(async (trx) => {
    await trx.executeQuery(sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(db));
    const prop = await trx
      .selectFrom('v_props')
      .where('prop_id', '=', forecast.prop_id)
      .select('competition_forecasts_due_date')
      .executeTakeFirst();
    const dueDate = prop?.competition_forecasts_due_date;
    if (dueDate && dueDate <= new Date()) {
      throw new Error('Cannot create forecasts past the due date');
    }
  });
  // Insert the record.
  const id = db.transaction().execute(async (trx) => {
    await trx.executeQuery(sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(db));
    const { id } = await trx
      .insertInto('forecasts')
      .values(forecast)
      .returning('id')
      .executeTakeFirstOrThrow();
    return id;
  });
  revalidatePath('/competitions');
  revalidatePath('/standalone/forecasts');
  return id;
}

export async function updateForecast({ id, forecast }: { id: number, forecast: ForecastUpdate }): Promise<void> {
  // Don't let users change any column except the forecast.
  if (Object.keys(forecast).length !== 1 || !('forecast' in forecast)) {
    console.log(`Attempted update with invalid columns: ${Object.keys(forecast)}`);
    throw new Error('Unauthorized');
  }
  const currentUser = await getUserFromCookies();
  // Check that the competition hasn't ended already.
  await db.transaction().execute(async (trx) => {
    await trx.executeQuery(sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(db));
    const prop = await trx
      .selectFrom('v_props')
      .where('prop_id', '=', id)
      .select('competition_forecasts_due_date')
      .executeTakeFirst();
    const dueDate = prop?.competition_forecasts_due_date;
    if (dueDate && dueDate <= new Date()) {
      throw new Error('Cannot create forecasts past the due date');
    }
  });
  // Update the record.
  await db.transaction().execute(async (trx) => {
    await trx.executeQuery(sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(db));
    await trx
      .updateTable('forecasts')
      .set(forecast)
      .where('id', '=', id)
      .execute();
  });
  revalidatePath('/competitions');
  revalidatePath('/standalone/forecasts');
}

export async function getUnforecastedProps(
  { competitionId, userId }:
    { competitionId: number, userId: number }
): Promise<VProp[]> {
  const currentUser = await getUserFromCookies();
  // Fetch props without a corresponding entry in the forecasts table for that user.
  return db.transaction().execute(async (trx) => {
    await trx.executeQuery(sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(db));
    return await trx.
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
  });
}

export async function deleteForecast({ id }: { id: number }): Promise<void> {
  const currentUser = await getUserFromCookies();
  await db.transaction().execute(async (trx) => {
    await trx.executeQuery(sql`SELECT set_config('app.current_user_id', ${currentUser?.id}, true);`.compile(db));
    await trx
      .deleteFrom('forecasts')
      .where('id', '=', id)
      .execute();
  });
  revalidatePath('/competitions');
  revalidatePath('/standalone/forecasts');
}