/** Which section of the stats sheet is showing. Mirrored in `?view=`. */
export type Tab = "divisive" | "boldest" | "certainty";

/** The `?view=` values, and the only ones a URL may name. */
export const TAB_IDS: Tab[] = ["divisive", "boldest", "certainty"];

/** Where the crowd landed on one prop. */
export interface PropSpread {
  propId: number;
  text: string;
  /** How many people forecasted it. */
  n: number;
  min: number;
  p25: number;
  mean: number;
  p75: number;
  max: number;
  /** The viewer's own forecast, when they made one. */
  yours: number | null;
}

/** One forecast that sits a long way from what everyone else said. */
export interface BoldTake {
  forecastId: number;
  propId: number;
  propText: string;
  userName: string;
  isYou: boolean;
  forecast: number;
  crowdMean: number;
}

/** How far from a coin flip one forecaster tends to sit. */
export interface Certainty {
  userId: number;
  userName: string;
  isYou: boolean;
  /** Mean |forecast − 0.5|, so 0 is always a coin flip and 0.5 always certain. */
  certainty: number;
  n: number;
}

export interface ForecastStatsData {
  competitionId: number;
  competitionName: string;
  /** Binary forecasts counted; choice props are excluded from all of this. */
  forecastCount: number;
  forecasterCount: number;
  spreads: PropSpread[];
  boldest: BoldTake[];
  certainties: Certainty[];
}
