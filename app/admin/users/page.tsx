import UsersTable from "./users-table";
import { getUsers, getInviteTokens } from "@/lib/db_actions";
import { InviteUserButton } from "../invite-user-button";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Mail } from "lucide-react";
import Link from "next/link";

export default async function Page() {
  const result = await getUsers();
  const users = handleServerActionResult(result);

  const inviteTokensResult = await getInviteTokens();
  const inviteTokens = handleServerActionResult(inviteTokensResult);

  users.sort((a, b) => a.id - b.id);

  const activeUsers = users.filter(
    (user) => user.deactivated_at === null,
  ).length;
  const inactiveUsers = users.filter(
    (user) => user.deactivated_at !== null,
  ).length;
  const unusedInvites = inviteTokens.filter(
    (token) => token.used_at === null,
  ).length;

  return (
    <main className="flex flex-col py-4 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-8 xl:py-12 xl:px-24">
      <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                User Management
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2 sm:gap-4">
              <InviteUserButton className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm sm:text-base" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

          <Card className="border-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    Inactive Users
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {inactiveUsers}
                  </p>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Link
            href="/admin/invite-tokens"
            className="sm:col-span-2 lg:col-span-1"
          >
            <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">
                      Unused Invites
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {unusedInvites}
                    </p>
                  </div>
                  <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
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
