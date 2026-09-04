// Storybook mock for `@/lib/db_actions/users`, reached by the account menu on
// the users directory. The real module reaches Postgres.
import { success } from "@/lib/server-action-result";

export const setUserActive = async () => success(undefined);
