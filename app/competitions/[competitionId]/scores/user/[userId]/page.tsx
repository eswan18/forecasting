import {
  getCompetitionById,
  getUserScoreBreakdown,
  getCategories,
} from "@/lib/db_actions";
import ErrorPage from "@/components/pages/error-page";
import { Container } from "@/components/ui/container";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ForecastScoresTable } from "./components/forecast-scores-table";

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

  const competitionResult = await getCompetitionById(competitionId);
  if (!competitionResult.success) {
    return <ErrorPage title={competitionResult.error} />;
  }
  const competition = competitionResult.data;

  const scoreBreakdownResult = await getUserScoreBreakdown({
    competitionId,
    userId,
  });

  if (!scoreBreakdownResult.success) {
    return <ErrorPage title={scoreBreakdownResult.error} />;
  }

  const scoreBreakdown = scoreBreakdownResult.data;

  const categoriesResult = await getCategories();
  if (!categoriesResult.success) {
    return <ErrorPage title={categoriesResult.error} />;
  }
  const categories = categoriesResult.data;

  // Sort category scores by penalty (descending)
  const sortedCategoryScores = [...scoreBreakdown.categoryScores].sort(
    (a, b) => b.score - a.score,
  );

  // Group forecast scores by category
  const forecastsByCategory = scoreBreakdown.forecastScores.reduce(
    (acc, forecast) => {
      const categoryKey = forecast.categoryId ?? "uncategorized";
      if (!acc[categoryKey]) {
        acc[categoryKey] = [];
      }
      acc[categoryKey].push(forecast);
      return acc;
    },
    {} as Record<
      number | "uncategorized",
      typeof scoreBreakdown.forecastScores
    >,
  );

  // Create sorted entries array based on category penalty order
  // Also sort forecasts within each category by penalty (descending)
  const sortedCategoryEntries: Array<
    [number | "uncategorized", typeof scoreBreakdown.forecastScores]
  > = sortedCategoryScores.map((categoryScore) => {
    const categoryKey: number | "uncategorized" =
      categoryScore.categoryId ?? "uncategorized";
    const forecasts = forecastsByCategory[categoryKey] || [];
    // Sort forecasts by penalty (score) descending, handling null scores
    const sortedForecasts = [...forecasts].sort((a, b) => {
      const scoreA = a.score ?? 0;
      const scoreB = b.score ?? 0;
      return scoreB - scoreA;
    });
    return [categoryKey, sortedForecasts];
  });

  // Add uncategorized if it exists and wasn't already included
  if (forecastsByCategory["uncategorized"]) {
    const hasUncategorized = sortedCategoryScores.some(
      (cs) => cs.categoryId === null,
    );
    if (!hasUncategorized) {
      const uncategorizedForecasts = forecastsByCategory["uncategorized"];
      // Sort uncategorized forecasts by penalty (score) descending
      const sortedUncategorized = [...uncategorizedForecasts].sort((a, b) => {
        const scoreA = a.score ?? 0;
        const scoreB = b.score ?? 0;
        return scoreB - scoreA;
      });
      sortedCategoryEntries.push(["uncategorized", sortedUncategorized]);
    }
  }

  // Create sorted forecasts array for penalty view (all forecasts sorted by penalty descending)
  const sortedForecasts = [...scoreBreakdown.forecastScores].sort((a, b) => {
    const scoreA = a.score ?? 0;
    const scoreB = b.score ?? 0;
    return scoreB - scoreA;
  });

  return (
    <main className="py-10 lg:py-14">
      <Container>
        <header className="mb-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/competitions">
                  Competitions
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/competitions/${competition.id}`}>
                  {competition.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={`/competitions/${competition.id}?tab=leaderboard`}
                >
                  Scores
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="mt-4">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Score Breakdown
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {scoreBreakdown.userName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {competition.name}
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-6">
          {/* Overall score — flat instrument panel */}
          <div className="rounded-lg border bg-card p-5 sm:p-6">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Overall Brier Score
            </div>
            <div className="mt-2 font-mono text-5xl font-semibold tabular-nums tracking-tight text-foreground">
              {scoreBreakdown.overallScore.toFixed(3)}
            </div>
            <div className="mt-1.5 text-sm text-muted-foreground">
              Average across all categories · lower is better
            </div>
          </div>

          {/* Forecast Penalties */}
          {scoreBreakdown.forecastScores.length > 0 ? (
            <ForecastScoresTable
              sortedCategoryEntries={sortedCategoryEntries}
              sortedCategoryScores={sortedCategoryScores}
              sortedForecasts={sortedForecasts}
              categories={categories}
            />
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                No resolved forecasts found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Scores will appear once propositions are resolved
              </p>
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
