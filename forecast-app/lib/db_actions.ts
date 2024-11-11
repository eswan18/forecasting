'use server';

import { revalidatePath } from 'next/cache'
import { VForecast, VUser, Login, NewUser, NewLogin, VProp } from '@/types/db_types';
import { db } from './database';
import { sql } from 'kysely';
import { getUserFromCookies } from './auth';

export async function getUsers(): Promise<VUser[]> {
  const user = await getUserFromCookies();
  if (!user?.is_admin) {
    throw new Error('Unauthorized');
  }
  return await db.selectFrom('v_users').selectAll().execute();
}

export async function getLoginByUsername(username: string): Promise<Login | undefined> {
  return await db
    .selectFrom('logins')
    .selectAll()
    .where('username', '=', username)
    .executeTakeFirst();
}

export async function createLogin({ login }: { login: NewLogin }): Promise<number> {
  const { id } = await db
    .insertInto('logins')
    .values(login)
    .returning('id')
    .executeTakeFirstOrThrow();
  return id;
}

export async function createUser({ user }: { user: NewUser }) {
  const { id } = await db
    .insertInto('users')
    .values(user)
    .returning('id')
    .executeTakeFirstOrThrow();
  return id;
}


export async function getPropsAndResolutions(): Promise<VProp[]> {
  return await db
    .selectFrom('v_props')
    .selectAll()
    .execute();
}

export async function getPropsAndResolutionsByYear(year: number): Promise<VProp[]> {
  return await db
    .selectFrom('v_props')
    .selectAll()
    .where('year', '=', year)
    .execute();
}

export async function getForecasts(): Promise<VForecast[]> {
  return await db.selectFrom('v_forecasts').selectAll().execute();
}

export type UserScore = {
  user_id: number,
  user_name: string,
  score: number,
};

export async function getAvgScoreByUser({ year }: { year?: number }): Promise<UserScore[]> {
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

export type UserCategoryScore = UserScore & { category_id: number, category_name: string };

export async function getAvgScoreByUserAndCategory({ year }: { year?: number }): Promise<UserCategoryScore[]> {
  let query = db
    .selectFrom('v_forecasts')
    .where('score', 'is not', null);
  if (year) {
    query = query.where('year', '=', year);
  }

  return await query
    .groupBy(['user_id', 'user_name', 'category_id', 'category_name'])
    .select(({ fn }) => [
      'user_id',
      'user_name',
      'category_id',
      'category_name',
      fn.avg<number>('score').$notNull().as('score'),
    ])
    .execute();
}

export async function resolveProp({ propId, resolution }: { propId: number, resolution: boolean }): Promise<void> {
  // Verify the user is an admin
  const user = await getUserFromCookies();
  if (!user || !user.is_admin) {
    throw new Error('Unauthorized');
  }

  // first check that this prop doesn't already have a resolution
  const existingResolution = await db
    .selectFrom('resolutions')
    .where('prop_id', '=', propId)
    .select('resolution')
    .executeTakeFirst();
  if (!!existingResolution) {
    throw new Error(`Proposition ${propId} already has a resolution`);
  }

  await db.insertInto('resolutions').values({ prop_id: propId, resolution }).execute();
  revalidatePath('/props');
}

export async function unresolveProp({ propId }: { propId: number }): Promise<void> {
  // Verify the user is an admin
  const user = await getUserFromCookies();
  if (!user || !user.is_admin) {
    throw new Error('Unauthorized');
  }

  await db.deleteFrom('resolutions').where('prop_id', '=', propId).execute();
  revalidatePath('/props');
}