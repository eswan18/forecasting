/**
 * Leaderboard ranking utilities
 *
 * Pure logic, deliberately kept out of the components so it can be unit tested
 * without transitively importing `lib/database.ts`.
 *
 * A forecaster is "incomplete" when they haven't forecasted every prop in the
 * competition — see `getCompetitionScores` in `lib/db_actions/competition-scores.ts`,
 * which computes `incompleteUserIds`. Their Brier score is an average over a
 * partial set of props, so it isn't comparable to a complete forecaster's, and
 * the leaderboard hides them by default.
 */

/** A forecaster's overall score. Structurally compatible with `UserScore`. */
export interface ForecasterScore {
  userId: number;
  userName: string;
  score: number;
}

export interface RankedForecaster extends ForecasterScore {
  rank: number;
  isCurrentUser: boolean;
  isIncomplete: boolean;
}

export interface RankForecastersOptions {
  overallScores: ForecasterScore[];
  incompleteUserIds: number[];
  currentUserId: number | null;
  /**
   * When false, incomplete forecasters are dropped and ranks renumber over
   * those who remain — so the visible board always reads 1..N with no gaps.
   */
  showIncomplete: boolean;
}

/**
 * Sort forecasters best-first and assign ranks.
 *
 * Brier scores are "lower is better", so this sorts ascending. Ranks are
 * assigned after filtering, over the visible set only.
 */
export function rankForecasters({
  overallScores,
  incompleteUserIds,
  currentUserId,
  showIncomplete,
}: RankForecastersOptions): RankedForecaster[] {
  const incompleteSet = new Set(incompleteUserIds);

  return [...overallScores]
    .sort((a, b) => a.score - b.score)
    .filter((user) => showIncomplete || !incompleteSet.has(user.userId))
    .map((user, index) => ({
      ...user,
      rank: index + 1,
      isCurrentUser: user.userId === currentUserId,
      isIncomplete: incompleteSet.has(user.userId),
    }));
}
