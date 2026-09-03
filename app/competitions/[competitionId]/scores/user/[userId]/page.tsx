import { getCompetitionById, getUserScoreBreakdown } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
import ErrorPage from "@/components/pages/error-page";
import {
  buildFlat,
  buildSections,
} from "@/components/user-scores/build-sections";
import { UserScores } from "@/components/user-scores/user-scores";

export default async function UserScorePage({
  params,
}: {
  params: Promise<{ competitionId: string; userId: string }>;
}) {
  const { competitionId: competitionIdString, userId: userIdString } =
    await params;
  const competitionId = parseInt(competitionIdString, 10);
  const userId = parseInt(userIdString, 10);

  if (isNaN(competitionId) || isNaN(userId)) {
    return <ErrorPage title="Invalid competition or user ID" />;
  }

  const [viewer, competitionResult, breakdownResult] = await Promise.all([
    getUserFromCookies(),
    getCompetitionById(competitionId),
    getUserScoreBreakdown({ competitionId, userId }),
  ]);

  if (!competitionResult.success) {
    return <ErrorPage title={competitionResult.error} />;
  }
  if (!breakdownResult.success) {
    return <ErrorPage title={breakdownResult.error} />;
  }

  const competition = competitionResult.data;
  const breakdown = breakdownResult.data;

  return (
    <UserScores
      competitionId={competitionId}
      competitionName={competition.name}
      userName={breakdown.userName}
      isSelf={viewer?.id === userId}
      overallScore={breakdown.overallScore}
      forecastCount={breakdown.forecastScores.length}
      sections={buildSections(breakdown)}
      flat={buildFlat(breakdown)}
    />
  );
}
