import PageHeading from "@/components/page-heading";
import {
  getCompetitionById,
  getForecasts,
  getUnforecastedProps,
  getUsers,
} from "@/lib/db_actions";
import { VUser } from "@/types/db_types";
import { InaccessiblePage } from "@/components/inaccessible-page";
import ErrorPage from "@/components/pages/error-page";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { ClipboardCheck, Users } from "lucide-react";
import { logger } from "@/lib/logger";
import { ErrorToast } from "./error-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ForecastProgressPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  if (isNaN(competitionId)) {
    return <ErrorPage title="Invalid competition ID" />;
  }
  const competitionResult = await getCompetitionById(competitionId);
  if (!competitionResult.success) {
    return (
      <InaccessiblePage
        title="Competition not found"
        message={competitionResult.error}
      />
    );
  }
  const competition = competitionResult.data;
  const usersResult = await getUsers();
  const users = handleServerActionResult(usersResult);

  const unforecastedPropsResults = await Promise.all(
    users.map(async (user) => {
      const result = await getUnforecastedProps({
        userId: user.id,
        competitionId,
      });
      return {
        userId: user.id,
        result,
      };
    }),
  );
  const forecastedPropsResults = await Promise.all(
    users.map(async (user) => {
      const result = await getForecasts({ userId: user.id, competitionId });
      return {
        userId: user.id,
        result,
      };
    }),
  );

  // Check for errors and log them
  const unforecastedErrors = unforecastedPropsResults.filter(
    (r) => !r.result.success,
  );
  const forecastedErrors = forecastedPropsResults.filter(
    (r) => !r.result.success,
  );
  const hasErrors =
    unforecastedErrors.length > 0 || forecastedErrors.length > 0;

  if (hasErrors) {
    unforecastedErrors.forEach(({ userId, result }) => {
      if (!result.success) {
        logger.warn("Failed to load unforecasted props", {
          userId,
          competitionId,
          error: result.error,
        });
      }
    });
    forecastedErrors.forEach(({ userId, result }) => {
      if (!result.success) {
        logger.warn("Failed to load forecasts", {
          userId,
          competitionId,
          error: result.error,
        });
      }
    });
  }

  const metrics: UserProgressMetrics[] = users.map((user) => {
    const unforecasted = unforecastedPropsResults.find(
      (u) => u.userId === user.id,
    );
    const unforecastedCount = unforecasted?.result.success
      ? unforecasted.result.data.length
      : 0;
    const forecasted = forecastedPropsResults.find((u) => u.userId === user.id);
    const forecastedCount = forecasted?.result.success
      ? forecasted.result.data.length
      : 0;
    const total = forecastedCount + unforecastedCount;
    return {
      user,
      unforecasted: unforecastedCount,
      forecasted: forecastedCount,
      percentComplete: total > 0 ? forecastedCount / total : 0,
    };
  });

  // Calculate summary statistics
  const totalUsers = metrics.length;
  const totalForecasted = metrics.reduce((sum, m) => sum + m.forecasted, 0);
  const totalUnforecasted = metrics.reduce((sum, m) => sum + m.unforecasted, 0);
  const totalProps = totalForecasted + totalUnforecasted;
  const overallProgress = totalProps > 0 ? totalForecasted / totalProps : 0;
  const usersFinished = metrics.filter((m) => m.percentComplete === 1).length;

  return (
    <main className="flex flex-col py-4 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-8 xl:py-12 xl:px-24">
      <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <ErrorToast hasErrors={hasErrors} />
        <PageHeading
          title={`${competition?.name}: Forecast Progress`}
          breadcrumbs={{
            Admin: "/admin",
          }}
          className="mb-2"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
                    Overall Progress
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {(overallProgress * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                    Users Finished
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">
                    {usersFinished} / {totalUsers}
                  </p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Table */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5" />
              User Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b">
                  <TableHead className="font-semibold text-muted-foreground text-xs sm:text-sm">
                    User
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-xs sm:text-sm text-right">
                    Unforecasted
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-xs sm:text-sm text-right">
                    Forecasted
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-xs sm:text-sm text-right">
                    Progress
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((m) => (
                  <UserMetricsRow key={m.user.id} metrics={m} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

interface UserProgressMetrics {
  user: VUser;
  unforecasted: number;
  forecasted: number;
  percentComplete: number;
}

async function UserMetricsRow({ metrics }: { metrics: UserProgressMetrics }) {
  const percentComplete = metrics.percentComplete * 100;
  const isComplete = metrics.percentComplete === 1;
  const isInProgress =
    metrics.percentComplete > 0 && metrics.percentComplete < 1;

  return (
    <TableRow className="border-b hover:bg-muted/20 transition-colors">
      <TableCell className="py-3 sm:py-4 text-xs sm:text-sm font-medium">
        {metrics.user.name}
      </TableCell>
      <TableCell className="py-3 sm:py-4 text-xs sm:text-sm text-right">
        {metrics.unforecasted}
      </TableCell>
      <TableCell className="py-3 sm:py-4 text-xs sm:text-sm text-right">
        {metrics.forecasted}
      </TableCell>
      <TableCell className="py-3 sm:py-4 text-xs sm:text-sm text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="flex-1 max-w-[100px] hidden sm:block">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isComplete
                    ? "bg-green-500"
                    : isInProgress
                      ? "bg-yellow-500"
                      : "bg-muted"
                }`}
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
          <span
            className={`font-medium ${
              isComplete
                ? "text-green-600 dark:text-green-400"
                : isInProgress
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-muted-foreground"
            }`}
          >
            {percentComplete.toFixed(0)}%
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}
