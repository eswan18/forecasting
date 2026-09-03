// Storybook mock for `@/lib/db_actions`. Stories never touch the database;
// these stubs just return a success result so server-action hooks resolve.
import { success } from "@/lib/server-action-result";

export const createForecast = async () => success(undefined);
export const updateForecast = async () => success(undefined);
export const updatePropOptions = async () => success(undefined);
export const saveChoiceForecast = async () => success(1);

// Reached by the feature-flags sheet and the user-level flag picker.
export const createFeatureFlag = async () => success(undefined);
export const updateFeatureFlag = async () => success(undefined);
export const getUsers = async () => success([]);
