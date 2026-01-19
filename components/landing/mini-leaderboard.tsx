import { getCompetitionScores } from "@/lib/db_actions";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface MiniLeaderboardProps {
  competitionId: number;
  limit?: number;
}

export default async function MiniLeaderboard({
  competitionId,
  limit = 5,
}: MiniLeaderboardProps) {
  const scoresResult = await getCompetitionScores({ competitionId });

  if (!scoresResult.success) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            Unable to load standings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const scores = scoresResult.data;
  const sortedUsers = [...scores.overallScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);

  if (sortedUsers.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            No scores available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col gap-2">
          {sortedUsers.map((userScore, index) => (
            <div
              key={userScore.userId}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-5 text-right">
                  {index + 1}.
                </span>
                <span className="font-medium">{userScore.userName}</span>
              </div>
              <span className="text-muted-foreground tabular-nums">
                {userScore.score.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <Link
          href={`/competitions/${competitionId}/scores`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-4"
        >
          More <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
