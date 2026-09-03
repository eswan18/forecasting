// Storybook mock for `@/lib/db_actions/props`, used by the PropEditDialog and
// the ResolutionDialog that the prop sheet mounts.
import { success } from "@/lib/server-action-result";

export const updateProp = async () => success(undefined);
export const resolveProp = async () => success(undefined);
export const unresolveProp = async () => success(undefined);
