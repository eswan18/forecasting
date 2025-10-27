"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Category } from "@/types/db_types";
import { CompetitionScore } from "@/lib/db_actions";

interface LeaderboardChartProps {
  scores: CompetitionScore;
  categories: Category[];
}

export default function LeaderboardChart({
  scores,
  categories,
}: LeaderboardChartProps) {
  // Sort users by score (lower is better for Brier scores)
  const sortedUsers = [...scores.overallScores].sort(
    (a, b) => a.score - b.score,
  );

  // Find the best score (lowest) for scaling
  const bestScore = Math.min(...sortedUsers.map((user) => user.score));
  const worstScore = Math.max(...sortedUsers.map((user) => user.score));
  const maxBarWidth = 300; // Maximum width for the score bars

  const getScoreBarWidth = (score: number) => {
    if (worstScore === bestScore) return maxBarWidth;
    return score * maxBarWidth;
  };

  // Get category scores for each user
  const getUserCategoryScores = (userId: number) => {
    return scores.categoryScores
      .filter((score) => score.userId === userId)
      .sort((a, b) => a.categoryId - b.categoryId);
  };

  if (sortedUsers.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg">No scores available yet</p>
            <p className="text-sm">
              Scores will appear once propositions are resolved
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col w-full gap-y-8 items-start">
      {/* Explanation of Scores */}
      <div className="w-full rounded-lg">
        <h4 className="font-semibold mb-2">How to Read Scores</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            • <strong>Lower scores are better</strong> - Brier scores measure
            forecasting accuracy
          </p>
          <p>• All bars use the same scale for direct comparison</p>
          <p>
            • Scores are calculated as the average of squared differences
            between predictions and outcomes
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-y-4 w-full">
        {sortedUsers.map((userScore, index) => {
          const userCategoryScores = getUserCategoryScores(userScore.userId);
          return (
            <Card key={userScore.userId} className="w-full">
              <CardContent
                className="p-6
                grid grid-cols-[5rem_auto] grid-rows-2 grid-flow-col
                lg:flex lg:flex-row lg:gap-x-4 lg:items-center"
              >
                {/* User Info */}
                <div className="flex items-center gap-3 mb-1 lg:w-60">
                  <h3 className="text-lg font-semibold">
                    {userScore.userName}
                  </h3>
                </div>

                {/* Score as Text */}
                <div className="lg:text-right flex flex-col justify-end">
                  <div className="text-lg lg:text-2xl font-bold">
                    {userScore.score.toFixed(3)}
                  </div>
                  <div className="hidden lg:block text-xs text-muted-foreground">
                    Brier Score
                  </div>
                </div>

                {/* Visual Bars */}
                <div className="ml-auto lg:w-100 grid grid-cols-[8rem_10rem] gap-y-1 gap-x-1 row-span-2">
                  {/* Overall Score Bar */}
                  <div className="text-sm text-muted-foreground mb-2 text-right">
                    Overall:
                  </div>
                  <div className="flex flex-row justify-start items-center gap-x-2 mb-2">
                    <div
                      className="h-3 rounded-full bg-primary"
                      style={{
                        width: `${getScoreBarWidth(userScore.score)}px`,
                      }}
                    />
                    <div className="text-xs text-muted-foreground min-w-[40px]">
                      {userScore.score.toFixed(3)}
                    </div>
                  </div>

                  {/* Category Score Bars */}
                  {userCategoryScores.map((categoryScore) => {
                    const category = categories.find(
                      (cat) => cat.id === categoryScore.categoryId,
                    );
                    // It looks strange if the bar is too thin, so we set a minimum width of 10px
                    const barWidth = Math.max(
                      getScoreBarWidth(categoryScore.score),
                      4,
                    );
                    return (
                      <>
                        <div className="text-xs text-muted-foreground truncate text-right">
                          {category?.name || "Unknown"}:
                        </div>
                        <div className="flex flex-row justify-start items-center gap-x-2">
                          <div
                            className="h-2 rounded-full bg-accent/60"
                            style={{
                              width: `${barWidth}px`,
                            }}
                          />
                          <div className="text-xs text-muted-foreground min-w-[40px]">
                            {categoryScore.score.toFixed(3)}
                          </div>
                        </div>
                      </>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
