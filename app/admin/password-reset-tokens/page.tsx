import ResetTokensTable from "./reset-tokens-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Clock, CheckCircle, XCircle } from "lucide-react";
import { getPasswordResetTokens } from "@/lib/db_actions";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import PageHeading from "@/components/page-heading";

export default async function Page() {
  const result = await getPasswordResetTokens();
  const resetTokens = handleServerActionResult(result);

  const totalTokens = resetTokens.length;
  const now = new Date();
  const expiredTokens = resetTokens.filter(
    (token) => token.expires_at < now,
  ).length;
  const activeTokens = resetTokens.filter(
    (token) => token.expires_at >= now,
  ).length;

  return (
    <main className="flex flex-col py-4 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-8 xl:py-12 xl:px-24">
      <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <PageHeading
          title="Password Reset Tokens"
          breadcrumbs={{
            Home: "/",
            Admin: "/admin",
            "Password Reset Tokens": "/admin/password-reset-tokens",
          }}
          icon={KeyRound}
          iconGradient="bg-gradient-to-br from-orange-500 to-red-600"
          className="mb-2"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
                    Total Tokens
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {totalTokens}
                  </p>
                </div>
                <KeyRound className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                    Active Tokens
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">
                    {activeTokens}
                  </p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 sm:col-span-2 lg:col-span-1">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">
                    Expired Tokens
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-red-900 dark:text-red-100">
                    {expiredTokens}
                  </p>
                </div>
                <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reset Tokens Table */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <KeyRound className="h-4 w-4 sm:h-5 sm:w-5" />
              All Password Reset Tokens
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <ResetTokensTable data={resetTokens} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
