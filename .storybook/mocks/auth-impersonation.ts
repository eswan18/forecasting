// Storybook mock for `@/lib/auth/impersonation`, reached by the account menu on
// the users directory. The real module mints a signed token against the DB.
import { success } from "@/lib/server-action-result";

export const startImpersonation = async () => success(undefined);
