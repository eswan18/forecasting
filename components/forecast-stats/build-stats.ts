import type { BinaryForecast } from "@/lib/binary-forecast";
import type {
  BoldTake,
  Certainty,
  ForecastStatsData,
  PropSpread,
} from "./types";

export function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Linear-interpolated quantile, the same one the old cards used. */
export function quantile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const i = p * (sorted.length - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

/** How many boldest takes the sheet prints before it stops. */
const BOLDEST_SHOWN = 8;
/**
 * Below this, a quartile box is theatre: at n = 4 the box is literally "drop
 * the min and max", and at n ≤ 2 the "middle half" is an interpolation between
 * two people. Those props still plot their points and their mean; they just
 * don't claim a spread.
 */
export const MIN_FOR_BOX = 4;
/**
 * A "bold take" is a distance from what everyone else said, and the crowd mean
 * includes the person themselves — so at n = 1 the gap is always zero, and at
 * n = 2 both forecasters show the same halved gap. Neither is a take.
 */
export const MIN_FOR_BOLD = 3;

/**
 * Everything the forecast-stats sheet renders, from the one query it makes.
 *
 * All three readings come from the same set of binary forecasts, which is the
 * argument for putting them on one page: they are three questions about one
 * crowd, not three unrelated statistics.
 */
export function buildForecastStats({
  forecasts,
  competitionId,
  competitionName,
  currentUserId,
}: {
  forecasts: BinaryForecast[];
  competitionId: number;
  competitionName: string;
  currentUserId: number;
}): ForecastStatsData {
  const byProp = new Map<number, BinaryForecast[]>();
  for (const f of forecasts) {
    const bucket = byProp.get(f.prop_id);
    if (bucket) bucket.push(f);
    else byProp.set(f.prop_id, [f]);
  }

  const spreads: PropSpread[] = [...byProp.values()].map((group) => {
    const values = group.map((f) => f.forecast);
    const mine = group.find((f) => f.user_id === currentUserId);
    return {
      propId: group[0].prop_id,
      text: group[0].prop_text,
      n: group.length,
      min: Math.min(...values),
      p25: quantile(values, 0.25),
      mean: mean(values),
      p75: quantile(values, 0.75),
      max: Math.max(...values),
      yours: mine ? mine.forecast : null,
    };
  });

  // Most contested first: the page is about where the crowd splits, so the
  // props it agrees on are the least interesting thing on it. Props too thin
  // to have a spread at all sink to the bottom rather than sorting as though
  // they were unanimous.
  spreads.sort((a, b) => {
    const aThin = a.n < MIN_FOR_BOX;
    const bThin = b.n < MIN_FOR_BOX;
    if (aThin !== bThin) return aThin ? 1 : -1;
    return b.p75 - b.p25 - (a.p75 - a.p25);
  });

  const crowdMean = new Map(
    [...byProp.entries()].map(([propId, group]) => [
      propId,
      mean(group.map((f) => f.forecast)),
    ]),
  );

  const boldest: BoldTake[] = forecasts
    .filter((f) => (byProp.get(f.prop_id)?.length ?? 0) >= MIN_FOR_BOLD)
    .map((f) => ({
      forecastId: f.forecast_id,
      propId: f.prop_id,
      propText: f.prop_text,
      userName: f.user_name,
      isYou: f.user_id === currentUserId,
      forecast: f.forecast,
      crowdMean: crowdMean.get(f.prop_id)!,
    }))
    .sort(
      (a, b) =>
        Math.abs(b.forecast - b.crowdMean) - Math.abs(a.forecast - a.crowdMean),
    )
    .slice(0, BOLDEST_SHOWN);

  const byUser = new Map<number, BinaryForecast[]>();
  for (const f of forecasts) {
    const bucket = byUser.get(f.user_id);
    if (bucket) bucket.push(f);
    else byUser.set(f.user_id, [f]);
  }

  const certainties: Certainty[] = [...byUser.values()]
    .map((group) => ({
      userId: group[0].user_id,
      userName: group[0].user_name,
      isYou: group[0].user_id === currentUserId,
      certainty: mean(group.map((f) => Math.abs(f.forecast - 0.5))),
      n: group.length,
    }))
    .sort((a, b) => b.certainty - a.certainty);

  return {
    competitionId,
    competitionName,
    forecastCount: forecasts.length,
    forecasterCount: byUser.size,
    spreads,
    boldest,
    certainties,
  };
}
