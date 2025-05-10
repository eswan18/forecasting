'use server';

import { db } from '@/lib/database';
import { Competition, CompetitionUpdate, NewCompetition } from "@/types/db_types";
import { getUserFromCookies } from '../get-user';
import { revalidatePath } from 'next/cache';

export async function getCompetitionById(id: number): Promise<Competition | undefined> {
  const competition = await db
    .selectFrom('competitions')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
  return competition;
}

export async function getCompetitions(): Promise<Competition[]> {
  let query = db.selectFrom('competitions').orderBy('name', 'desc').selectAll();
  return await query.execute();
}

export async function updateCompetition({ id, competition }: { id: number, competition: CompetitionUpdate }) {
  const user = await getUserFromCookies();
  if (!user?.is_admin) {
    throw new Error('Unauthorized: Only admins can update competitions');
  }
  await db
    .updateTable('competitions')
    .set(competition)
    .where('id', '=', id)
    .execute();
  revalidatePath('/competitions');
  revalidatePath('/admin/competitions');
}

export async function createCompetition({ competition }: { competition: NewCompetition }) {
  const user = await getUserFromCookies();
  if (!user?.is_admin) {
    throw new Error('Unauthorized: Only admins can create competitions');
  }
  await db
    .insertInto('competitions')
    .values(competition)
    .execute();
  revalidatePath('/competitions');
  revalidatePath('/admin/competitions');
}