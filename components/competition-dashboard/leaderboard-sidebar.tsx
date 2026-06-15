"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompetitionScore } from "@/lib/db_actions";

interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  score: number;
  isCurrentUser: boolean;
  isIncomplete: boolean;
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
}

function LeaderboardRow({ entry }: LeaderboardRowProps) {
  const emphasized = entry.isCurrentUser || entry.rank === 1;
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="w-4 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
          {entry.rank}
        </span>
        <span
          className={cn(
            "truncate text-sm text-foreground",
            emphasized ? "font-semibold" : "font-medium",
          )}
        >
          {entry.userName}
          {entry.isCurrentUser && (
            <span className="ml-1 text-xs font-normal text-primary">you</span>
          )}
          {entry.isIncomplete && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              incomplete
            </span>
          )}
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 font-mono text-sm tabular-nums",
          emphasized ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {entry.score.toFixed(3)}
      </span>
    </div>
  );
}

interface LeaderboardSidebarProps {
  scores: CompetitionScore;
  competitionId: number;
  currentUserId: number | null;
  maxEntries?: number;
}

export function LeaderboardSidebar({
  scores,
  competitionId,
  currentUserId,
  maxEntries = 6,
}: LeaderboardSidebarProps) {
  // Sort users by score (lower is better for Brier scores)
  const sortedUsers = [...scores.overallScores].sort(
    (a, b) => a.score - b.score,
  );

  const incompleteSet = new Set(scores.incompleteUserIds);

  // Build entries with ranks
  const entries: LeaderboardEntry[] = sortedUsers
    .slice(0, maxEntries)
    .map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      userName: user.userName,
      score: user.score,
      isCurrentUser: user.userId === currentUserId,
      isIncomplete: incompleteSet.has(user.userId),
    }));

  if (entries.length === 0) {
    return (
      <div className="sticky top-6 rounded-lg border bg-card p-5">
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Standings
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          No scores yet. Scores appear after props are resolved.
        </p>
      </div>
    );
  }

  return (
    <div className="sticky top-6 rounded-lg border bg-card p-2">
      <div className="flex items-center justify-between px-3 pb-2 pt-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        <span>Forecaster</span>
        <span>Avg Brier</span>
      </div>

      <div className="flex flex-col">
        {entries.map((entry) => (
          <LeaderboardRow key={entry.userId} entry={entry} />
        ))}
      </div>

      <Link
        href={`/competitions/${competitionId}?tab=leaderboard`}
        className="mt-1 flex items-center justify-center gap-1 border-t pt-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Full leaderboard
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
