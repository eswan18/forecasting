// Storybook mock for `@/lib/db_actions`. Stories never touch the database;
// these stubs just return a success result so server-action hooks resolve.
import { success } from "@/lib/server-action-result";

export const createForecast = async () => success(undefined);
export const updateForecast = async () => success(undefined);
