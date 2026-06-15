"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/db_types";
import type { CompetitionScore, UserCategoryScore } from "@/lib/db_actions";

// Logarithmic scale: emphasizes differences at the good (low) end.
// log(1 + score*9) maps 0→0 and 1→1, but with log compression, giving more
// visual separation between 0.1 and 0.2 than between 0.8 and 0.9.
// Lower score → longer bar (length is the score encoding; the bar is a single
// hue so the calm palette is preserved).
const getScoreBarWidth = (score: number) => {
  const logScale = Math.log10(1 + score * 9);
  return Math.max(0, (1 - logScale) * 100);
};

interface UserWithRank {
  rank: number;
  userId: number;
  userName: string;
  score: number;
  categoryScores: UserCategoryScore[];
  isCurrentUser: boolean;
  isIncomplete: boolean;
}

interface ScoreRowProps {
  user: UserWithRank;
  expanded: boolean;
  onToggle: () => void;
  categories: Category[];
  competitionId: number;
}

function ScoreRow({
  user,
  expanded,
  onToggle,
  categories,
  competitionId,
}: ScoreRowProps) {
  const barWidth = getScoreBarWidth(user.score);

  // Build category lookup map
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div
      className={cn(
        "transition-colors",
        user.isCurrentUser
          ? "border-l-2 border-l-primary bg-primary/[0.04]"
          : "hover:bg-muted/40",
      )}
    >
      {/* Main row */}
      <div
        className="flex cursor-pointer items-center gap-3 p-3"
        onClick={onToggle}
      >
        {/* Rank */}
        <div className="w-8 shrink-0 text-center font-mono text-sm tabular-nums text-muted-foreground">
          {user.rank}
        </div>

        {/* Name */}
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "truncate text-foreground",
              user.isCurrentUser ? "font-semibold" : "font-medium",
            )}
          >
            {user.userName}
            {user.isCurrentUser && (
              <span className="ml-1 text-sm font-normal text-primary">you</span>
            )}
            {user.isIncomplete && (
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                incomplete
              </span>
            )}
          </span>
        </div>

        {/* Score bar */}
        <div className="hidden w-32 items-center sm:flex">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>

        {/* Score value */}
        <div className="w-16 text-right font-mono text-sm tabular-nums text-foreground">
          {user.score.toFixed(3)}
        </div>

        {/* Expand chevron */}
        <div className="w-6 shrink-0 text-muted-foreground">
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </div>
      </div>

      {/* Expanded category breakdown */}
      {expanded && (
        <div className="px-3 pb-3 pl-14">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Category Breakdown
              </span>
              <Link
                href={`/competitions/${competitionId}/scores/user/${user.userId}`}
                className="text-xs font-medium text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                View details
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {user.categoryScores.map((cs) => {
                const catBarWidth = getScoreBarWidth(cs.score);
                const categoryName =
                  categoryMap.get(cs.categoryId) || "Unknown";
                return (
                  <div
                    key={cs.categoryId}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="w-24 truncate text-muted-foreground">
                      {categoryName}
                    </span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${catBarWidth}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-xs tabular-nums text-foreground">
                      {cs.score.toFixed(3)}
                    </span>
                  </div>
                );
              })}
              {user.categoryScores.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No category scores available
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface LeaderboardProps {
  scores: CompetitionScore;
  categories: Category[];
  competitionId: number;
  currentUserId: number | null;
  userForecastCount?: number;
}

export default function Leaderboard({
  scores,
  categories,
  competitionId,
  currentUserId,
  userForecastCount,
}: LeaderboardProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Sort users by score (lower is better for Brier scores)
  const sortedUsers = [...scores.overallScores].sort(
    (a, b) => a.score - b.score,
  );

  const incompleteSet = new Set(scores.incompleteUserIds);

  // Build users with ranks and category scores
  const usersWithRanks: UserWithRank[] = sortedUsers.map((user, index) => ({
    rank: index + 1,
    userId: user.userId,
    userName: user.userName,
    score: user.score,
    categoryScores: scores.categoryScores.filter(
      (cs) => cs.userId === user.userId,
    ),
    isCurrentUser: user.userId === currentUserId,
    isIncomplete: incompleteSet.has(user.userId),
  }));

  // Find current user's data
  const currentUserData = usersWithRanks.find((u) => u.isCurrentUser);

  const toggleRow = (userId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  if (sortedUsers.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No scores available yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Scores will appear once propositions are resolved
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score explanation */}
      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Lower is better.</span>{" "}
          Brier scores range from 0 (perfect) to 1 (completely wrong). A score
          of 0.25 is equivalent to random guessing.
        </div>
      </div>

      {/* Your stats card */}
      {currentUserData && (
        <div className="rounded-lg border border-primary/30 bg-primary/[0.03] p-4">
          <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Your Performance
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
                #{currentUserData.rank}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Rank
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
                {currentUserData.score.toFixed(3)}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Brier Score
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
                {userForecastCount ?? 0}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Forecasts
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Podium for top 3 */}
      {usersWithRanks.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {usersWithRanks.slice(0, 3).map((user, i) => (
            <Link
              key={user.userId}
              href={`/competitions/${competitionId}/scores/user/${user.userId}`}
              className={cn(
                "rounded-lg border bg-card p-4 text-center transition-colors hover:border-foreground/20",
                i === 0 && "border-primary/40",
              )}
            >
              <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {["1st", "2nd", "3rd"][i]}
              </div>
              <div className="mt-1 truncate text-sm font-medium text-foreground">
                {user.userName}
                {user.isIncomplete && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    incomplete
                  </span>
                )}
              </div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
                {user.score.toFixed(3)}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Main leaderboard */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="flex items-center gap-3 border-b bg-muted/30 px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          <span className="w-8 shrink-0 text-center">#</span>
          <span className="flex-1">Forecaster</span>
          <span className="hidden w-32 sm:block" />
          <span className="w-16 text-right">Brier</span>
          <span className="w-6 shrink-0" />
        </div>

        <div className="divide-y">
          {usersWithRanks.map((user) => (
            <ScoreRow
              key={user.userId}
              user={user}
              expanded={expandedRows.has(user.userId)}
              onToggle={() => toggleRow(user.userId)}
              categories={categories}
              competitionId={competitionId}
            />
          ))}
        </div>
      </div>

      {/* Footnote for incomplete users */}
      {scores.incompleteUserIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Users marked incomplete have not forecasted all propositions.
        </p>
      )}
    </div>
  );
}
