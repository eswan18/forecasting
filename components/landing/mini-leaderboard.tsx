import { getCompetitionScores } from "@/lib/db_actions";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn, focusRing } from "@/lib/utils";

interface MiniLeaderboardProps {
  competitionId: number;
  limit?: number;
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export default async function MiniLeaderboard({
  competitionId,
  limit = 5,
}: MiniLeaderboardProps) {
  const scoresResult = await getCompetitionScores({ competitionId });

  if (!scoresResult.success) {
    return <Panel>Unable to load standings.</Panel>;
  }

  const scores = scoresResult.data;
  const incompleteSet = new Set(scores.incompleteUserIds);
  const sortedUsers = [...scores.overallScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);

  if (sortedUsers.length === 0) {
    return <Panel>No scores available yet.</Panel>;
  }

  return (
    <Link
      href={`/competitions/${competitionId}?tab=leaderboard`}
      className={cn(
        "group block rounded-lg border bg-card p-2 transition-colors hover:border-foreground/20",
        focusRing,
      )}
    >
      <div className="flex items-center justify-between px-3 pb-2 pt-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        <span>Forecaster</span>
        <span>Avg Brier</span>
      </div>

      <div className="flex flex-col">
        {sortedUsers.map((userScore, index) => {
          const isLeader = index === 0;
          return (
            <div
              key={userScore.userId}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-4 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <span
                  className={cn(
                    "truncate text-sm text-foreground",
                    isLeader ? "font-semibold" : "font-medium",
                  )}
                >
                  {userScore.userName}
                  {incompleteSet.has(userScore.userId) && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      incomplete
                    </span>
                  )}
                </span>
              </div>
              <span
                className={cn(
                  "shrink-0 font-mono text-sm tabular-nums",
                  isLeader ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {userScore.score.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-1 flex items-center justify-center gap-1 border-t pt-2.5 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        Full standings
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
