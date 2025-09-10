import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createDatabaseConnection } from "./database-factory";

export const db = createDatabaseConnection();
