import type { Standing } from "./dashboard-view";

/** Which seasons the dashboard lists; the `SeasonFilter` writes it. */
export const SHOW_PARAM = "show";

/**
 * Whether the URL is asking for every season.
 *
 * Anything but the exact string "all" reads as the default, so a hand-typed or
 * stale parameter degrades to the normal view rather than to an empty one.
 */
export function wantsAll(
  params: Record<string, string | string[] | undefined>,
): boolean {
  const asked = params[SHOW_PARAM];
  return (Array.isArray(asked) ? asked[0] : asked) === "all";
}

/**
 * The seasons to list.
 *
 * A finished season is still a result worth keeping, so nothing is dropped from
 * the data — the default view just leaves them out until asked. `scoring` is
 * NOT finished: forecasting has shut but props are still resolving, so the
 * standing can still move and the season is still active.
 */
export function visibleSeasons(
  standings: Standing[],
  showAll: boolean,
): Standing[] {
  if (showAll) return standings;
  return standings.filter((s) => s.phase !== "final");
}
