import type { SeasonState } from "@/components/competition-stamp/competition-stamp";
import type { SeasonPhase } from "@/components/dashboard/dashboard-view";

export type { SeasonPhase, SeasonState };

/** One line of the standings. */
export interface Standing {
  userId: number;
  userName: string;
  score: number;
  /**
   * Hasn't forecasted every prop. Their Brier score isn't comparable to a
   * complete forecaster's, so the leaderboard hides them by default.
   */
  incomplete: boolean;
}

/** A prop still open for forecasting. */
export interface OpenProp {
  propId: number;
  propText: string;
  /** Null when the prop has no deadline of its own. */
  deadline: Date | null;
  hasUserForecast: boolean;
}

/** Where the viewer sits, when they sit anywhere. */
export interface YourStanding {
  rank: number;
  score: number;
  /** Among complete forecasters only — see Standing.incomplete. */
  incomplete: boolean;
}

/**
 * Everything the competition page renders, flattened from the six server
 * actions the route calls. Presentational components take this and nothing
 * else, so they can be storied and reviewed without a database.
 */
export interface CompetitionViewData {
  id: number;
  name: string;
  isPrivate: boolean;
  /** Drives what the layout leads with. */
  phase: SeasonPhase;
  /**
   * What the masthead stamps. Kept separate from `phase` because the five
   * statuses don't collapse cleanly for display: an `upcoming` competition is
   * pre-live, and calling it "Open" would be a lie. Only admins can see one,
   * but the stamp still has to be true.
   */
  state: SeasonState;
  /** Members for a private competition; scored forecasters for a public one. */
  fieldSize: number;
  counts: {
    /** Open props the viewer has NOT forecasted yet. The call to action. */
    toForecast: number;
    /** Open props in total, forecasted or not. */
    open: number;
    /** Past deadline, awaiting a resolution. */
    unresolved: number;
    resolved: number;
    total: number;
  };
  you: YourStanding | null;
  /** Open props the viewer still owes a forecast, soonest deadline first. */
  owed: OpenProp[];
  /** Every scored forecaster, best (lowest Brier) first. */
  standings: Standing[];
}
