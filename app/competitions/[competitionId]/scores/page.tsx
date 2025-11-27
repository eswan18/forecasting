import {
  getCategories,
  getCompetitionById,
  getCompetitionScores,
} from "@/lib/db_actions";
import PageHeading from "@/components/page-heading";
import { Suspense } from "react";
import { loginAndRedirect } from "@/lib/get-user";

import { getUserFromCookies } from "@/lib/get-user";
import SkeletonCard from "./skeleton-card";
import ErrorPage from "@/components/pages/error-page";
import LeaderboardChart from "@/components/charts/leaderboard-chart";
import { Medal } from "lucide-react";

export default async function Page({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  const competition = await getCompetitionById(competitionId);
  if (!competition) {
    return <ErrorPage title="Competition not found" />;
  }
  const user = await getUserFromCookies();
  if (!user) {
    await loginAndRedirect({ url: `competitions/${competitionId}/scores` });
  }
  return (
    <main className="flex flex-col items-start py-4 px-8 lg:py-8 lg:px-24 w-full">
      <PageHeading
        title={`${competition.name} - Scores`}
        breadcrumbs={{
          Competitions: "/competitions",
          [competition.name]: `/competitions/${competition.id}`,
          Scores: `/competitions/${competition.id}/scores`,
        }}
        icon={Medal}
        iconGradient="bg-gradient-to-br from-green-700 to-cyan-400"
      />
      <Suspense
        fallback={
          <SkeletonCard className="w-full flex flex-col bg-background h-256" />
        }
      >
        <ScoreChartsCardSection competitionId={competitionId} />
      </Suspense>
    </main>
  );
}

async function ScoreChartsCardSection({
  competitionId,
}: {
  competitionId: number;
}) {
  // We break this out so that we can wrap it in a Suspense component.
  const categoriesResult = await getCategories();
  if (!categoriesResult.success) {
    throw new Error(categoriesResult.error);
  }
  const categories = categoriesResult.data;

  const scoresResult = await getCompetitionScores({ competitionId });
  if (!scoresResult.success) {
    throw new Error(scoresResult.error);
  }

  const scores = scoresResult.data;
  return (
    <LeaderboardChart
      scores={scores}
      categories={categories}
      competitionId={competitionId}
    />
  );
}
