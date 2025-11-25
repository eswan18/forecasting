import InvitesTable from "./invites-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, XCircle } from "lucide-react";
import { getInviteTokens } from "@/lib/db_actions";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { InviteUserButton } from "../invite-user-button";
import PageHeading from "@/components/page-heading";

export default async function Page() {
  const result = await getInviteTokens();
  const invites = handleServerActionResult(result);

  const totalInvites = invites.length;
  const usedInvites = invites.filter(
    (invite) => invite.used_at !== null,
  ).length;
  const unusedInvites = invites.filter(
    (invite) => invite.used_at === null,
  ).length;

  return (
    <main className="flex flex-col py-4 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-8 xl:py-12 xl:px-24">
      <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <PageHeading
          title="Invite Tokens"
          breadcrumbs={{
            Home: "/",
            Admin: "/admin",
            "Invite Tokens": "/admin/invite-tokens",
          }}
          icon={Mail}
          iconGradient="bg-gradient-to-br from-purple-500 to-pink-600"
          className="mb-2"
        />

        <div className="flex items-center justify-between">
          <div className="flex gap-2 sm:gap-4">
            <InviteUserButton className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm sm:text-base" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
                    Total Invites
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {totalInvites}
                  </p>
                </div>
                <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                    Used Invites
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">
                    {usedInvites}
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 sm:col-span-2 lg:col-span-1">
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
                <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invites Table */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
              All Invites
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <InvitesTable data={invites} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
