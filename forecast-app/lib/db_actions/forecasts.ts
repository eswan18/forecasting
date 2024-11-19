'use server';

import { VForecast } from '@/types/db_types';
import { db } from '@/lib/database';
import { getUserFromCookies } from '@/lib/get-user';

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

type UserScore = {
  user_id: number,
  user_name: string,
  score: number,
};

async function getAvgScoreByUser({ year }: { year?: number }): Promise<UserScore[]> {
  let query = db
    .selectFrom('v_forecasts')
    .where('score', 'is not', null);
  if (year) {
    query = query.where('year', '=', year);
  }

  return await query
    .groupBy(['user_id', 'user_name'])
    .select(({ fn }) => [
      'user_id',
      'user_name',
      fn.avg<number>('score').$notNull().as('score'),
    ])
    .orderBy('score', 'asc')
    .execute();
}