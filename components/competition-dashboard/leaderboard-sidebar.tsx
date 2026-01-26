"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CompetitionScore } from "@/lib/db_actions";

interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  score: number;
  isCurrentUser: boolean;
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
}

function LeaderboardRow({ entry }: LeaderboardRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2",
        entry.isCurrentUser && "font-medium",
      )}
    >
      <div
        className={cn(
          "w-6 text-center text-sm",
          entry.isCurrentUser ? "text-primary" : "text-muted-foreground",
        )}
      >
        {entry.rank}
      </div>
      <div
        className={cn(
          "flex-1 truncate",
          entry.isCurrentUser ? "text-primary" : "text-foreground",
        )}
      >
        {entry.userName}
        {entry.isCurrentUser && (
          <span className="text-primary text-xs ml-1">(you)</span>
        )}
      </div>
      <div
        className={cn(
          "text-sm font-mono",
          entry.isCurrentUser ? "text-primary" : "text-muted-foreground",
        )}
      >
        {entry.score.toFixed(3)}
      </div>
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

  // Build entries with ranks
  const entries: LeaderboardEntry[] = sortedUsers
    .slice(0, maxEntries)
    .map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      userName: user.userName,
      score: user.score,
      isCurrentUser: user.userId === currentUserId,
    }));

  if (entries.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 sticky top-6">
        <h2 className="font-semibold text-foreground mb-4">Leaderboard</h2>
        <p className="text-sm text-muted-foreground">
          No scores yet. Scores appear after props are resolved.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5 sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground">Leaderboard</h2>
        <span className="text-xs text-muted-foreground">Avg Brier</span>
      </div>
      <div className="space-y-1">
        {entries.map((entry) => (
          <LeaderboardRow key={entry.userId} entry={entry} />
        ))}
      </div>
      <Link
        href={`/competitions/${competitionId}?tab=leaderboard`}
        className="block w-full mt-4 text-sm text-primary hover:text-primary/80 text-center"
      >
        Full leaderboard →
      </Link>
    </div>
  );
}
