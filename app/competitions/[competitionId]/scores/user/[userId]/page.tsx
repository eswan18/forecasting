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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Medal, User, ExternalLink } from "lucide-react";
import Link from "next/link";

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

        {/* Category Scores */}
        {scoreBreakdown.categoryScores.length > 0 && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Category Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scoreBreakdown.categoryScores.map((categoryScore) => {
                  const category = categories.find(
                    (cat) => cat.id === categoryScore.categoryId,
                  );
                  return (
                    <div
                      key={categoryScore.categoryId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="font-medium">
                        {category?.name || "Unknown Category"}
                      </div>
                      <div className="text-lg font-semibold">
                        {categoryScore.score.toFixed(3)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Individual Forecast Scores */}
        {scoreBreakdown.forecastScores.length > 0 && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Individual Forecast Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proposition</TableHead>
                      <TableHead className="text-right">Forecast</TableHead>
                      <TableHead className="text-right">Resolution</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(forecastsByCategory).map(
                      ([categoryKey, forecasts]) => {
                        const categoryId =
                          categoryKey === "uncategorized"
                            ? null
                            : parseInt(categoryKey, 10);
                        const category =
                          categoryId !== null
                            ? categories.find((cat) => cat.id === categoryId)
                            : null;

                        return (
                          <>
                            {/* Category Header Row */}
                            <TableRow key={`category-${categoryKey}`}>
                              <TableCell
                                colSpan={4}
                                className="font-semibold text-lg bg-muted/50 py-3"
                              >
                                {category?.name || "Uncategorized"}
                              </TableCell>
                            </TableRow>
                            {/* Forecast Rows */}
                            {forecasts.map((forecast) => (
                              <TableRow key={forecast.forecastId}>
                                <TableCell className="max-w-md">
                                  <div className="flex items-center gap-2">
                                    <div className="truncate flex-1">
                                      {forecast.propText}
                                    </div>
                                    <Link
                                      href={`/props/${forecast.propId}`}
                                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Link>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {(forecast.forecast * 100).toFixed(1)}%
                                </TableCell>
                                <TableCell className="text-right">
                                  {forecast.resolution === null
                                    ? "-"
                                    : forecast.resolution
                                      ? "Yes"
                                      : "No"}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {forecast.score !== null
                                    ? forecast.score.toFixed(3)
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </>
                        );
                      },
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
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
