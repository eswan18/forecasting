'use server';

import { db } from '@/lib/database';
import { Competition } from "@/types/db_types";

export async function getCompetitionById(id: number): Promise<Competition | undefined> {
  const competition = await db
    .selectFrom('competitions')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();

  return competition;
}

export async function getCompetitions(): Promise<Competition[]> {
  let query = db.selectFrom('competitions').orderBy('name desc').selectAll();
  return await query.execute();
}