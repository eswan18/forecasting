import { DataTable } from "./data-table";
import PageHeading from "@/components/page-heading";
import { getUsers } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
import { InviteUserButton } from "./invite-user-button";
import { InaccessiblePage } from "@/components/inaccessible-page";

export default async function Page() {
  const user = await getUserFromCookies();
  const authorized = user?.is_admin;
  if (!authorized) {
    return (
      <InaccessiblePage
        title="No access"
        message="Only admins can see this page."
      />
    );
  }
  const users = authorized ? await getUsers() : [];
  users.sort((a, b) => a.id - b.id);
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title="Users">
          <InviteUserButton className="ml-8" />
        </PageHeading>
        {authorized
          ? <DataTable data={users} />
          : <p>Unauthorized: only admins can see users</p>}
      </div>
    </main>
  );
}
