import { Database } from '@/types/db_types';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
// If the database is on localhost, we don't use SSL
const ssl = process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false };

const dialect = new PostgresDialect({
  pool: new Pool({ connectionString, max: 10, ssl }),
})

export const db = new Kysely<Database>({ dialect });
