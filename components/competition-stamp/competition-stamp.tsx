import type { CompetitionStatus } from "@/lib/competition-status";

/**
 * Where a season is in its life.
 *
 * Deliberately four states and not five: privacy is orthogonal to the
 * lifecycle. A private competition is taking forecasts — off per-prop dates
 * rather than season-level ones — so it stamps `open`, and the pages that
 * care mark it private separately.
 */
export type SeasonState = "upcoming" | "open" | "scoring" | "final";

const LABEL: Record<SeasonState, string> = {
  upcoming: "Upcoming",
  open: "Open",
  scoring: "Scoring",
  final: "Final",
};

const FROM_STATUS: Record<CompetitionStatus, SeasonState> = {
  upcoming: "upcoming",
  "forecasts-open": "open",
  private: "open",
  "forecasts-closed": "scoring",
  ended: "final",
};

/** The lifecycle state a competition status stands for. */
export function seasonStateOf(status: CompetitionStatus): SeasonState {
  return FROM_STATUS[status];
}

/**
 * A season's state, printed as a stamp rather than said as a small word.
 *
 * The styling is in `app/globals.css` as `.riso-stamp`, not injected here:
 * this mark appears on four different sheets and inside portalled content, so
 * one copy in the stylesheet serves all of them.
 */
export function CompetitionStamp({ state }: { state: SeasonState }) {
  return <span className={`riso-stamp ${state}`}>{LABEL[state]}</span>;
}
