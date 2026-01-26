"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Info } from "lucide-react";
import type { Category } from "@/types/db_types";
import type { CompetitionScore, UserCategoryScore } from "@/lib/db_actions";

// Logarithmic scale: emphasizes differences at the good (low) end
// log(1 + score*9) maps 0→0 and 1→1, but with log compression
// This gives more visual separation between 0.1 and 0.2 than between 0.8 and 0.9
const getScoreBarWidth = (score: number) => {
  const logScale = Math.log10(1 + score * 9);
  return Math.max(0, (1 - logScale) * 100);
};

const getScoreColor = (score: number) => {
  if (score <= 0.1) return { bar: "bg-green-500", text: "text-green-700 dark:text-green-400" };
  if (score <= 0.18) return { bar: "bg-lime-500", text: "text-lime-700 dark:text-lime-400" };
  if (score <= 0.25) return { bar: "bg-yellow-500", text: "text-yellow-700 dark:text-yellow-400" };
  if (score <= 0.35) return { bar: "bg-orange-500", text: "text-orange-700 dark:text-orange-400" };
  return { bar: "bg-red-500", text: "text-red-700 dark:text-red-400" };
};

const getRankStyle = (rank: number) => {
  if (rank === 1) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (rank === 2) return "bg-gray-100 text-gray-700 border-gray-300";
  if (rank === 3) return "bg-orange-100 text-orange-800 border-orange-300";
  // Invisible circle for alignment, just show the number
  return "bg-transparent text-muted-foreground border-transparent";
};

interface UserWithRank {
  rank: number;
  userId: number;
  userName: string;
  score: number;
  categoryScores: UserCategoryScore[];
  isCurrentUser: boolean;
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
  const colors = getScoreColor(user.score);
  const barWidth = getScoreBarWidth(user.score);

  // Build category lookup map
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div
      className={`${user.isCurrentUser ? "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-l-blue-500" : "hover:bg-muted/50"}`}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={onToggle}
      >
        {/* Rank badge */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border shrink-0 ${getRankStyle(user.rank)}`}
        >
          {user.rank}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <span
            className={`font-medium ${user.isCurrentUser ? "text-blue-900 dark:text-blue-100" : "text-foreground"}`}
          >
            {user.userName}
            {user.isCurrentUser && (
              <span className="text-blue-600 dark:text-blue-400 text-sm ml-1">
                (you)
              </span>
            )}
          </span>
        </div>

        {/* Score bar */}
        <div className="w-32 flex items-center gap-2 hidden sm:flex">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${colors.bar}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>

        {/* Score value */}
        <div className={`w-16 text-right font-mono text-sm ${colors.text}`}>
          {user.score.toFixed(3)}
        </div>

        {/* Expand chevron */}
        <div className="w-6 text-muted-foreground shrink-0">
          <ChevronDown
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Expanded category breakdown */}
      {expanded && (
        <div className="px-3 pb-3 pl-14">
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">
                Category Breakdown
              </span>
              <Link
                href={`/competitions/${competitionId}/scores/user/${user.userId}`}
                className="text-xs text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                View details
              </Link>
            </div>
            {user.categoryScores.map((cs) => {
              const catColors = getScoreColor(cs.score);
              const catBarWidth = getScoreBarWidth(cs.score);
              const categoryName = categoryMap.get(cs.categoryId) || "Unknown";
              return (
                <div
                  key={cs.categoryId}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="w-24 text-muted-foreground truncate">
                    {categoryName}
                  </span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${catColors.bar}`}
                      style={{ width: `${catBarWidth}%` }}
                    />
                  </div>
                  <span
                    className={`w-12 text-right font-mono text-xs ${catColors.text}`}
                  >
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
    (a, b) => a.score - b.score
  );

  // Build users with ranks and category scores
  const usersWithRanks: UserWithRank[] = sortedUsers.map((user, index) => ({
    rank: index + 1,
    userId: user.userId,
    userName: user.userName,
    score: user.score,
    categoryScores: scores.categoryScores.filter(
      (cs) => cs.userId === user.userId
    ),
    isCurrentUser: user.userId === currentUserId,
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
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <p className="text-lg text-muted-foreground">No scores available yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Scores will appear once propositions are resolved
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score explanation */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              Lower is better.
            </span>{" "}
            Brier scores range from 0 (perfect) to 1 (completely wrong). A score
            of 0.25 is equivalent to random guessing.
          </div>
        </div>
      </div>

      {/* Your stats card */}
      {currentUserData && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
            Your Performance
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                #{currentUserData.rank}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-400">
                Rank
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {currentUserData.score.toFixed(3)}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-400">
                Brier Score
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {userForecastCount ?? 0}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-400">
                Forecasts
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Podium for top 3 */}
      {usersWithRanks.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {usersWithRanks.slice(0, 3).map((user, i) => {
            const colors = getScoreColor(user.score);
            const medals = ["1st", "2nd", "3rd"];
            const medalColors = [
              "bg-yellow-100 border-yellow-300",
              "bg-gray-100 border-gray-300",
              "bg-orange-100 border-orange-300",
            ];
            const labelColors = [
              "text-yellow-700",
              "text-gray-500",
              "text-orange-700",
            ];
            return (
              <Link
                key={user.userId}
                href={`/competitions/${competitionId}/scores/user/${user.userId}`}
                className={`border rounded-lg p-4 text-center hover:shadow-md transition-shadow ${medalColors[i]}`}
              >
                <div className={`text-xs font-bold mb-1 ${labelColors[i]}`}>
                  {medals[i]}
                </div>
                <div className="font-medium text-gray-900 truncate text-sm">
                  {user.userName}
                </div>
                <div className={`text-lg font-mono font-bold ${colors.text}`}>
                  {user.score.toFixed(3)}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Main leaderboard */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <span className="text-sm font-medium text-foreground">
            All Rankings
          </span>
          <span className="text-xs text-muted-foreground">
            Click row to expand
          </span>
        </div>

        <div className="divide-y divide-border">
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
    </div>
  );
}
