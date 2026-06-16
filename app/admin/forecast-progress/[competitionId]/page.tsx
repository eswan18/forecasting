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
import { logger } from "@/lib/logger";
import { ErrorToast } from "./error-toast";
import { Container } from "@/components/ui/container";
import { ForecastProgressMeter } from "./forecast-progress-meter";
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
    <main className="py-10 lg:py-14">
      <Container>
        <ErrorToast hasErrors={hasErrors} />
        <PageHeading
          title="Forecast Progress"
          subtitle={competition?.name}
          breadcrumbs={{
            Admin: "/admin",
          }}
        />

        {/* Summary stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Overall Progress
            </div>
            <div className="mt-1.5 font-mono text-3xl font-semibold tabular-nums tracking-tight text-foreground">
              {(overallProgress * 100).toFixed(0)}%
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Users Finished
            </div>
            <div className="mt-1.5 font-mono text-3xl font-semibold tabular-nums tracking-tight text-foreground">
              {usersFinished}
              <span className="text-muted-foreground"> / {totalUsers}</span>
            </div>
          </div>
        </div>

        {/* Progress table */}
        <section className="mt-6 overflow-hidden rounded-lg border bg-card">
          <div className="border-b px-4 py-3 sm:px-5">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              User Progress (<span className="tabular-nums">{totalUsers}</span>)
            </span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b hover:bg-transparent">
                  <TableHead className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    User
                  </TableHead>
                  <TableHead className="text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Unforecasted
                  </TableHead>
                  <TableHead className="text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Forecasted
                  </TableHead>
                  <TableHead className="text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
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
          </div>
        </section>
      </Container>
    </main>
  );
}

interface UserProgressMetrics {
  user: VUser;
  unforecasted: number;
  forecasted: number;
  percentComplete: number;
}

function UserMetricsRow({ metrics }: { metrics: UserProgressMetrics }) {
  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell className="py-3 text-sm font-medium">
        {metrics.user.name}
      </TableCell>
      <TableCell className="py-3 text-right font-mono text-sm tabular-nums text-muted-foreground">
        {metrics.unforecasted}
      </TableCell>
      <TableCell className="py-3 text-right font-mono text-sm tabular-nums">
        {metrics.forecasted}
      </TableCell>
      <TableCell className="py-3 text-right">
        <ForecastProgressMeter value={metrics.percentComplete} />
      </TableCell>
    </TableRow>
  );
}
