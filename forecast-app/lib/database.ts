import { Database } from '@/types/db_types';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

const dialect = new PostgresDialect({
  pool: new Pool({ connectionString, max: 10, ssl: { rejectUnauthorized: false } }),
})

export const db = new Kysely<Database>({ dialect });
