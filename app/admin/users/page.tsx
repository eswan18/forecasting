import UsersTable from "./users-table";
import { getUsers } from "@/lib/db_actions";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { Card, CardContent } from "@/components/ui/card";
import PageHeading from "@/components/page-heading";

export default async function Page() {
  const result = await getUsers();
  const users = handleServerActionResult(result);

  users.sort((a, b) => a.id - b.id);

  return (
    <main className="flex flex-col items-center py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-6xl">
        <PageHeading
          title="User Management"
          breadcrumbs={{
            Admin: "/admin",
          }}
        />

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <UsersTable data={users} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
