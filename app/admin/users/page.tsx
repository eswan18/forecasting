import UsersTable from "./users-table";
import PageHeading from "@/components/page-heading";
import { getUsers } from "@/lib/db_actions";
import { InviteUserButton } from "./invite-user-button";
import { handleServerActionResult } from "@/lib/server-action-helpers";

export default async function Page() {
  const result = await getUsers();
  const users = handleServerActionResult(result);
  
  users.sort((a, b) => a.id - b.id);
  
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-2xl">
        <PageHeading title="Users">
          <InviteUserButton className="ml-8" />
        </PageHeading>
        <UsersTable data={users} />
      </div>
    </main>
  );
}
