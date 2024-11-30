import { DataTable } from "./data-table";
import PageHeading from "@/components/page-heading";
import { getUsers } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";

export default async function Page() {
  const user = await getUserFromCookies();
  const authorized = user?.is_admin;
  const users = authorized ? await getUsers() : [];
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title="Users" />
        {authorized
          ? <DataTable data={users} />
          : <p>Unauthorized: only admins can see users</p>}
      </div>
    </main>
  );
}
