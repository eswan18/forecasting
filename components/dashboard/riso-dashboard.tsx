import { getCompetitions, getCompetitionScores } from "@/lib/db_actions";
import { getRecentlyResolvedForecasts } from "@/lib/db_actions";
import { getCompetitionStatusFromObject } from "@/lib/competition-status";
import { isBinaryForecast } from "@/lib/binary-forecast";
import type { VUser } from "@/types/db_types";
import {
  DashboardView,
  type ResolvedItem,
  type Standing,
} from "./dashboard-view";

/**
 * Data for the signed-in dashboard. Presentation lives in dashboard-view.tsx,
 * which takes plain data so it can be rendered from fixtures.
 */
async function loadStandings(userId: number): Promise<Standing[]> {
  const competitionsResult = await getCompetitions();
  if (!competitionsResult.success) return [];

  const visible = competitionsResult.data.filter(
    (c) => getCompetitionStatusFromObject(c) !== "upcoming",
  );

  const standings = await Promise.all(
    visible.map(async (competition): Promise<Standing | null> => {
      const scoresResult = await getCompetitionScores({
        competitionId: competition.id,
      });
      if (!scoresResult.success) return null;

      // Brier: lower is better, so the leaders are the smallest scores.
      const ranked = [...scoresResult.data.overallScores].sort(
        (a, b) => a.score - b.score,
      );
      const mine = ranked.findIndex((s) => s.userId === userId);
      const status = getCompetitionStatusFromObject(competition);

      return {
        id: competition.id,
        name: competition.name,
        open: status === "forecasts-open" || status === "private",
        leaders: ranked.slice(0, 3),
        you: mine === -1 ? null : { rank: mine + 1, score: ranked[mine].score },
        fieldSize: ranked.length,
      };
    }),
  );

  return standings.filter((s): s is Standing => s !== null);
}

export async function RisoDashboard({ user }: { user: VUser }) {
  const [standings, resolvedResult] = await Promise.all([
    loadStandings(user.id),
    getRecentlyResolvedForecasts({ userId: user.id, limit: 4 }),
  ]);

  // Choice props render as binary only for now, matching the old dashboard.
  const resolved: ResolvedItem[] = resolvedResult.success
    ? resolvedResult.data.filter(isBinaryForecast).map((f) => ({
        forecastId: f.forecast_id,
        propId: f.prop_id,
        propText: f.prop_text,
        forecast: f.forecast!,
        resolution: f.resolution!,
      }))
    : [];

  return (
    <DashboardView standings={standings} resolved={resolved} />
  );
}
