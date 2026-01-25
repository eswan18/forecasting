import PageHeading from "@/components/page-heading";
import { getPropsWithUserForecasts } from "@/lib/db_actions/forecasts";
import { getUserFromCookies } from "@/lib/get-user";
import { PropsTable } from "@/components/props/props-table";
import { ForecastablePropsTable } from "@/components/forecastable-props-table";
import { BarChart3, ChartLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CompetitionStartEnd from "./competition-start-end";
import { getCompetitionById, getCompetitionScores } from "@/lib/db_actions";
import {
  getCurrentUserRole,
  getMemberCount,
} from "@/lib/db_actions/competition-members";
import {
  getCompetitionStats,
  getUpcomingDeadlines,
} from "@/lib/db_actions/competition-stats";
import ErrorPage from "@/components/pages/error-page";
import { InaccessiblePage } from "@/components/inaccessible-page";
import Link from "next/link";
import { getCompetitionStatus } from "@/lib/competition-status";
import { PrivateCompetitionDashboard } from "@/components/competition-dashboard";

export default async function Page({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  if (isNaN(competitionId)) {
    return (
      <ErrorPage title={`Invalid competition ID '${competitionIdString}'`} />
    );
  }
  const user = (await getUserFromCookies())!;

  const competitionResult = await getCompetitionById(competitionId);
  if (!competitionResult.success) {
    return <ErrorPage title={competitionResult.error} />;
  }
  const competition = competitionResult.data;

  // Handle private competitions differently
  if (competition.is_private) {
    // Check if user is a member
    const roleResult = await getCurrentUserRole(competitionId);
    if (!roleResult.success) {
      return <ErrorPage title={roleResult.error} />;
    }

    const userRole = roleResult.data;
    if (userRole === null) {
      return (
        <InaccessiblePage
          title="Private Competition"
          message="You are not a member of this competition."
        />
      );
    }

    const isAdmin = userRole === "admin";

    // Fetch all data needed for the dashboard in parallel
    const [
      statsResult,
      deadlinesResult,
      scoresResult,
      memberCountResult,
      propsWithForecastsResult,
    ] = await Promise.all([
      getCompetitionStats({ competitionId, userId: user.id }),
      getUpcomingDeadlines({ competitionId, userId: user.id, limit: 5 }),
      getCompetitionScores({ competitionId }),
      getMemberCount(competitionId),
      getPropsWithUserForecasts({ userId: user.id, competitionId }),
    ]);

    if (!statsResult.success) {
      return <ErrorPage title={statsResult.error} />;
    }
    if (!deadlinesResult.success) {
      return <ErrorPage title={deadlinesResult.error} />;
    }
    if (!scoresResult.success) {
      return <ErrorPage title={scoresResult.error} />;
    }
    if (!memberCountResult.success) {
      return <ErrorPage title={memberCountResult.error} />;
    }
    if (!propsWithForecastsResult.success) {
      return <ErrorPage title={propsWithForecastsResult.error} />;
    }

    return (
      <PrivateCompetitionDashboard
        competitionId={competitionId}
        competitionName={competition.name}
        stats={statsResult.data}
        upcomingDeadlines={deadlinesResult.data}
        scores={scoresResult.data}
        memberCount={memberCountResult.data}
        isAdmin={isAdmin}
        currentUserId={user.id}
      />
    );
  }

  // Public competition - original logic
  const allowEdits = user.is_admin;

  const competitionStatus = getCompetitionStatus(
    competition.forecasts_open_date,
    competition.forecasts_close_date,
    competition.end_date,
  );
  const pageIsVisible = user.is_admin || competitionStatus !== "upcoming";
  if (!pageIsVisible) {
    return (
      <InaccessiblePage
        title="Competition Not Available"
        message="This competition is not currently visible to users."
      />
    );
  }
  const competitionForecastsAreOpen = competitionStatus === "forecasts-open";
  const propsWithForecastsResult = await getPropsWithUserForecasts({
    userId: user.id,
    competitionId,
  });
  if (!propsWithForecastsResult.success) {
    return <ErrorPage title={propsWithForecastsResult.error} />;
  }
  const propsWithForecasts = propsWithForecastsResult.data;

  return (
    <main className="flex flex-col items-start py-4 px-8 lg:py-8 lg:px-24 w-full">
      <PageHeading
        title={competition.name}
        breadcrumbs={{
          Competitions: "/competitions",
        }}
        className="mb-2"
      >
        {competitionStatus === "upcoming" && (
          <Badge variant="destructive" className="text-xs">
            Not Visible to Users
          </Badge>
        )}
        {competitionForecastsAreOpen && (
          <Badge variant="default">Forecasts Open</Badge>
        )}
      </PageHeading>
      <CompetitionStartEnd competition={competition} />

      {competitionForecastsAreOpen ? (
        <>
          {/* Show PropsToForecastTable when forecasts are open */}
          <ForecastablePropsTable
            props={propsWithForecasts}
            canCreateProps={allowEdits} // Only admins can create competition props
            competitionId={competitionId}
            defaultUserId={user.id}
          />
        </>
      ) : (
        <>
          {/* Navigation Links */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Link href={`/competitions/${competitionId}/scores`}>
              <Button variant="outline" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                View Scores
              </Button>
            </Link>
            <Link href={`/competitions/${competitionId}/forecast-stats`}>
              <Button variant="outline" className="flex items-center gap-2">
                <ChartLine className="h-4 w-4" />
                Forecasts Stats
              </Button>
            </Link>
          </div>
          <PropsTable
            props={propsWithForecasts}
            canCreateProps={allowEdits} // Only admins can create competition props
            canEditProps={allowEdits} // Only admins can edit competition props
            canEditResolutions={allowEdits} // Only admins can resolve competition props
            competitionId={competitionId}
            showCommunityAvg={competitionStatus !== "upcoming"}
          />
        </>
      )}
    </main>
  );
}
