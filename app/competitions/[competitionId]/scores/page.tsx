import {
  getCategories,
  getCompetitionById,
  getCompetitionScores,
} from "@/lib/db_actions";
import PageHeading from "@/components/page-heading";
import { Suspense } from "react";
import SkeletonCard from "./skeleton-card";
import ErrorPage from "@/components/pages/error-page";
import Leaderboard from "@/components/scores/leaderboard";
import { getUserFromCookies } from "@/lib/get-user";

export default async function Page({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  const competitionResult = await getCompetitionById(competitionId);
  if (!competitionResult.success) {
    return <ErrorPage title={competitionResult.error} />;
  }
  const competition = competitionResult.data;
  const user = await getUserFromCookies();
  return (
    <main className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <PageHeading
          title={`${competition.name} - Scores`}
          breadcrumbs={{
            Competitions: "/competitions",
            [competition.name]: `/competitions/${competition.id}`,
          }}
        />
        <Suspense
          fallback={
            <SkeletonCard className="w-full flex flex-col bg-background h-256" />
          }
        >
          <ScoreChartsCardSection
            competitionId={competitionId}
            currentUserId={user?.id ?? null}
          />
        </Suspense>
      </div>
    </main>
  );
}

async function ScoreChartsCardSection({
  competitionId,
  currentUserId,
}: {
  competitionId: number;
  currentUserId: number | null;
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
    <Leaderboard
      scores={scores}
      categories={categories}
      competitionId={competitionId}
      currentUserId={currentUserId}
    />
  );
}
