import { getPropsWithUserForecasts } from "@/lib/db_actions/forecasts";
import { getUserFromCookies } from "@/lib/get-user";
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
import { getCompetitionStatus } from "@/lib/competition-status";
import { CompetitionDashboard } from "@/components/competition-dashboard";

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

  // Handle private competitions - check membership
  if (competition.is_private) {
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
      <CompetitionDashboard
        competitionId={competitionId}
        competitionName={competition.name}
        isPrivate={true}
        stats={statsResult.data}
        upcomingDeadlines={deadlinesResult.data}
        scores={scoresResult.data}
        memberCount={memberCountResult.data}
        isAdmin={isAdmin}
        currentUserId={user.id}
        props={propsWithForecastsResult.data}
      />
    );
  }

  // Public competition
  const competitionStatus = getCompetitionStatus(
    competition.forecasts_open_date,
    competition.forecasts_close_date,
    competition.end_date,
  );

  // Check if page is visible (admins can always see, others can't see upcoming)
  const pageIsVisible = user.is_admin || competitionStatus !== "upcoming";
  if (!pageIsVisible) {
    return (
      <InaccessiblePage
        title="Competition Not Available"
        message="This competition is not currently visible to users."
      />
    );
  }

  // For public competitions, site admins can edit
  const isAdmin = user.is_admin;

  // Fetch all data needed for the dashboard in parallel
  const [
    statsResult,
    deadlinesResult,
    scoresResult,
    propsWithForecastsResult,
  ] = await Promise.all([
    getCompetitionStats({ competitionId, userId: user.id }),
    getUpcomingDeadlines({ competitionId, userId: user.id, limit: 5 }),
    getCompetitionScores({ competitionId }),
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
  if (!propsWithForecastsResult.success) {
    return <ErrorPage title={propsWithForecastsResult.error} />;
  }

  return (
    <CompetitionDashboard
      competitionId={competitionId}
      competitionName={competition.name}
      isPrivate={false}
      stats={statsResult.data}
      upcomingDeadlines={deadlinesResult.data}
      scores={scoresResult.data}
      isAdmin={isAdmin}
      currentUserId={user.id}
      props={propsWithForecastsResult.data}
    />
  );
}
