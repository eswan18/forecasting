import { Database } from "@/types/db_types";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Use test database URL when running tests with containers
const connectionString = process.env.TEST_USE_CONTAINERS === "true" 
  ? process.env.__TEST_DATABASE_URL__ 
  : process.env.DATABASE_URL;

// If the database is on localhost, we don't use SSL
const ssl = connectionString?.includes("localhost")
  ? false
  : { rejectUnauthorized: false };

const dialect = new PostgresDialect({
  pool: new Pool({ connectionString, max: 10, ssl }),
});

export const db = new Kysely<Database>({ dialect });
