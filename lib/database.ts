import { loadEnvironment } from "./environment";

// Load the appropriate environment configuration
loadEnvironment();

import { createDatabaseConnection } from "./database-factory";

export const db = createDatabaseConnection();
