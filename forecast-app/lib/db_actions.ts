'use server';

import { User, VForecast } from '@/types/db_types';
import { db } from './database';
import { sql } from 'kysely';

export async function getUsers(): Promise<User[]> {
  return await db.selectFrom('users').selectAll().execute();
}

export type PropAndResolution = { prop_id: number, prop_text: string, resolution: boolean | null };

export async function getPropsAndResolutions(): Promise<PropAndResolution[]> {
  return await db
    .selectFrom('props')
    .leftJoin('resolutions', 'props.id', 'resolutions.prop_id')
    .select([
      sql<number>`props.id`.as('prop_id'),
      sql<string>`props.text`.as('prop_text'),
      'resolutions.resolution',
    ])
    .execute();
}

export async function getPropsAndResolutionsByYear(year: number): Promise<PropAndResolution[]> {
  return await db
    .selectFrom('props')
    .leftJoin('resolutions', 'props.id', 'resolutions.prop_id')
    .where('year', '=', year)
    .select([
      sql<number>`props.id`.as('prop_id'),
      sql<string>`props.text`.as('prop_text'),
      'resolutions.resolution',
    ])
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
  // first check that this prop doesn't already have a resolution
  const existingResolution = await db
    .selectFrom('resolutions')
    .where('prop_id', '=', propId)
    .select('resolution')
    .executeTakeFirst();
  if (!!existingResolution) {
    console.log(existingResolution);
    throw new Error(`Proposition ${propId} already has a resolution`);
  }

  console.log('here!!!');
  await db.insertInto('resolutions').values({ prop_id: propId, resolution }).execute();
}