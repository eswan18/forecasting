import UsersTable from "./users-table";
import { getUsers } from "@/lib/db_actions";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import PageHeading from "@/components/page-heading";

export default async function Page() {
  const result = await getUsers();
  const users = handleServerActionResult(result);

  users.sort((a, b) => a.id - b.id);

  const activeUsers = users.filter(
    (user) => user.deactivated_at === null,
  ).length;

  return (
    <main className="flex flex-col py-4 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-8 xl:py-12 xl:px-24">
      <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <PageHeading
          title="User Management"
          breadcrumbs={{
            Home: "/",
            Admin: "/admin",
            Users: "/admin/users",
          }}
          icon={Users}
          iconGradient="bg-gradient-to-br from-blue-500 to-purple-600"
          className="mb-2"
        />

        {/* Stats Card */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                    Active Users
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">
                    {activeUsers}
                  </p>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              All Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <UsersTable data={users} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
