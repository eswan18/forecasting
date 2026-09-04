import UsersTable from "./users-table";
import { getUsers } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
import { handleServerActionResult } from "@/lib/server-action-helpers";

export default async function Page() {
  const result = await getUsers();
  const users = handleServerActionResult(result);

  // Only so the reader's own entry can be marked; the sheet does nothing else
  // with it, and a viewer it cannot resolve simply gets an unmarked ledger.
  const viewer = await getUserFromCookies();

  return <UsersTable data={users} currentUserId={viewer?.id ?? null} />;
}
