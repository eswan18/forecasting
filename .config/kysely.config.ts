import { defineConfig } from "kysely-ctl";
import { db } from "../lib/database";

export default defineConfig({ kysely: db });
