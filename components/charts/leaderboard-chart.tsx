"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Category } from "@/types/db_types";
import { CompetitionScore } from "@/lib/db_actions";
import ScoreCard from "@/components/scores/score-card";

interface LeaderboardChartProps {
  scores: CompetitionScore;
  categories: Category[];
  competitionId: number;
}

export default function LeaderboardChart({
  scores,
  categories,
  competitionId,
}: LeaderboardChartProps) {
  // Sort users by score (lower is better for Brier scores)
  const sortedUsers = [...scores.overallScores].sort(
    (a, b) => a.score - b.score,
  );

  // Find the max score for scaling the chart
  const maxScore = Math.max(
    ...sortedUsers.map((user) => user.score),
    ...scores.categoryScores.map((cs) => cs.score),
  );

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
    <div className="flex flex-col w-full gap-y-6 items-start">
      {/* Explanation of Scores */}
      <div className="w-full rounded-lg">
        <h4 className="font-semibold mb-2">How to Read Scores</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            <strong>Lower scores are better</strong> - Brier scores measure
            forecasting accuracy. Scores range from 0 (perfect) to 1 (worst).
          </p>
        </div>
      </div>

      {/* Score Cards */}
      <div className="flex flex-col gap-y-3 w-full">
        {sortedUsers.map((userScore, index) => {
          const userCategoryScores = getUserCategoryScores(userScore.userId);
          return (
            <ScoreCard
              key={userScore.userId}
              rank={index + 1}
              userId={userScore.userId}
              userName={userScore.userName}
              overallScore={userScore.score}
              categoryScores={userCategoryScores}
              categories={categories}
              competitionId={competitionId}
              maxScore={maxScore}
            />
          );
        })}
      </div>
    </div>
  );
}
