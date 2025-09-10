import { Database } from "@/types/db_types";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

/**
 * Creates a database connection using the appropriate configuration
 * for the current environment (development, production, or test).
 */
export function createDatabaseConnection(): Kysely<Database> {
  const isTest = process.env.NODE_ENV === 'test';
  const useContainers = process.env.TEST_USE_CONTAINERS === 'true';
  
  let connectionString: string | undefined;
  
  if (isTest && useContainers) {
    connectionString = process.env.TEST_DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'TEST_DATABASE_URL not set for container tests. ' +
        'This usually means the global test setup failed to start the PostgreSQL container.'
      );
    }
  } else {
    connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL environment variable is required. ' +
        'Please set it in your .env.local file.'
      );
    }
  }
  
  // If the database is on localhost, we don't use SSL
  const ssl = connectionString.includes("localhost") 
    ? false 
    : { rejectUnauthorized: false };
    
  const dialect = new PostgresDialect({
    pool: new Pool({ 
      connectionString, 
      max: 10, 
      ssl 
    })
  });

  return new Kysely<Database>({ dialect });
}