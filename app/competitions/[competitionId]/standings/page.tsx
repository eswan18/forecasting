import { getCategories, getCompetitionScores } from "@/lib/db_actions";
import ErrorPage from "@/components/pages/error-page";
import { Standings } from "@/components/standings/standings";
import { competitionAccess } from "../access";
import { AccessDenied } from "../access-denied";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ competitionId: string }>;
  searchParams: Promise<{ showIncomplete?: string }>;
}) {
  const { competitionId: idString } = await params;
  const access = await competitionAccess(idString);
  if (!access.ok) return <AccessDenied access={access} />;

  const { competition, user } = access;
  const [scoresResult, categoriesResult] = await Promise.all([
    getCompetitionScores({ competitionId: competition.id }),
    getCategories(),
  ]);
  if (!scoresResult.success) return <ErrorPage title={scoresResult.error} />;
  if (!categoriesResult.success) {
    return <ErrorPage title={categoriesResult.error} />;
  }

  // A filter over the page's own content, not navigation, so this one stays a
  // query param.
  const { showIncomplete } = await searchParams;

  return (
    <Standings
      scores={scoresResult.data}
      categories={categoriesResult.data}
      competitionId={competition.id}
      competitionName={competition.name}
      currentUserId={user.id}
      showIncomplete={showIncomplete === "1"}
      toggleHref={
        showIncomplete === "1"
          ? `/competitions/${competition.id}/standings`
          : `/competitions/${competition.id}/standings?showIncomplete=1`
      }
    />
  );
}
