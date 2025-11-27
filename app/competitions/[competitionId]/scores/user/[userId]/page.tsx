import {
  getCompetitionById,
  getUserScoreBreakdown,
  getCategories,
} from "@/lib/db_actions";
import PageHeading from "@/components/page-heading";
import { loginAndRedirect } from "@/lib/get-user";
import { getUserFromCookies } from "@/lib/get-user";
import ErrorPage from "@/components/pages/error-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Medal, User } from "lucide-react";
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

  const competition = await getCompetitionById(competitionId);
  if (!competition) {
    return <ErrorPage title="Competition not found" />;
  }

  const user = await getUserFromCookies();
  if (!user) {
    await loginAndRedirect({
      url: `competitions/${competitionId}/scores/user/${userId}`,
    });
  }

  const scoreBreakdownResult = await getUserScoreBreakdown({
    competitionId,
    userId,
  });

  if (!scoreBreakdownResult.success) {
    return <ErrorPage title={scoreBreakdownResult.error} />;
  }

  const scoreBreakdown = scoreBreakdownResult.data;
  const categories = await getCategories();

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
    <main className="flex flex-col items-start py-4 px-8 lg:py-8 lg:px-24 w-full">
      <PageHeading
        title={`${scoreBreakdown.userName} - Score Breakdown`}
        breadcrumbs={{
          Competitions: "/competitions",
          [competition.name]: `/competitions/${competition.id}`,
          Scores: `/competitions/${competition.id}/scores`,
          [scoreBreakdown.userName]: `/competitions/${competition.id}/scores/user/${userId}`,
        }}
        icon={User}
        iconGradient="bg-gradient-to-br from-blue-700 to-cyan-400"
      />

      <div className="flex flex-col gap-6 w-full">
        {/* Overall Score Summary */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5" />
              Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {scoreBreakdown.overallScore.toFixed(3)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Average Brier Score across all categories
            </div>
          </CardContent>
        </Card>

        {/* Forecast Penalties */}
        {scoreBreakdown.forecastScores.length > 0 && (
          <Card className="w-full">
            <ForecastScoresTable
              sortedCategoryEntries={sortedCategoryEntries}
              sortedCategoryScores={sortedCategoryScores}
              sortedForecasts={sortedForecasts}
              categories={categories}
            />
          </Card>
        )}

        {scoreBreakdown.forecastScores.length === 0 && (
          <Card className="w-full">
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <p className="text-lg">No resolved forecasts found</p>
                <p className="text-sm mt-1">
                  Scores will appear once propositions are resolved
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
